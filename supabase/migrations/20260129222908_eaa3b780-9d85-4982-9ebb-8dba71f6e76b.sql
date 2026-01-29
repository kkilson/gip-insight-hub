-- Create junction table for policy-advisor relationship (max 2 advisors per policy)
CREATE TABLE public.policy_advisors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  advisor_role TEXT NOT NULL DEFAULT 'principal' CHECK (advisor_role IN ('principal', 'secundario')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(policy_id, advisor_id),
  UNIQUE(policy_id, advisor_role)
);

-- Enable RLS
ALTER TABLE public.policy_advisors ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users with role can view policy advisors"
ON public.policy_advisors
FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert policy advisors"
ON public.policy_advisors
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

CREATE POLICY "Users with edit role can update policy advisors"
ON public.policy_advisors
FOR UPDATE
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

CREATE POLICY "Users with edit role can delete policy advisors"
ON public.policy_advisors
FOR DELETE
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

-- Create function to enforce max 2 advisors per policy
CREATE OR REPLACE FUNCTION public.check_max_policy_advisors()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.policy_advisors WHERE policy_id = NEW.policy_id) >= 2 THEN
    RAISE EXCEPTION 'Una póliza no puede tener más de 2 asesores';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger
CREATE TRIGGER enforce_max_policy_advisors
BEFORE INSERT ON public.policy_advisors
FOR EACH ROW
EXECUTE FUNCTION public.check_max_policy_advisors();

-- Add index for performance
CREATE INDEX idx_policy_advisors_policy_id ON public.policy_advisors(policy_id);
CREATE INDEX idx_policy_advisors_advisor_id ON public.policy_advisors(advisor_id);