import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PayrollEmployee {
  id: string;
  full_name: string;
  base_salary_usd: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export function usePayrollEmployees() {
  return useQuery({
    queryKey: ['payroll-employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payroll_employees')
        .select('*')
        .eq('is_active', true)
        .order('full_name');
      if (error) throw error;
      return data as PayrollEmployee[];
    },
  });
}

export function useSaveEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (employee: { id?: string; full_name: string; base_salary_usd: number; notes?: string }) => {
      if (employee.id) {
        const { data, error } = await supabase
          .from('payroll_employees')
          .update({ full_name: employee.full_name, base_salary_usd: employee.base_salary_usd, notes: employee.notes || null })
          .eq('id', employee.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('payroll_employees')
          .insert({ full_name: employee.full_name, base_salary_usd: employee.base_salary_usd, notes: employee.notes || null, created_by: user?.id })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['payroll-employees'] });
      toast({ title: variables.id ? 'Empleado actualizado' : 'Empleado agregado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('payroll_employees')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-employees'] });
      toast({ title: 'Empleado eliminado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}
