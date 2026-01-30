-- =============================================
-- MÓDULO DE FINANZAS - SCHEMA COMPLETO
-- =============================================

-- Enums para el módulo de finanzas
CREATE TYPE public.currency_type AS ENUM ('USD', 'VES', 'EUR', 'USDT');
CREATE TYPE public.exchange_rate_source AS ENUM ('BCV', 'Binance', 'Kontigo', 'Manual');
CREATE TYPE public.account_nature AS ENUM ('deudora', 'acreedora', 'variable');
CREATE TYPE public.account_class AS ENUM ('activos', 'pasivos', 'patrimonio', 'ingresos', 'costos', 'gastos', 'ajustes');
CREATE TYPE public.entry_status AS ENUM ('borrador', 'publicado', 'cerrado');
CREATE TYPE public.transaction_type AS ENUM ('deposito', 'retiro', 'transferencia', 'pago', 'cobro', 'ajuste');
CREATE TYPE public.budget_status AS ENUM ('pendiente', 'pagado', 'vencido', 'pospuesto');
CREATE TYPE public.cost_center_type AS ENUM ('operativo', 'comercial', 'administrativo', 'soporte');
CREATE TYPE public.budget_period AS ENUM ('mensual', 'bimestral', 'trimestral', 'cuatrimestral', 'semestral', 'anual', 'bienal', 'trienal', 'cuatrienal', 'quinquenal', 'decenal');

