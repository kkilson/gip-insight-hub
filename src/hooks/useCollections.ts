import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { differenceInDays, addMonths } from 'date-fns';

export type CollectionStatus = 'pendiente' | 'contacto_asesor' | 'cobrada';

export interface Collection {
  id: string;
  policy_id: string;
  client_id: string;
  due_date: string;
  amount: number;
  payment_frequency: string;
  status: CollectionStatus;
  promised_date: string | null;
  advisor_notes: string | null;
  advisor_contacted_at: string | null;
  paid_at: string | null;
  paid_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  client?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
  };
  policy?: {
    id: string;
    policy_number: string | null;
    insurer_id: string | null;
    product_id: string | null;
    insurer?: { name: string; short_name: string | null } | null;
    product?: { name: string; category: string | null } | null;
  };
}

export interface CollectionFilters {
  status?: CollectionStatus | 'all';
  search?: string;
  daysOverdueMin?: number;
  daysOverdueMax?: number;
  dueDateFrom?: string;
  dueDateTo?: string;
}

// Calculate days overdue (positive = overdue, negative = upcoming)
export function calculateDaysOverdue(dueDate: string, status: CollectionStatus): number {
  if (status === 'cobrada') return 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  return differenceInDays(today, due);
}

// Calculate next payment date based on frequency
export function calculateNextPaymentDate(currentDueDate: string, frequency: string): Date {
  const current = new Date(currentDueDate);
  
  switch (frequency) {
    case 'mensual':
    case 'mensual_10_cuotas':
    case 'mensual_12_cuotas':
      return addMonths(current, 1);
    case 'bimensual':
      return addMonths(current, 2);
    case 'trimestral':
      return addMonths(current, 3);
    case 'semestral':
      return addMonths(current, 6);
    case 'anual':
      return addMonths(current, 12);
    default:
      return addMonths(current, 1);
  }
}

export function useCollections(filters: CollectionFilters = {}) {
  return useQuery({
    queryKey: ['collections', filters],
    queryFn: async () => {
      let query = supabase
        .from('collections')
        .select(`
          *,
          client:clients(id, first_name, last_name, email, phone, mobile),
          policy:policies(
            id, 
            policy_number, 
            insurer_id, 
            product_id,
            insurer:insurers(name, short_name),
            product:products(name, category)
          )
        `)
        .order('due_date', { ascending: true });

      // Filter by status
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Filter by due date range
      if (filters.dueDateFrom) {
        query = query.gte('due_date', filters.dueDateFrom);
      }
      if (filters.dueDateTo) {
        query = query.lte('due_date', filters.dueDateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Client-side filtering for search and days overdue
      let result = (data || []) as Collection[];

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter((c) => {
          const clientName = `${c.client?.first_name || ''} ${c.client?.last_name || ''}`.toLowerCase();
          const policyNumber = c.policy?.policy_number?.toLowerCase() || '';
          return clientName.includes(searchLower) || policyNumber.includes(searchLower);
        });
      }

      // Days overdue filter
      if (filters.daysOverdueMin !== undefined || filters.daysOverdueMax !== undefined) {
        result = result.filter((c) => {
          const days = calculateDaysOverdue(c.due_date, c.status);
          if (filters.daysOverdueMin !== undefined && days < filters.daysOverdueMin) return false;
          if (filters.daysOverdueMax !== undefined && days > filters.daysOverdueMax) return false;
          return true;
        });
      }

      return result;
    },
  });
}

export function useCollectionStats() {
  return useQuery({
    queryKey: ['collection-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collections')
        .select('id, status, amount, due_date')
        .neq('status', 'cobrada');

      if (error) throw error;

      const collections = data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalPending: 0,
        totalAmount: 0,
        overdue: 0,
        overdueAmount: 0,
        upcoming: 0,
        upcomingAmount: 0,
        contactAdvisor: 0,
      };

      collections.forEach((c) => {
        stats.totalPending++;
        stats.totalAmount += Number(c.amount) || 0;

        if (c.status === 'contacto_asesor') {
          stats.contactAdvisor++;
        }

        const dueDate = new Date(c.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          stats.overdue++;
          stats.overdueAmount += Number(c.amount) || 0;
        } else {
          stats.upcoming++;
          stats.upcomingAmount += Number(c.amount) || 0;
        }
      });

      return stats;
    },
  });
}

