
CREATE TABLE public.sales_investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  investment_date date NOT NULL DEFAULT CURRENT_DATE,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage sales investments" ON public.sales_investments
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'acceso_total'::app_role))
  WITH CHECK (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Users with edit role can view sales investments" ON public.sales_investments
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Users with edit role can insert sales investments" ON public.sales_investments
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role));
