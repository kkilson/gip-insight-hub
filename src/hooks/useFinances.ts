import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types based on database schema
export interface ChartOfAccount {
  id: string;
  code: string;
  name: string;
  parent_id: string | null;
  level: number;
  class: 'activos' | 'pasivos' | 'patrimonio' | 'ingresos' | 'costos' | 'gastos' | 'ajustes';
  nature: 'deudora' | 'acreedora' | 'variable';
  requires_cost_center: boolean;
  requires_third_party: boolean;
  is_active: boolean;
  balance_usd: number;
  balance_ves: number;
  created_at: string;
  updated_at: string;
}

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

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  type: 'operativo' | 'comercial' | 'administrativo' | 'soporte';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface JournalEntry {
  id: string;
  entry_number: number;
  entry_date: string;
  description: string;
  base_currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  exchange_rate_source: 'BCV' | 'Binance' | 'Kontigo' | 'Manual';
  exchange_rate: number;
  cost_center_id: string | null;
  status: 'borrador' | 'publicado' | 'cerrado';
  is_month_closed: boolean;
  total_debit_usd: number;
  total_credit_usd: number;
  total_debit_ves: number;
  total_credit_ves: number;
  notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  lines?: JournalEntryLine[];
  cost_center?: CostCenter;
}

export interface JournalEntryLine {
  id: string;
  entry_id: string;
  line_number: number;
  account_id: string;
  transaction_type: 'deposito' | 'retiro' | 'transferencia' | 'pago' | 'cobro' | 'ajuste';
  applies_igtf: boolean;
  debit_usd: number;
  credit_usd: number;
  debit_ves: number;
  credit_ves: number;
  cost_center_id: string | null;
  description: string | null;
  created_at: string;
  account?: ChartOfAccount;
  cost_center?: CostCenter;
}

export interface Budget {
  id: string;
  name: string;
  period: string;
  start_date: string;
  end_date: string;
  cost_center_id: string | null;
  currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  total_budgeted_usd: number;
  total_spent_usd: number;
  is_active: boolean;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  lines?: BudgetLine[];
  cost_center?: CostCenter;
}

export interface BudgetLine {
  id: string;
  budget_id: string;
  planned_date: string;
  account_id: string;
  description: string;
  can_pay_in_ves: boolean;
  amount_usd: number;
  reference_rate: number | null;
  status: 'pendiente' | 'pagado' | 'vencido' | 'pospuesto';
  actual_payment_date: string | null;
  actual_amount_usd: number | null;
  postponed_date: string | null;
  postpone_reason: string | null;
  journal_entry_id: string | null;
  created_at: string;
  updated_at: string;
  account?: ChartOfAccount;
}

export interface MonthlyClosing {
  id: string;
  month: number;
  year: number;
  closing_date: string;
  closed_by: string | null;
  closing_entry_id: string | null;
  net_income_usd: number;
  total_assets_usd: number;
  total_liabilities_usd: number;
  total_equity_usd: number;
  is_reopened: boolean;
  reopened_at: string | null;
  reopened_by: string | null;
  reopen_reason: string | null;
  created_at: string;
}

// Dashboard metrics
export interface FinanceDashboardMetrics {
  totalIncome: number;
  totalExpenses: number;
  cashAvailable: number;
  accountsPayable: number;
  accountsReceivable: number;
  incomeChange: number;
  expenseChange: number;
}

// =============================================
// HOOKS
// =============================================

// Chart of Accounts
export function useChartOfAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });
}

export function useActiveAccounts() {
  return useQuery({
    queryKey: ['chart-of-accounts', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chart_of_accounts')
        .select('*')
        .eq('is_active', true)
        .order('code');
      if (error) throw error;
      return data as ChartOfAccount[];
    },
  });
}

export function useLeafAccounts() {
  const { data: allAccounts } = useChartOfAccounts();
  
  return useQuery({
    queryKey: ['chart-of-accounts', 'leaves'],
    queryFn: async () => {
      if (!allAccounts) return [];
      const parentIds = new Set(allAccounts.filter(a => a.parent_id).map(a => a.parent_id));
      return allAccounts.filter(a => !parentIds.has(a.id) && a.is_active);
    },
    enabled: !!allAccounts,
  });
}

