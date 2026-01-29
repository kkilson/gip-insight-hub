import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export interface UsageType {
  id: string;
  name: string;
  is_active: boolean;
}

export interface Consumption {
  id: string;
  policy_id: string;
  beneficiary_id: string | null;
  beneficiary_name: string | null;
  usage_type_id: string;
  usage_date: string;
  description: string;
  amount_bs: number | null;
  amount_usd: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  usage_type?: UsageType;
  policy?: {
    id: string;
    policy_number: string | null;
    client: {
      id: string;
      first_name: string;
      last_name: string;
    };
  };
}

export interface ConsumptionFilters {
  policy_id?: string;
  beneficiary?: string;
  usage_type_id?: string;
  from_date?: string;
  to_date?: string;
  search?: string;
}

export interface ConsumptionSummary {
  total_bs: number;
  total_usd: number;
  count: number;
  by_type: {
    type_name: string;
    count: number;
    total_bs: number;
    total_usd: number;
  }[];
}

// Get all usage types
export function useUsageTypes() {
  return useQuery({
    queryKey: ['usage-types'],
    queryFn: async (): Promise<UsageType[]> => {
      const { data, error } = await supabase
        .from('usage_types')
        .select('*')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

// Get consumptions with filters
export function useConsumptions(filters: ConsumptionFilters = {}) {
  return useQuery({
    queryKey: ['consumptions', filters],
    queryFn: async (): Promise<Consumption[]> => {
      let query = supabase
        .from('policy_consumptions')
        .select(`
          *,
          usage_type:usage_types(id, name, is_active),
          policy:policies(
            id,
            policy_number,
            client:clients(id, first_name, last_name)
          )
        `)
        .eq('deleted', false)
        .order('usage_date', { ascending: false });

      if (filters.policy_id) {
        query = query.eq('policy_id', filters.policy_id);
      }

      if (filters.usage_type_id) {
        query = query.eq('usage_type_id', filters.usage_type_id);
      }

      if (filters.from_date) {
        query = query.gte('usage_date', filters.from_date);
      }

      if (filters.to_date) {
        query = query.lte('usage_date', filters.to_date);
      }

      if (filters.beneficiary) {
        query = query.ilike('beneficiary_name', `%${filters.beneficiary}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(item => ({
        ...item,
        usage_type: Array.isArray(item.usage_type) ? item.usage_type[0] : item.usage_type,
        policy: Array.isArray(item.policy) ? item.policy[0] : item.policy,
      })) as Consumption[];
    },
  });
}

// Get consumption summary for a policy
export function useConsumptionSummary(policyId: string | null) {
  return useQuery({
    queryKey: ['consumption-summary', policyId],
    enabled: !!policyId,
    queryFn: async (): Promise<ConsumptionSummary> => {
      if (!policyId) {
        return { total_bs: 0, total_usd: 0, count: 0, by_type: [] };
      }

      const { data, error } = await supabase
        .from('policy_consumptions')
        .select(`
          amount_bs,
          amount_usd,
          usage_type:usage_types(name)
        `)
        .eq('policy_id', policyId)
        .eq('deleted', false);

      if (error) throw error;

      const consumptions = data || [];

      // Calculate totals
      const total_bs = consumptions.reduce((sum, c) => sum + (Number(c.amount_bs) || 0), 0);
      const total_usd = consumptions.reduce((sum, c) => sum + (Number(c.amount_usd) || 0), 0);

      // Group by type
      const byTypeMap: Record<string, { count: number; total_bs: number; total_usd: number }> = {};
      
      consumptions.forEach(c => {
        const typeName = Array.isArray(c.usage_type) 
          ? c.usage_type[0]?.name 
          : (c.usage_type as any)?.name || 'Sin tipo';
        
        if (!byTypeMap[typeName]) {
          byTypeMap[typeName] = { count: 0, total_bs: 0, total_usd: 0 };
        }
        byTypeMap[typeName].count++;
        byTypeMap[typeName].total_bs += Number(c.amount_bs) || 0;
        byTypeMap[typeName].total_usd += Number(c.amount_usd) || 0;
      });

      const by_type = Object.entries(byTypeMap).map(([type_name, stats]) => ({
        type_name,
        ...stats,
      }));

      return {
        total_bs,
        total_usd,
        count: consumptions.length,
        by_type,
      };
    },
  });
}

// Create consumption
export function useCreateConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      policy_id: string;
      beneficiary_id?: string | null;
      beneficiary_name: string;
      usage_type_id: string;
      usage_date: string;
      description: string;
      amount_bs?: number | null;
      amount_usd?: number | null;
    }) => {
      const { data: user } = await supabase.auth.getUser();

      const { data: result, error } = await supabase
        .from('policy_consumptions')
        .insert({
          ...data,
          created_by: user.user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumptions'] });
      queryClient.invalidateQueries({ queryKey: ['consumption-summary'] });
    },
  });
}

// Update consumption
export function useUpdateConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      beneficiary_id?: string | null;
      beneficiary_name?: string;
      usage_type_id?: string;
      usage_date?: string;
      description?: string;
      amount_bs?: number | null;
      amount_usd?: number | null;
    }) => {
      const { data: result, error } = await supabase
        .from('policy_consumptions')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumptions'] });
      queryClient.invalidateQueries({ queryKey: ['consumption-summary'] });
    },
  });
}

// Soft delete consumption
export function useDeleteConsumption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data: user } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('policy_consumptions')
        .update({
          deleted: true,
          deleted_at: new Date().toISOString(),
          deleted_by: user.user?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consumptions'] });
      queryClient.invalidateQueries({ queryKey: ['consumption-summary'] });
    },
  });
}

// Create new usage type
export function useCreateUsageType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) => {
      const { data, error } = await supabase
        .from('usage_types')
        .insert({ name })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-types'] });
    },
  });
}