export function useMarkAsPaid() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      collectionId, 
      userId 
    }: { 
      collectionId: string; 
      userId: string;
    }) => {
      // Get collection details first
      const { data: collection, error: fetchError } = await supabase
        .from('collections')
        .select('*, policy:policies(id, premium_payment_date, payment_frequency)')
        .eq('id', collectionId)
        .single();

      if (fetchError) throw fetchError;

      // Update collection to cobrada
      const { error: updateError } = await supabase
        .from('collections')
        .update({
          status: 'cobrada',
          paid_at: new Date().toISOString(),
          paid_by: userId,
        })
        .eq('id', collectionId);

      if (updateError) throw updateError;

      // Add history record
      await supabase.from('collection_history').insert({
        collection_id: collectionId,
        previous_status: collection.status,
        new_status: 'cobrada',
        notes: 'Marcado como cobrada',
        changed_by: userId,
      });

      // Calculate next payment date and update policy
      const nextPaymentDate = calculateNextPaymentDate(
        collection.due_date,
        collection.payment_frequency
      );

      await supabase
        .from('policies')
        .update({ premium_payment_date: nextPaymentDate.toISOString().split('T')[0] })
        .eq('id', collection.policy_id);

      // Create next collection record
      await supabase.from('collections').insert({
        policy_id: collection.policy_id,
        client_id: collection.client_id,
        due_date: nextPaymentDate.toISOString().split('T')[0],
        amount: collection.amount,
        payment_frequency: collection.payment_frequency,
        status: 'pendiente',
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      queryClient.invalidateQueries({ queryKey: ['policies'] });
      toast({
        title: 'Cobranza registrada',
        description: 'El pago ha sido registrado y se creó la próxima cobranza.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo registrar el pago.',
        variant: 'destructive',
      });
      console.error('Error marking as paid:', error);
    },
  });
}

export function useMarkAsAdvisorContact() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      promisedDate,
      notes,
      userId,
    }: {
      collectionId: string;
      promisedDate: string;
      notes: string;
      userId: string;
    }) => {
      // Get current status
      const { data: collection, error: fetchError } = await supabase
        .from('collections')
        .select('status')
        .eq('id', collectionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('collections')
        .update({
          status: 'contacto_asesor',
          promised_date: promisedDate,
          advisor_notes: notes,
          advisor_contacted_at: new Date().toISOString(),
        })
        .eq('id', collectionId);

      if (error) throw error;

      // Add history record
      await supabase.from('collection_history').insert({
        collection_id: collectionId,
        previous_status: collection.status,
        new_status: 'contacto_asesor',
        notes: `Fecha prometida: ${promisedDate}. ${notes}`,
        changed_by: userId,
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      toast({
        title: 'Estado actualizado',
        description: 'Se ha registrado el contacto con el asesor.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el estado.',
        variant: 'destructive',
      });
      console.error('Error updating status:', error);
    },
  });
}

export function useRevertToPending() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      collectionId,
      userId,
    }: {
      collectionId: string;
      userId: string;
    }) => {
      const { data: collection, error: fetchError } = await supabase
        .from('collections')
        .select('status')
        .eq('id', collectionId)
        .single();

      if (fetchError) throw fetchError;

      const { error } = await supabase
        .from('collections')
        .update({
          status: 'pendiente',
          promised_date: null,
          advisor_notes: null,
          advisor_contacted_at: null,
        })
        .eq('id', collectionId);

      if (error) throw error;

      await supabase.from('collection_history').insert({
        collection_id: collectionId,
        previous_status: collection.status,
        new_status: 'pendiente',
        notes: 'Revertido a pendiente',
        changed_by: userId,
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['collection-stats'] });
      toast({
        title: 'Estado actualizado',
        description: 'La cobranza ha sido revertida a pendiente.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo revertir el estado.',
        variant: 'destructive',
      });
      console.error('Error reverting status:', error);
    },
  });
}
