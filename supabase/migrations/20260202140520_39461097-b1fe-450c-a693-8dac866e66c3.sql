-- ============================================
-- Fix: Restrict client data access to business-justified roles
-- Issue: clients_broad_access (error level)
-- ============================================

-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users with role can view clients" ON public.clients;

-- Create restricted SELECT policy for clients
-- Only roles that need client access for their job functions can view
-- 'revision' role is excluded as it's read-only and doesn't need full PII access
CREATE POLICY "Authorized roles can view clients" 
ON public.clients 
FOR SELECT 
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

-- Note: The 'revision' role is intentionally excluded from client data access
-- as it's a read-only role that should not have access to sensitive PII
-- If 'revision' users need limited client visibility, consider creating
-- a separate view with only non-sensitive fields