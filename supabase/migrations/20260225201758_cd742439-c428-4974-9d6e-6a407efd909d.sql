
-- Drop the restrictive policies and recreate as permissive
DROP POLICY "Acceso total can manage sales notes" ON public.sales_notes;
DROP POLICY "Users with edit role can view sales notes" ON public.sales_notes;
DROP POLICY "Users with edit role can insert sales notes" ON public.sales_notes;

-- Permissive policies (OR logic)
CREATE POLICY "Acceso total can manage sales notes" ON public.sales_notes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'acceso_total'::app_role))
  WITH CHECK (has_role(auth.uid(), 'acceso_total'::app_role));

CREATE POLICY "Users with edit role can view sales notes" ON public.sales_notes
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE POLICY "Users with edit role can insert sales notes" ON public.sales_notes
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role));
