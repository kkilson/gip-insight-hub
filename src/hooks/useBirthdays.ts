import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, getMonth, getDate, isToday, isBefore, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export type BirthdayStatus = 'hoy' | 'pendiente' | 'enviado' | 'proximo' | 'pasado';

export interface BirthdayClient {
  id: string;
  clientId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  birthDate: string;
  birthDay: number;
  birthMonth: number;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  advisorId: string | null;
  advisorName: string | null;
  status: BirthdayStatus;
  sentAt: string | null;
  sendId: string | null;
  channels: string[];
  statusWhatsapp: string | null;
  statusEmail: string | null;
}

export interface BirthdayStats {
  total: number;
  sent: number;
  pending: number;
  today: number;
  passed: number;
}

type MonthFilter = 'previous' | 'current' | 'next';

export function useBirthdays(monthFilter: MonthFilter = 'current', year?: number) {
  const today = new Date();
  const currentYear = year || today.getFullYear();
  
  // Calculate target month based on filter
  const getTargetMonth = (): number => {
    const currentMonth = today.getMonth(); // 0-11
    switch (monthFilter) {
      case 'previous':
        return currentMonth === 0 ? 11 : currentMonth - 1;
      case 'next':
        return currentMonth === 11 ? 0 : currentMonth + 1;
      default:
        return currentMonth;
    }
  };
  
  const getTargetYear = (): number => {
    const currentMonth = today.getMonth();
    if (monthFilter === 'previous' && currentMonth === 0) {
      return currentYear - 1;
    }
    if (monthFilter === 'next' && currentMonth === 11) {
      return currentYear + 1;
    }
    return currentYear;
  };
  
  const targetMonth = getTargetMonth() + 1; // 1-12 for SQL
  const targetYear = getTargetYear();

  return useQuery({
    queryKey: ['birthdays', monthFilter, targetYear],
    queryFn: async (): Promise<{ birthdays: BirthdayClient[]; stats: BirthdayStats }> => {
      // Get clients with birthdays in the target month
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select(`
          id,
          first_name,
          last_name,
          birth_date,
          email,
          phone,
          mobile,
          advisor_id,
          advisors (
            id,
            full_name
          )
        `)
        .not('birth_date', 'is', null);

      if (clientsError) throw clientsError;

      // Filter clients by birth month
      const clientsInMonth = (clients || []).filter(client => {
        if (!client.birth_date) return false;
        const birthDate = new Date(client.birth_date);
        return birthDate.getMonth() + 1 === targetMonth;
      });

      // Get birthday sends for the target year
      const clientIds = clientsInMonth.map(c => c.id);
      
      let sends: any[] = [];
      if (clientIds.length > 0) {
        const { data: sendsData, error: sendsError } = await supabase
          .from('birthday_sends')
          .select('*')
          .eq('send_year', targetYear)
          .in('client_id', clientIds);

        if (sendsError) throw sendsError;
        sends = sendsData || [];
      }

      // Build birthday list with status
      const birthdays: BirthdayClient[] = clientsInMonth.map(client => {
        const birthDate = new Date(client.birth_date!);
        const birthDay = birthDate.getDate();
        const birthMonth = birthDate.getMonth() + 1;
        
        // Check if sent this year
        const send = sends.find(s => s.client_id === client.id);
        
        // Determine status
        let status: BirthdayStatus = 'pendiente';
        
        // Create a date for comparison using target year
        const birthdayThisYear = new Date(targetYear, birthMonth - 1, birthDay);
        const todayStart = startOfDay(today);
        
        if (send) {
          status = 'enviado';
        } else if (
          birthDay === today.getDate() && 
          birthMonth === today.getMonth() + 1 &&
          targetYear === today.getFullYear()
        ) {
          status = 'hoy';
        } else if (isBefore(birthdayThisYear, todayStart)) {
          status = 'pasado';
        } else if (isBefore(birthdayThisYear, addDays(todayStart, 3))) {
          status = 'pendiente';
        } else {
          status = 'proximo';
        }

        const advisor = client.advisors as any;

        return {
          id: `${client.id}-${targetYear}`,
          clientId: client.id,
          firstName: client.first_name,
          lastName: client.last_name,
          fullName: `${client.first_name} ${client.last_name}`,
          birthDate: client.birth_date!,
          birthDay,
          birthMonth,
          email: client.email,
          phone: client.phone,
          mobile: client.mobile,
          advisorId: client.advisor_id,
          advisorName: advisor?.full_name || null,
          status,
          sentAt: send?.sent_at || null,
          sendId: send?.id || null,
          channels: send?.channels || [],
          statusWhatsapp: send?.status_whatsapp || null,
          statusEmail: send?.status_email || null,
        };
      });

      // Sort by day of month
      birthdays.sort((a, b) => a.birthDay - b.birthDay);

      // Calculate stats
      const stats: BirthdayStats = {
        total: birthdays.length,
        sent: birthdays.filter(b => b.status === 'enviado').length,
        pending: birthdays.filter(b => ['pendiente', 'hoy', 'proximo'].includes(b.status)).length,
        today: birthdays.filter(b => b.status === 'hoy').length,
        passed: birthdays.filter(b => b.status === 'pasado').length,
      };

      return { birthdays, stats };
    },
  });
}