-- =============================================
-- 1. CATÁLOGO DE CUENTAS
-- =============================================
CREATE TABLE public.chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.chart_of_accounts(id),
  level integer NOT NULL DEFAULT 1,
  class account_class NOT NULL,
  nature account_nature NOT NULL,
  requires_cost_center boolean NOT NULL DEFAULT false,
  requires_third_party boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  balance_usd numeric(18,2) NOT NULL DEFAULT 0,
  balance_ves numeric(18,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view accounts"
ON public.chart_of_accounts FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage accounts"
ON public.chart_of_accounts FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 2. TASAS DE CAMBIO
-- =============================================
CREATE TABLE public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  currency currency_type NOT NULL,
  source exchange_rate_source NOT NULL,
  rate numeric(18,4) NOT NULL,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  recorded_by uuid REFERENCES auth.users(id),
  is_manual boolean NOT NULL DEFAULT false,
  manual_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view rates"
ON public.exchange_rates FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage rates"
ON public.exchange_rates FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 3. CENTROS DE COSTOS
-- =============================================
CREATE TABLE public.cost_centers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  type cost_center_type NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view cost centers"
ON public.cost_centers FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage cost centers"
ON public.cost_centers FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 4. ASIENTOS CONTABLES
-- =============================================
CREATE TABLE public.journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_number serial NOT NULL UNIQUE,
  entry_date date NOT NULL,
  description text NOT NULL,
  base_currency currency_type NOT NULL DEFAULT 'USD',
  exchange_rate_source exchange_rate_source NOT NULL DEFAULT 'BCV',
  exchange_rate numeric(18,4) NOT NULL,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  status entry_status NOT NULL DEFAULT 'borrador',
  is_month_closed boolean NOT NULL DEFAULT false,
  total_debit_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_credit_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_debit_ves numeric(18,2) NOT NULL DEFAULT 0,
  total_credit_ves numeric(18,2) NOT NULL DEFAULT 0,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view entries"
ON public.journal_entries FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can insert entries"
ON public.journal_entries FOR INSERT
WITH CHECK (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Acceso total can update entries"
ON public.journal_entries FOR UPDATE
USING (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Acceso total can delete entries"
ON public.journal_entries FOR DELETE
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 5. LÍNEAS DE ASIENTOS CONTABLES
-- =============================================
CREATE TABLE public.journal_entry_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.journal_entries(id) ON DELETE CASCADE,
  line_number integer NOT NULL,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  transaction_type transaction_type NOT NULL,
  applies_igtf boolean NOT NULL DEFAULT false,
  debit_usd numeric(18,2) NOT NULL DEFAULT 0,
  credit_usd numeric(18,2) NOT NULL DEFAULT 0,
  debit_ves numeric(18,2) NOT NULL DEFAULT 0,
  credit_ves numeric(18,2) NOT NULL DEFAULT 0,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.journal_entry_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view entry lines"
ON public.journal_entry_lines FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage entry lines"
ON public.journal_entry_lines FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 6. PRESUPUESTOS
-- =============================================
CREATE TABLE public.budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  period budget_period NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  cost_center_id uuid REFERENCES public.cost_centers(id),
  currency currency_type NOT NULL DEFAULT 'USD',
  total_budgeted_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_spent_usd numeric(18,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view budgets"
ON public.budgets FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage budgets"
ON public.budgets FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 7. LÍNEAS DE PRESUPUESTO
-- =============================================
CREATE TABLE public.budget_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  planned_date date NOT NULL,
  account_id uuid NOT NULL REFERENCES public.chart_of_accounts(id),
  description text NOT NULL,
  can_pay_in_ves boolean NOT NULL DEFAULT false,
  amount_usd numeric(18,2) NOT NULL,
  reference_rate numeric(18,4),
  status budget_status NOT NULL DEFAULT 'pendiente',
  actual_payment_date date,
  actual_amount_usd numeric(18,2),
  postponed_date date,
  postpone_reason text,
  journal_entry_id uuid REFERENCES public.journal_entries(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view budget lines"
ON public.budget_lines FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage budget lines"
ON public.budget_lines FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 8. CIERRES MENSUALES
-- =============================================
CREATE TABLE public.monthly_closings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  month integer NOT NULL CHECK (month >= 1 AND month <= 12),
  year integer NOT NULL CHECK (year >= 2020),
  closing_date timestamptz NOT NULL DEFAULT now(),
  closed_by uuid REFERENCES auth.users(id),
  closing_entry_id uuid REFERENCES public.journal_entries(id),
  net_income_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_assets_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_liabilities_usd numeric(18,2) NOT NULL DEFAULT 0,
  total_equity_usd numeric(18,2) NOT NULL DEFAULT 0,
  is_reopened boolean NOT NULL DEFAULT false,
  reopened_at timestamptz,
  reopened_by uuid REFERENCES auth.users(id),
  reopen_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (month, year)
);

ALTER TABLE public.monthly_closings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view closings"
ON public.monthly_closings FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can manage closings"
ON public.monthly_closings FOR ALL
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- 9. AUDITORÍA DE CAMBIOS FINANCIEROS
-- =============================================
CREATE TABLE public.finance_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  previous_data jsonb,
  new_data jsonb,
  reason text,
  user_id uuid REFERENCES auth.users(id),
  user_email text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with finance role can view audit logs"
ON public.finance_audit_logs FOR SELECT
USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Acceso total can insert audit logs"
ON public.finance_audit_logs FOR INSERT
WITH CHECK (has_role(auth.uid(), 'acceso_total'::app_role));

-- =============================================
-- TRIGGERS PARA UPDATED_AT
-- =============================================
CREATE TRIGGER update_chart_of_accounts_updated_at
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cost_centers_updated_at
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at
BEFORE UPDATE ON public.journal_entries
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_budget_lines_updated_at
BEFORE UPDATE ON public.budget_lines
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- INSERTAR CATÁLOGO DE CUENTAS PREDETERMINADO
-- =============================================
-- Clases principales
INSERT INTO public.chart_of_accounts (code, name, level, class, nature) VALUES
('1000', 'ACTIVOS', 1, 'activos', 'deudora'),
('2000', 'PASIVOS', 1, 'pasivos', 'acreedora'),
('3000', 'PATRIMONIO', 1, 'patrimonio', 'acreedora'),
('4000', 'INGRESOS', 1, 'ingresos', 'acreedora'),
('5000', 'COSTOS', 1, 'costos', 'deudora'),
('6000', 'GASTOS', 1, 'gastos', 'deudora'),
('7000', 'AJUSTES', 1, 'ajustes', 'variable');

-- Grupos de Activos
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1100', 'Activos Corrientes', id, 2, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1200', 'Activos No Corrientes', id, 2, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1000';

-- Subcuentas de Activos Corrientes
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1110', 'Efectivo y Bancos', id, 3, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1120', 'Cuentas por Cobrar', id, 3, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1130', 'Otros Activos Corrientes', id, 3, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1100';

-- Cuentas de Efectivo y Bancos
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1111', 'Caja General', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1112', 'Caja Chica', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1113', 'Fondo Fijo', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1114', 'Bancos Nacionales (VES)', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1115', 'Bancos Internacionales (USD)', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1116', 'Bancos Internacionales (Otros)', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1117', 'Zelle / Plataformas de pago', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1118', 'Fondos sin depositar', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1110';

-- Cuentas por Cobrar
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_third_party) 
SELECT '1121', 'CxC Clientes', id, 4, 'activos', 'deudora', true FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1122', 'CxC Aseguradoras', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1123', 'CxC Comisiones por cobrar', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1124', 'CxC Anticipos a clientes', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1125', 'CxC Empleados', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1126', 'CxC Socios', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '1127', 'CxC Otras', id, 4, 'activos', 'deudora' FROM chart_of_accounts WHERE code = '1120';

-- Grupos de Pasivos
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2100', 'Pasivos Corrientes', id, 2, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2200', 'Pasivos No Corrientes', id, 2, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2000';

-- Cuentas por Pagar
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2110', 'Cuentas por Pagar', id, 3, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_third_party) 
SELECT '2111', 'Proveedores', id, 4, 'pasivos', 'acreedora', true FROM chart_of_accounts WHERE code = '2110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2112', 'Honorarios Profesionales', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2113', 'Servicios Básicos', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2114', 'Arrendamientos', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2110';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2115', 'Comisiones por pagar a agentes', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2110';

-- Impuestos por Pagar
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2130', 'Impuestos por Pagar', id, 3, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2131', 'IVA por pagar', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2130';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '2135', 'IGTF por pagar', id, 4, 'pasivos', 'acreedora' FROM chart_of_accounts WHERE code = '2130';

-- Patrimonio
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '3010', 'Capital Social', id, 2, 'patrimonio', 'acreedora' FROM chart_of_accounts WHERE code = '3000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '3040', 'Resultados Acumulados', id, 2, 'patrimonio', 'acreedora' FROM chart_of_accounts WHERE code = '3000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '3050', 'Utilidad del Ejercicio', id, 2, 'patrimonio', 'acreedora' FROM chart_of_accounts WHERE code = '3000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '3060', 'Pérdida del Ejercicio', id, 2, 'patrimonio', 'deudora' FROM chart_of_accounts WHERE code = '3000';

-- Ingresos
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '4100', 'Ingresos Operativos', id, 2, 'ingresos', 'acreedora' FROM chart_of_accounts WHERE code = '4000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '4110', 'Ingresos por Comisiones', id, 3, 'ingresos', 'acreedora' FROM chart_of_accounts WHERE code = '4100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '4200', 'Ingresos No Operativos', id, 2, 'ingresos', 'acreedora' FROM chart_of_accounts WHERE code = '4000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '4220', 'Ganancia Cambiaria', id, 3, 'ingresos', 'acreedora' FROM chart_of_accounts WHERE code = '4200';

-- Gastos
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_cost_center) 
SELECT '6100', 'Gastos Administrativos', id, 2, 'gastos', 'deudora', true FROM chart_of_accounts WHERE code = '6000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_cost_center) 
SELECT '6110', 'Sueldos y Salarios', id, 3, 'gastos', 'deudora', true FROM chart_of_accounts WHERE code = '6100';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_cost_center) 
SELECT '6200', 'Gastos Comerciales', id, 2, 'gastos', 'deudora', true FROM chart_of_accounts WHERE code = '6000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature, requires_cost_center) 
SELECT '6300', 'Tecnología y Software', id, 2, 'gastos', 'deudora', true FROM chart_of_accounts WHERE code = '6000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '6400', 'Gastos Financieros', id, 2, 'gastos', 'deudora' FROM chart_of_accounts WHERE code = '6000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '6412', 'IGTF', id, 3, 'gastos', 'deudora' FROM chart_of_accounts WHERE code = '6400';

-- Ajustes
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '7010', 'Ajustes Contables', id, 2, 'ajustes', 'variable' FROM chart_of_accounts WHERE code = '7000';
INSERT INTO public.chart_of_accounts (code, name, parent_id, level, class, nature) 
SELECT '7020', 'Diferencias Cambiarias', id, 2, 'ajustes', 'variable' FROM chart_of_accounts WHERE code = '7000';

-- Centros de costos predeterminados
INSERT INTO public.cost_centers (code, name, type) VALUES
('OPE', 'Operaciones', 'operativo'),
('ADM', 'Administración', 'administrativo'),
('COM', 'Comercial', 'comercial'),
('TEC', 'Tecnología', 'soporte');