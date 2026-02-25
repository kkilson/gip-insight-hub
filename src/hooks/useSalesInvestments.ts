import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface SalesInvestment {
  id: string;
  opportunity_id: string;
  description: string;
  amount: number;
  investment_date: string;
  created_by: string | null;
  created_at: string;
}

export function useSalesInvestments(opportunityId: string | null) {
  return useQuery({
    queryKey: ['sales-investments', opportunityId],
    enabled: !!opportunityId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_investments')
        .select('*')
        .eq('opportunity_id', opportunityId!)
        .order('investment_date', { ascending: false });
      if (error) throw error;
      return data as unknown as SalesInvestment[];
    },
  });
}

export function useAddSalesInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inv: { opportunityId: string; description: string; amount: number; investment_date: string }) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { error } = await supabase.from('sales_investments').insert({
        opportunity_id: inv.opportunityId,
        description: inv.description,
        amount: inv.amount,
        investment_date: inv.investment_date,
        created_by: userId,
      });
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['sales-investments', vars.opportunityId] });
      toast.success('Inversión registrada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteSalesInvestment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, opportunityId }: { id: string; opportunityId: string }) => {
      const { error } = await supabase.from('sales_investments').delete().eq('id', id);
      if (error) throw error;
      return opportunityId;
    },
    onSuccess: (opportunityId) => {
      qc.invalidateQueries({ queryKey: ['sales-investments', opportunityId] });
      toast.success('Inversión eliminada');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
