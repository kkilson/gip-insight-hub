
-- Step 1: Remove FK constraints from budget-related tables
ALTER TABLE public.budget_lines DROP CONSTRAINT IF EXISTS budget_lines_account_id_fkey;
ALTER TABLE public.budget_lines DROP CONSTRAINT IF EXISTS budget_lines_journal_entry_id_fkey;

-- Step 2: Modify budget_lines - drop accounting columns, add useful ones
ALTER TABLE public.budget_lines 
  DROP COLUMN IF EXISTS account_id,
  DROP COLUMN IF EXISTS journal_entry_id,
  ADD COLUMN IF NOT EXISTS reminder_date DATE,
  ADD COLUMN IF NOT EXISTS category TEXT;

-- Step 3: Drop accounting tables (CASCADE handles remaining FKs)
DROP TABLE IF EXISTS public.journal_entry_lines CASCADE;
DROP TABLE IF EXISTS public.monthly_closings CASCADE;
DROP TABLE IF EXISTS public.finance_audit_logs CASCADE;
DROP TABLE IF EXISTS public.journal_entries CASCADE;
DROP TABLE IF EXISTS public.chart_of_accounts CASCADE;
DROP TABLE IF EXISTS public.cost_centers CASCADE;

-- Step 4: Clean up budgets - remove cost_center_id
ALTER TABLE public.budgets DROP COLUMN IF EXISTS cost_center_id;

-- Step 5: Create Banks table
CREATE TABLE public.banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total can manage banks" ON public.banks FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view banks" ON public.banks FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Step 6: Finance Income (Ingresos)
CREATE TABLE public.finance_income (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  income_date DATE NOT NULL,
  month TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  amount_ves NUMERIC NOT NULL DEFAULT 0,
  exchange_rate NUMERIC,
  bank_id UUID REFERENCES public.banks(id),
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_income ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total can manage income" ON public.finance_income FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view income" ON public.finance_income FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Step 7: Finance Expenses (Egresos)
CREATE TABLE public.finance_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_date DATE NOT NULL,
  month TEXT NOT NULL,
  description TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  amount_ves NUMERIC NOT NULL DEFAULT 0,
  exchange_rate NUMERIC,
  is_paid BOOLEAN NOT NULL DEFAULT true,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total can manage expenses" ON public.finance_expenses FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view expenses" ON public.finance_expenses FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Step 8: Finance Invoices (Facturación)
CREATE TABLE public.finance_invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  invoice_number TEXT NOT NULL,
  control_number TEXT,
  description TEXT NOT NULL,
  total_usd NUMERIC NOT NULL DEFAULT 0,
  total_ves NUMERIC NOT NULL DEFAULT 0,
  is_collected BOOLEAN NOT NULL DEFAULT false,
  collected_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total can manage invoices" ON public.finance_invoices FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view invoices" ON public.finance_invoices FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Step 9: Finance Receivables (Cuentas por Cobrar)
CREATE TABLE public.finance_receivables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source TEXT NOT NULL DEFAULT 'manual',
  invoice_id UUID REFERENCES public.finance_invoices(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount_usd NUMERIC NOT NULL DEFAULT 0,
  amount_ves NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  is_collected BOOLEAN NOT NULL DEFAULT false,
  collected_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.finance_receivables ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Acceso total can manage receivables" ON public.finance_receivables FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view receivables" ON public.finance_receivables FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));
