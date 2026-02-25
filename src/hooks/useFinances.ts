import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// =============================================
// TYPES
// =============================================

export interface ExchangeRate {
  id: string;
  currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  source: 'BCV' | 'Binance' | 'Kontigo' | 'Manual';
  rate: number;
  recorded_at: string;
  recorded_by: string | null;
  is_manual: boolean;
  manual_reason: string | null;
  created_at: string;
}

export interface Budget {
  id: string;
  name: string;
  period: string;
  start_date: string;
  end_date: string;
  currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  total_budgeted_usd: number;
  total_spent_usd: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lines?: BudgetLine[];
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  line_number?: number;
  planned_date: string;
  description: string;
  can_pay_in_ves: boolean;
  amount_usd: number;
  reference_rate: number | null;
  status: 'pendiente' | 'pagado' | 'vencido' | 'pospuesto';
  actual_payment_date: string | null;
  actual_amount_usd: number | null;
  postponed_date: string | null;
  postpone_reason: string | null;
  reminder_date: string | null;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface BudgetFormData {
  name: string;
  period: 'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual' | 'bienal' | 'trienal' | 'cuatrienal' | 'quinquenal' | 'decenal';
  start_date: string;
  end_date: string;
  currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  notes: string | null;
  is_active: boolean;
}

export interface BudgetLineFormData {
  id?: string;
  day_of_month?: number;
  planned_date: string;
  description: string;
  can_pay_in_ves: boolean;
  amount_usd: number;
  amount_ves: number;
  reference_rate: number | null;
  status: 'pendiente' | 'pagado' | 'vencido' | 'pospuesto';
  reminder_date: string | null;
  category: string | null;
}

export interface Bank {
  id: string;
  name: string;
  code: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinanceIncome {
  id: string;
  income_date: string;
  month: string;
  description: string;
  amount_usd: number;
  amount_ves: number;
  exchange_rate: number | null;
  bank_id: string | null;
  bank?: Bank;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceExpense {
  id: string;
  expense_date: string;
  month: string;
  description: string;
  amount_usd: number;
  amount_ves: number;
  exchange_rate: number | null;
  is_paid: boolean;
  paid_at: string | null;
  beneficiary: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceInvoice {
  id: string;
  month: string;
  invoice_date: string;
  invoice_number: string;
  control_number: string | null;
  description: string;
  total_usd: number;
  total_ves: number;
  is_collected: boolean;
  collected_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceReceivable {
  id: string;
  source: string;
  invoice_id: string | null;
  description: string;
  amount_usd: number;
  amount_ves: number;
  due_date: string | null;
  is_collected: boolean;
  collected_at: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// EXCHANGE RATES
// =============================================

export function useExchangeRates(limit = 100) {
  return useQuery({
    queryKey: ['exchange-rates', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data as ExchangeRate[];
    },
  });
}

export function useLatestExchangeRates() {
  return useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: async () => {
      const currencies = ['USD', 'EUR', 'USDT'] as const;
      const sources = ['BCV', 'Binance', 'Kontigo'] as const;
      const rates: Record<string, ExchangeRate | null> = {};
      
      for (const currency of currencies) {
        for (const source of sources) {
          const { data, error } = await supabase
            .from('exchange_rates')
            .select('*')
            .eq('currency', currency)
            .eq('source', source)
            .order('recorded_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (!error && data) {
            rates[`${currency}_${source}`] = data as ExchangeRate;
          }
        }
      }
      return rates;
    },
  });
}

export function useAddExchangeRate() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (rate: Omit<ExchangeRate, 'id' | 'created_at' | 'recorded_at'>) => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .insert(rate)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      toast({ title: 'Tasa de cambio registrada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al registrar tasa', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// BUDGETS
// =============================================

export function useBudgets(filters?: { isActive?: boolean }) {
  return useQuery({
    queryKey: ['budgets', filters],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Budget[];
    },
  });
}

export function useBudget(id: string | null) {
  return useQuery({
    queryKey: ['budget', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single();
      
      if (budgetError) throw budgetError;
      
      const { data: lines, error: linesError } = await supabase
        .from('budget_lines')
        .select('*')
        .eq('budget_id', id)
        .order('planned_date');
      
      if (linesError) throw linesError;
      
      return { ...budget, lines } as unknown as Budget;
    },
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ budget, lines }: { budget: BudgetFormData; lines: BudgetLineFormData[] }) => {
      const total_budgeted_usd = lines.reduce((sum, line) => sum + line.amount_usd, 0);
      
      const { data: newBudget, error: budgetError } = await supabase
        .from('budgets')
        .insert({ ...budget, total_budgeted_usd, total_spent_usd: 0 })
        .select()
        .single();
      
      if (budgetError) throw budgetError;
      
      if (lines.length > 0) {
        const budgetLines = lines.map((line) => ({
          budget_id: newBudget.id,
          planned_date: line.planned_date,
          description: line.description,
          can_pay_in_ves: line.can_pay_in_ves,
          amount_usd: line.amount_usd,
          amount_ves: line.amount_ves || 0,
          reference_rate: line.reference_rate,
          status: line.status,
          reminder_date: line.reminder_date,
          category: line.category,
          day_of_month: line.day_of_month || null,
        }));
        
        const { error: linesError } = await supabase
          .from('budget_lines')
          .insert(budgetLines);
        
        if (linesError) throw linesError;
      }
      
      return newBudget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Presupuesto creado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al crear presupuesto', description: error.message, variant: 'destructive' });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, budget, lines }: { id: string; budget: BudgetFormData; lines: BudgetLineFormData[] }) => {
      const total_budgeted_usd = lines.reduce((sum, line) => sum + line.amount_usd, 0);
      
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({ ...budget, total_budgeted_usd })
        .eq('id', id);
      
      if (budgetError) throw budgetError;
      
      const { error: deleteError } = await supabase
        .from('budget_lines')
        .delete()
        .eq('budget_id', id);
      
      if (deleteError) throw deleteError;
      
      if (lines.length > 0) {
        const budgetLines = lines.map((line) => ({
          budget_id: id,
          planned_date: line.planned_date,
          description: line.description,
          can_pay_in_ves: line.can_pay_in_ves,
          amount_usd: line.amount_usd,
          amount_ves: line.amount_ves || 0,
          reference_rate: line.reference_rate,
          status: line.status,
          reminder_date: line.reminder_date,
          category: line.category,
          day_of_month: line.day_of_month || null,
        }));
        
        const { error: linesError } = await supabase
          .from('budget_lines')
          .insert(budgetLines);
        
        if (linesError) throw linesError;
      }
      
      return id;
    },
    onSuccess: (id) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      queryClient.invalidateQueries({ queryKey: ['budget', id] });
      toast({ title: 'Presupuesto actualizado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al actualizar presupuesto', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('budgets').delete().eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Presupuesto eliminado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar presupuesto', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// BANKS
// =============================================

export function useBanks() {
  return useQuery({
    queryKey: ['banks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as unknown as Bank[];
    },
  });
}

export function useActiveBanks() {
  return useQuery({
    queryKey: ['banks', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data as unknown as Bank[];
    },
  });
}

export function useSaveBank() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (bank: { id?: string; name: string; code?: string; is_active?: boolean }) => {
      if (bank.id) {
        const { data, error } = await supabase
          .from('banks')
          .update({ name: bank.name, code: bank.code || null, is_active: bank.is_active ?? true })
          .eq('id', bank.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('banks')
          .insert({ name: bank.name, code: bank.code || null })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['banks'] });
      toast({ title: 'Banco guardado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar banco', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// INCOME
// =============================================

export function useFinanceIncome(month?: string) {
  return useQuery({
    queryKey: ['finance-income', month],
    queryFn: async () => {
      let query = supabase
        .from('finance_income')
        .select('*, bank:banks(*)')
        .order('income_date', { ascending: false });
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinanceIncome[];
    },
  });
}

export function useSaveIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (income: { id?: string; income_date: string; month: string; description: string; amount_usd: number; amount_ves: number; exchange_rate?: number | null; bank_id?: string | null; notes?: string | null }) => {
      if (income.id) {
        const { id, ...rest } = income;
        const { data, error } = await supabase.from('finance_income').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = income as any;
        const { data, error } = await supabase.from('finance_income').insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-income'] });
      toast({ title: 'Ingreso guardado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar ingreso', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_income').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-income'] });
      toast({ title: 'Ingreso eliminado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// EXPENSES
// =============================================

export function useFinanceExpenses(month?: string) {
  return useQuery({
    queryKey: ['finance-expenses', month],
    queryFn: async () => {
      let query = supabase
        .from('finance_expenses')
        .select('*')
        .order('expense_date', { ascending: false });
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinanceExpense[];
    },
  });
}

export function useSaveExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (expense: { id?: string; expense_date: string; month: string; description: string; amount_usd: number; amount_ves: number; exchange_rate?: number | null; is_paid?: boolean; beneficiary?: string | null; notes?: string | null }) => {
      if (expense.id) {
        const { id, ...rest } = expense;
        const { data, error } = await supabase.from('finance_expenses').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = expense as any;
        const { data, error } = await supabase.from('finance_expenses').insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast({ title: 'Egreso guardado correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar egreso', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_expenses').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-expenses'] });
      toast({ title: 'Egreso eliminado' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// INVOICES
// =============================================

export function useFinanceInvoices(month?: string) {
  return useQuery({
    queryKey: ['finance-invoices', month],
    queryFn: async () => {
      let query = supabase
        .from('finance_invoices')
        .select('*')
        .order('invoice_date', { ascending: false });
      
      if (month) {
        query = query.eq('month', month);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as FinanceInvoice[];
    },
  });
}

export function useSaveInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (invoice: { id?: string; month: string; invoice_date: string; invoice_number: string; control_number?: string | null; description: string; total_usd: number; total_ves: number; is_collected?: boolean; notes?: string | null }) => {
      if (invoice.id) {
        const { id, ...rest } = invoice;
        const { data, error } = await supabase.from('finance_invoices').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = invoice as any;
        const { data, error } = await supabase.from('finance_invoices').insert(rest).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['finance-receivables'] });
      toast({ title: 'Factura guardada correctamente' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al guardar factura', description: error.message, variant: 'destructive' });
    },
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('finance_invoices').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-invoices'] });
      toast({ title: 'Factura eliminada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// RECEIVABLES
// =============================================

export function useFinanceReceivables() {
  return useQuery({
    queryKey: ['finance-receivables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_receivables')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FinanceReceivable[];
    },
  });
}

export function useSaveReceivable() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (receivable: { id?: string; source?: string; invoice_id?: string | null; description: string; amount_usd: number; amount_ves: number; due_date?: string | null; is_collected?: boolean; notes?: string | null }) => {
      if (receivable.id) {
        const { id, ...rest } = receivable;
        const { data, error } = await supabase.from('finance_receivables').update(rest).eq('id', id).select().single();
        if (error) throw error;
        return data;
      } else {
        const { id, ...rest } = receivable as any;
        const { data, error } = await supabase.from('finance_receivables').insert({ ...rest, source: rest.source || 'manual' }).select().single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-receivables'] });
      toast({ title: 'Cuenta por cobrar guardada' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });
}

// =============================================
// UNPAID BUDGET LINES (PAYABLES)
// =============================================

export function usePayables() {
  return useQuery({
    queryKey: ['finance-payables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_lines')
        .select('*, budget:budgets(*)')
        .in('status', ['pendiente', 'vencido'])
        .order('planned_date');
      if (error) throw error;
      return data as unknown as (BudgetLine & { budget: Budget })[];
    },
  });
}
