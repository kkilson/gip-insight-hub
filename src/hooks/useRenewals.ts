import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, startOfDay, endOfDay, format } from 'date-fns';

export type RenewalStatus = 'pendiente' | 'programada' | 'enviada' | 'error' | 'completada';

export interface RenewalWithDetails {
  id: string;
  policy_id: string;
  renewal_date: string;
  current_amount: number;
  new_amount: number | null;
  difference: number;
  percentage: number;
  status: RenewalStatus;
  scheduled_send_date: string | null;
  pdf_generated: boolean;
  email_sent: boolean;
  email_sent_at: string | null;
  notes: string | null;
  created_at: string;
  policy: {
    id: string;
    policy_number: string | null;
    premium: number | null;
    start_date: string;
    end_date: string;
    status: string | null;
    payment_frequency: string | null;
    client: {
      id: string;
      first_name: string;
      last_name: string;
      email: string | null;
      phone: string | null;
      mobile: string | null;
    };
    insurer: {
      id: string;
      name: string;
      short_name: string | null;
    } | null;
    product: {
      id: string;
      name: string;
    } | null;
  };
}

export interface PolicyForRenewal {
  id: string;
  policy_number: string | null;
  premium: number | null;
  start_date: string;
  end_date: string;
  status: string | null;
  payment_frequency: string | null;
  client: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
    mobile: string | null;
  };
  insurer: {
    id: string;
    name: string;
    short_name: string | null;
  } | null;
  product: {
    id: string;
    name: string;
  } | null;
  renewal_config: {
    id: string;
    status: RenewalStatus;
    new_amount: number | null;
    scheduled_send_date: string | null;
  } | null;
}

export interface RenewalFilters {
  status?: RenewalStatus | 'all' | 'sin_config';
  daysAhead?: number;
  search?: string;
}

// Get policies expiring within a date range (for renewal management)
export function useRenewalPolicies(filters: RenewalFilters = {}) {
  const { daysAhead = 30, status = 'all', search = '' } = filters;

  return useQuery({
    queryKey: ['renewal-policies', filters],
    queryFn: async (): Promise<PolicyForRenewal[]> => {
      const today = startOfDay(new Date());
      const futureDate = endOfDay(addDays(today, daysAhead));

      // Get policies expiring in the next N days
      let query = supabase
        .from('policies')
        .select(`
          id,
          policy_number,
          premium,
          start_date,
          end_date,
          status,
          payment_frequency,
          client:clients!inner(
            id,
            first_name,
            last_name,
            email,
            phone,
            mobile
          ),
          insurer:insurers(
            id,
            name,
            short_name
          ),
          product:products(
            id,
            name
          )
        `)
        .eq('status', 'vigente')
        .gte('end_date', format(today, 'yyyy-MM-dd'))
        .lte('end_date', format(futureDate, 'yyyy-MM-dd'))
        .order('end_date', { ascending: true });

      if (search) {
        query = query.or(`policy_number.ilike.%${search}%,clients.first_name.ilike.%${search}%,clients.last_name.ilike.%${search}%`);
      }

      const { data: policies, error } = await query;

      if (error) throw error;

      // Get renewal configs for these policies
      const policyIds = policies?.map(p => p.id) || [];
      
      let renewalConfigs: Record<string, any> = {};
      if (policyIds.length > 0) {
        const { data: configs } = await supabase
          .from('renewal_configs')
          .select('id, policy_id, status, new_amount, scheduled_send_date')
          .in('policy_id', policyIds);

        if (configs) {
          renewalConfigs = configs.reduce((acc, config) => {
            acc[config.policy_id] = config;
            return acc;
          }, {} as Record<string, any>);
        }
      }

      // Combine policies with their renewal configs
      let result = (policies || []).map(policy => ({
        ...policy,
        client: Array.isArray(policy.client) ? policy.client[0] : policy.client,
        insurer: Array.isArray(policy.insurer) ? policy.insurer[0] : policy.insurer,
        product: Array.isArray(policy.product) ? policy.product[0] : policy.product,
        renewal_config: renewalConfigs[policy.id] || null,
      })) as PolicyForRenewal[];

      // Filter by status
      if (status === 'sin_config') {
        result = result.filter(p => !p.renewal_config);
      } else if (status !== 'all') {
        result = result.filter(p => p.renewal_config?.status === status);
      }

      return result;
    },
  });
}

// Get renewal statistics
export function useRenewalStats() {
  return useQuery({
    queryKey: ['renewal-stats'],
    queryFn: async () => {
      const today = startOfDay(new Date());
      const thirtyDaysAhead = endOfDay(addDays(today, 30));
      const sevenDaysAhead = endOfDay(addDays(today, 7));

      // Get policies expiring in next 30 days
      const { data: policies30, error: error30 } = await supabase
        .from('policies')
        .select('id, premium, end_date')
        .eq('status', 'vigente')
        .gte('end_date', format(today, 'yyyy-MM-dd'))
        .lte('end_date', format(thirtyDaysAhead, 'yyyy-MM-dd'));

      if (error30) throw error30;

      const policyIds = policies30?.map(p => p.id) || [];

      // Get renewal configs for these policies
      let configsByStatus: Record<string, number> = {
        pendiente: 0,
        programada: 0,
        enviada: 0,
        error: 0,
        completada: 0,
      };

      let configuredPolicyIds: string[] = [];

      if (policyIds.length > 0) {
        const { data: configs } = await supabase
          .from('renewal_configs')
          .select('id, policy_id, status, new_amount, current_amount, percentage')
          .in('policy_id', policyIds);

        if (configs) {
          configs.forEach(c => {
            configsByStatus[c.status]++;
            configuredPolicyIds.push(c.policy_id);
          });
        }
      }

      // Calculate policies without config
      const withoutConfig = policyIds.filter(id => !configuredPolicyIds.includes(id)).length;

      // Get policies expiring this week
      const thisWeekPolicies = policies30?.filter(p => {
        const endDate = new Date(p.end_date);
        return endDate <= sevenDaysAhead;
      }) || [];

      // Calculate total premium volume
      const totalPremium = policies30?.reduce((sum, p) => sum + (Number(p.premium) || 0), 0) || 0;

      return {
        total30Days: policies30?.length || 0,
        thisWeek: thisWeekPolicies.length,
        totalPremium,
        byStatus: configsByStatus,
        withoutConfig,
        programadas: configsByStatus.programada,
        enviadas: configsByStatus.enviada,
      };
    },
  });
}

// Create or update renewal config
export function useUpsertRenewalConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      policy_id: string;
      renewal_date: string;
      current_amount: number;
      new_amount?: number;
      status?: RenewalStatus;
      scheduled_send_date?: string;
      notes?: string;
    }) => {
      const { data: user } = await supabase.auth.getUser();
      
      const { data: result, error } = await supabase
        .from('renewal_configs')
        .upsert({
          ...data,
          created_by: user.user?.id,
        }, {
          onConflict: 'policy_id,renewal_date',
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-policies'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-stats'] });
    },
  });
}

// Update renewal status
export function useUpdateRenewalStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: RenewalStatus; notes?: string }) => {
      const { data, error } = await supabase
        .from('renewal_configs')
        .update({ status, notes })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['renewal-policies'] });
      queryClient.invalidateQueries({ queryKey: ['renewal-stats'] });
    },
  });
}
