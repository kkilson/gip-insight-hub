import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface FinanceDebt {
  id: string;
  debt_date: string;
  beneficiary: string;
  description: string;
  amount_usd: number;
  amount_ves: number;
  is_paid: boolean;
  paid_at: string | null;
  month: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceLoan {
  id: string;
  loan_date: string;
  beneficiary: string;
  description: string;
  amount_usd: number;
  amount_ves: number;
  is_collected: boolean;
  collected_at: string | null;
  month: string;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// DEBTS (Lo que debo)
// =============================================

export function useFinanceDebts(month?: string) {
  return useQuery({
    queryKey: ['finance-debts', month],
    queryFn: async () => {
      let query = supabase
        .from('finance_debts')
        .select('*')
        .order('debt_date', { ascending: false });
      if (month) query = query.eq('month', month);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinanceDebt[];
    },
  });
}

export function useSaveDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (debt: { id?: string; debt_date: string; month: string; beneficiary: string; description: string; amount_usd: number; amount_ves: number; is_paid?: boolean; notes?: string | null }) => {
      if (debt.id) {
        const { id, ...rest } = debt;
        const { data, error } = await supabase.from('finance_debts').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = debt as any;
        const { data, error } = await supabase.from('finance_debts').insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-debts'] });
      toast({ title: 'Deuda guardada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar deuda', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_debts').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-debts'] });
      toast({ title: 'Deuda eliminada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// LOANS (Lo que me deben)
// =============================================

export function useFinanceLoans(month?: string) {
  return useQuery({
    queryKey: ['finance-loans', month],
    queryFn: async () => {
      let query = supabase
        .from('finance_loans')
        .select('*')
        .order('loan_date', { ascending: false });
      if (month) query = query.eq('month', month);
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinanceLoan[];
    },
  });
}

export function useSaveLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (loan: { id?: string; loan_date: string; month: string; beneficiary: string; description: string; amount_usd: number; amount_ves: number; is_collected?: boolean; notes?: string | null }) => {
      if (loan.id) {
        const { id, ...rest } = loan;
        const { data, error } = await supabase.from('finance_loans').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = loan as any;
        const { data, error } = await supabase.from('finance_loans').insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-loans'] });
      toast({ title: 'Préstamo guardado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar préstamo', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_loans').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-loans'] });
      toast({ title: 'Préstamo eliminado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}
