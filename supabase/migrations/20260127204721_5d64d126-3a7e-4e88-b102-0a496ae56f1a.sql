-- Create a function to check if there are any users with acceso_total role
CREATE OR REPLACE FUNCTION public.no_admin_exists()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE role = 'acceso_total'
  )
$$;

-- Allow first user to assign themselves acceso_total if no admin exists
CREATE POLICY "First user can self-assign admin"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (
    public.no_admin_exists() 
    AND user_id = auth.uid() 
    AND role = 'acceso_total'
  );