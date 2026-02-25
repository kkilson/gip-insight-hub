
-- Create payroll_employees table
CREATE TABLE public.payroll_employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  base_salary_usd numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payroll_employees ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as finance_debts)
CREATE POLICY "Acceso total can manage payroll employees"
  ON public.payroll_employees
  FOR ALL
  USING (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Users with finance role can view payroll employees"
  ON public.payroll_employees
  FOR SELECT
  USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_payroll_employees_updated_at
  BEFORE UPDATE ON public.payroll_employees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
