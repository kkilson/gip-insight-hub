
-- Table for debts (compromisos por pagar / lo que debo)
CREATE TABLE public.finance_debts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  debt_date date NOT NULL,
  beneficiary text NOT NULL,
  description text NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_ves numeric NOT NULL DEFAULT 0,
  is_paid boolean NOT NULL DEFAULT false,
  paid_at timestamp with time zone,
  month text NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_debts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage debts" ON public.finance_debts FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view debts" ON public.finance_debts FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE TRIGGER update_finance_debts_updated_at BEFORE UPDATE ON public.finance_debts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for loans (préstamos / lo que me deben)
CREATE TABLE public.finance_loans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  loan_date date NOT NULL,
  beneficiary text NOT NULL,
  description text NOT NULL,
  amount_usd numeric NOT NULL DEFAULT 0,
  amount_ves numeric NOT NULL DEFAULT 0,
  is_collected boolean NOT NULL DEFAULT false,
  collected_at timestamp with time zone,
  month text NOT NULL,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.finance_loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage loans" ON public.finance_loans FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with finance role can view loans" ON public.finance_loans FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE TRIGGER update_finance_loans_updated_at BEFORE UPDATE ON public.finance_loans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
