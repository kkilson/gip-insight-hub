-- Restrict broker_settings SELECT access to administrative roles only
-- Previously: has_any_role(auth.uid()) - allowed all authenticated users
-- Now: Only acceso_total and revision_edicion_1 can view company confidential information

DROP POLICY IF EXISTS "Users with role can view broker settings" ON public.broker_settings;

CREATE POLICY "Admin roles can view broker settings" 
ON public.broker_settings 
FOR SELECT 
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role)
);