import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, addDays } from 'date-fns';

export interface DashboardStats {
  clientes: {
    total: number;
    thisMonth: number;
  };
  renovaciones: {
    count: number;
    amount: number;
    thisWeek: number;
  };
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const today = new Date();
      const monthStart = startOfMonth(today);
      const monthEnd = endOfMonth(today);
      const weekFromNow = addDays(today, 7);
      const thirtyDaysFromNow = addDays(today, 30);

      // Get total clients
      const { count: totalClients } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Get clients created this month
      const { count: clientsThisMonth } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString())
        .lte('created_at', monthEnd.toISOString());

      // Get policies expiring in next 30 days (renewals)
      const { data: renewalPolicies } = await supabase
        .from('policies')
        .select('id, premium, end_date')
        .eq('status', 'vigente')
        .gte('end_date', today.toISOString().split('T')[0])
        .lte('end_date', thirtyDaysFromNow.toISOString().split('T')[0]);

      const renewalCount = renewalPolicies?.length || 0;
      const renewalAmount = renewalPolicies?.reduce((sum, p) => sum + (Number(p.premium) || 0), 0) || 0;

      // Get policies expiring this week
      const renewalsThisWeek = renewalPolicies?.filter(p => {
        const endDate = new Date(p.end_date);
        return endDate <= weekFromNow;
      }).length || 0;

      return {
        clientes: {
          total: totalClients || 0,
          thisMonth: clientsThisMonth || 0,
        },
        renovaciones: {
          count: renewalCount,
          amount: renewalAmount,
          thisWeek: renewalsThisWeek,
        },
      };
    },
  });
}
