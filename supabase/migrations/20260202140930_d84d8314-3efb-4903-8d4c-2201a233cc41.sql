-- ============================================
-- Fix: Restrict access to sensitive tables
-- Tables: beneficiaries, policies, collections
-- Exclude 'revision' role from viewing sensitive PII
-- ============================================

-- 1. BENEFICIARIES TABLE
-- Contains: names, birth dates, phone numbers, emails, identification numbers
DROP POLICY IF EXISTS "Users with role can view beneficiaries" ON public.beneficiaries;

CREATE POLICY "Authorized roles can view beneficiaries" 
ON public.beneficiaries 
FOR SELECT 
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

-- 2. POLICIES TABLE
-- Contains: policy details linked to clients, premium amounts, coverage details
DROP POLICY IF EXISTS "Users with role can view policies" ON public.policies;

CREATE POLICY "Authorized roles can view policies" 
ON public.policies 
FOR SELECT 
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

-- 3. COLLECTIONS TABLE
-- Contains: payment information linked to clients and policies
DROP POLICY IF EXISTS "Users with role can view collections" ON public.collections;

CREATE POLICY "Authorized roles can view collections" 
ON public.collections 
FOR SELECT 
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);