
CREATE TABLE public.sales_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage sales notes" ON public.sales_notes
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Users with edit role can view sales notes" ON public.sales_notes
  AS RESTRICTIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Users with edit role can insert sales notes" ON public.sales_notes
  AS RESTRICTIVE FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));