export function useBirthdaySend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      clientId,
      channels,
      year,
      clientName,
      clientEmail,
    }: {
      clientId: string;
      channels: ('whatsapp' | 'email')[];
      year: number;
      clientName?: string;
      clientEmail?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user');

      let emailStatus: string | null = channels.includes('email') ? 'pendiente' : null;

      // Send email if channel selected and email available
      if (channels.includes('email') && clientEmail) {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData?.session?.access_token;
          
          const response = await supabase.functions.invoke('send-email', {
            body: {
              to: clientEmail,
              subject: `¡Feliz Cumpleaños ${clientName || ''}!`.trim(),
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="text-align: center; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 12px; color: white;">
                    <h1 style="font-size: 28px; margin: 0;">🎂 ¡Feliz Cumpleaños!</h1>
                    <p style="font-size: 18px; margin-top: 10px;">${clientName || 'Estimado/a cliente'}</p>
                  </div>
                  <div style="padding: 20px; text-align: center;">
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                      En este día tan especial, queremos enviarle nuestros más sinceros deseos de felicidad, salud y prosperidad.
                    </p>
                    <p style="font-size: 16px; color: #333; line-height: 1.6;">
                      ¡Que este nuevo año de vida esté lleno de grandes momentos!
                    </p>
                    <p style="font-size: 14px; color: #666; margin-top: 30px;">
                      Con cariño,<br/>
                      <strong>GIP Asesores Integrales</strong>
                    </p>
                  </div>
                </div>
              `,
            },
          });

          if (response.error) {
            console.error('Error sending birthday email:', response.error);
            emailStatus = 'error';
          } else {
            emailStatus = 'enviado';
          }
        } catch (err) {
          console.error('Error invoking send-email:', err);
          emailStatus = 'error';
        }
      }

      // Record the send
      const { data, error } = await supabase
        .from('birthday_sends')
        .insert({
          client_id: clientId,
          send_year: year,
          channels: channels,
          status_whatsapp: channels.includes('whatsapp') ? 'pendiente' : null,
          status_email: emailStatus,
          sent_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['birthdays'] });
    },
  });
}

export function useBirthdayHistory(clientId: string) {
  return useQuery({
    queryKey: ['birthday-history', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('birthday_sends')
        .select('*')
        .eq('client_id', clientId)
        .order('send_year', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!clientId,
  });
}

export function getMonthName(month: number): string {
  const date = new Date(2024, month - 1, 1);
  return format(date, 'MMMM', { locale: es });
}

export function formatBirthdayDate(day: number, month: number): string {
  const date = new Date(2024, month - 1, day);
  return format(date, "d 'de' MMMM", { locale: es });
}