// Exchange Rates
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
      toast({
        title: 'Error al registrar tasa',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Cost Centers
export function useCostCenters() {
  return useQuery({
    queryKey: ['cost-centers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .order('code');
      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

export function useActiveCostCenters() {
  return useQuery({
    queryKey: ['cost-centers', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cost_centers')
        .select('*')
        .eq('is_active', true)
        .order('code');
      if (error) throw error;
      return data as CostCenter[];
    },
  });
}

// Journal Entries
export function useJournalEntries(filters?: {
  startDate?: string;
  endDate?: string;
  status?: string;
  costCenterId?: string;
}) {
  return useQuery({
    queryKey: ['journal-entries', filters],
    queryFn: async () => {
      let query = supabase
        .from('journal_entries')
        .select(`
          *,
          cost_center:cost_centers(*)
        `)
        .order('entry_number', { ascending: false });
      
      if (filters?.startDate) {
        query = query.gte('entry_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('entry_date', filters.endDate);
      }
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status as 'borrador' | 'publicado' | 'cerrado');
      }
      if (filters?.costCenterId && filters.costCenterId !== 'all') {
        query = query.eq('cost_center_id', filters.costCenterId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as JournalEntry[];
    },
  });
}

export function useJournalEntry(id: string | null) {
  return useQuery({
    queryKey: ['journal-entry', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: entry, error: entryError } = await supabase
        .from('journal_entries')
        .select(`
          *,
          cost_center:cost_centers(*)
        `)
        .eq('id', id)
        .single();
      
      if (entryError) throw entryError;
      
      const { data: lines, error: linesError } = await supabase
        .from('journal_entry_lines')
        .select(`
          *,
          account:chart_of_accounts(*),
          cost_center:cost_centers(*)
        `)
        .eq('entry_id', id)
        .order('line_number');
      
      if (linesError) throw linesError;
      
      return { ...entry, lines } as JournalEntry;
    },
    enabled: !!id,
  });
}

// Budgets
export function useBudgets(filters?: {
  isActive?: boolean;
  costCenterId?: string;
}) {
  return useQuery({
    queryKey: ['budgets', filters],
    queryFn: async () => {
      let query = supabase
        .from('budgets')
        .select(`
          *,
          cost_center:cost_centers(*)
        `)
        .order('start_date', { ascending: false });
      
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.costCenterId && filters.costCenterId !== 'all') {
        query = query.eq('cost_center_id', filters.costCenterId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Budget[];
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
        .select(`
          *,
          cost_center:cost_centers(*)
        `)
        .eq('id', id)
        .single();
      
      if (budgetError) throw budgetError;
      
      const { data: lines, error: linesError } = await supabase
        .from('budget_lines')
        .select(`
          *,
          account:chart_of_accounts(*)
        `)
        .eq('budget_id', id)
        .order('planned_date');
      
      if (linesError) throw linesError;
      
      return { ...budget, lines } as Budget;
    },
    enabled: !!id,
  });
}

export interface BudgetFormData {
  name: string;
  period: 'mensual' | 'bimestral' | 'trimestral' | 'cuatrimestral' | 'semestral' | 'anual' | 'bienal' | 'trienal' | 'cuatrienal' | 'quinquenal' | 'decenal';
  start_date: string;
  end_date: string;
  cost_center_id: string | null;
  currency: 'USD' | 'VES' | 'EUR' | 'USDT';
  notes: string | null;
  is_active: boolean;
}

export interface BudgetLineFormData {
  id?: string;
  planned_date: string;
  account_id: string;
  description: string;
  can_pay_in_ves: boolean;
  amount_usd: number;
  reference_rate: number | null;
  status: 'pendiente' | 'pagado' | 'vencido' | 'pospuesto';
}

export function useCreateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ budget, lines }: { budget: BudgetFormData; lines: BudgetLineFormData[] }) => {
      // Calculate total budgeted
      const total_budgeted_usd = lines.reduce((sum, line) => sum + line.amount_usd, 0);
      
      // Insert budget
      const { data: newBudget, error: budgetError } = await supabase
        .from('budgets')
        .insert({
          ...budget,
          total_budgeted_usd,
          total_spent_usd: 0,
        })
        .select()
        .single();
      
      if (budgetError) throw budgetError;
      
      // Insert lines
      if (lines.length > 0) {
        const budgetLines = lines.map((line, index) => ({
          budget_id: newBudget.id,
          planned_date: line.planned_date,
          account_id: line.account_id,
          description: line.description,
          can_pay_in_ves: line.can_pay_in_ves,
          amount_usd: line.amount_usd,
          reference_rate: line.reference_rate,
          status: line.status,
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
      toast({
        title: 'Error al crear presupuesto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async ({ id, budget, lines }: { id: string; budget: BudgetFormData; lines: BudgetLineFormData[] }) => {
      // Calculate total budgeted
      const total_budgeted_usd = lines.reduce((sum, line) => sum + line.amount_usd, 0);
      
      // Update budget
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          ...budget,
          total_budgeted_usd,
        })
        .eq('id', id);
      
      if (budgetError) throw budgetError;
      
      // Delete existing lines
      const { error: deleteError } = await supabase
        .from('budget_lines')
        .delete()
        .eq('budget_id', id);
      
      if (deleteError) throw deleteError;
      
      // Insert new lines
      if (lines.length > 0) {
        const budgetLines = lines.map((line) => ({
          budget_id: id,
          planned_date: line.planned_date,
          account_id: line.account_id,
          description: line.description,
          can_pay_in_ves: line.can_pay_in_ves,
          amount_usd: line.amount_usd,
          reference_rate: line.reference_rate,
          status: line.status,
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
      toast({
        title: 'Error al actualizar presupuesto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteBudget() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Lines will be cascade deleted
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast({ title: 'Presupuesto eliminado correctamente' });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error al eliminar presupuesto',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

// Monthly Closings
export function useMonthlyClosings() {
  return useQuery({
    queryKey: ['monthly-closings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_closings')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false });
      if (error) throw error;
      return data as MonthlyClosing[];
    },
  });
}

export function useIsMonthClosed(month: number, year: number) {
  return useQuery({
    queryKey: ['monthly-closing', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_closings')
        .select('*')
        .eq('month', month)
        .eq('year', year)
        .maybeSingle();
      
      if (error) throw error;
      return data ? !data.is_reopened : false;
    },
  });
}

// Dashboard Metrics
export function useFinanceDashboardMetrics(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['finance-dashboard-metrics', startDate, endDate],
    queryFn: async () => {
      // Get all published journal entries for the period
      const { data: entries, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          lines:journal_entry_lines(
            *,
            account:chart_of_accounts(code, class)
          )
        `)
        .eq('status', 'publicado')
        .gte('entry_date', startDate)
        .lte('entry_date', endDate);
      
      if (error) throw error;
      
      let totalIncome = 0;
      let totalExpenses = 0;
      
      for (const entry of entries || []) {
        for (const line of (entry as any).lines || []) {
          const account = line.account;
          if (!account) continue;
          
          if (account.class === 'ingresos') {
            totalIncome += line.credit_usd - line.debit_usd;
          } else if (account.class === 'gastos' || account.class === 'costos') {
            totalExpenses += line.debit_usd - line.credit_usd;
          }
        }
      }
      
      // Get current balances for cash, receivables, and payables
      const { data: accounts } = await supabase
        .from('chart_of_accounts')
        .select('code, balance_usd')
        .in('code', ['1110', '1120', '2110']);
      
      const cashAvailable = accounts?.find(a => a.code === '1110')?.balance_usd || 0;
      const accountsReceivable = accounts?.find(a => a.code === '1120')?.balance_usd || 0;
      const accountsPayable = accounts?.find(a => a.code === '2110')?.balance_usd || 0;
      
      return {
        totalIncome,
        totalExpenses,
        cashAvailable,
        accountsPayable,
        accountsReceivable,
        incomeChange: 0, // TODO: Calculate vs previous period
        expenseChange: 0,
      } as FinanceDashboardMetrics;
    },
  });
}
