-- Create collection status enum
CREATE TYPE public.collection_status AS ENUM ('pendiente', 'contacto_asesor', 'cobrada');

-- Create collections table
CREATE TABLE public.collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  
  -- Payment details
  due_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  payment_frequency public.payment_frequency NOT NULL,
  
  -- Status management
  status public.collection_status NOT NULL DEFAULT 'pendiente',
  
  -- For contacto_asesor state
  promised_date DATE,
  advisor_notes TEXT,
  advisor_contacted_at TIMESTAMPTZ,
  
  -- When marked as cobrada
  paid_at TIMESTAMPTZ,
  paid_by UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index for common queries
CREATE INDEX idx_collections_policy_id ON public.collections(policy_id);
CREATE INDEX idx_collections_client_id ON public.collections(client_id);
CREATE INDEX idx_collections_status ON public.collections(status);
CREATE INDEX idx_collections_due_date ON public.collections(due_date);

-- Enable RLS
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users with role can view collections"
ON public.collections FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert collections"
ON public.collections FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

CREATE POLICY "Users with edit role can update collections"
ON public.collections FOR UPDATE
USING (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);

CREATE POLICY "Acceso total can delete collections"
ON public.collections FOR DELETE
USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Collection history table for audit trail
CREATE TABLE public.collection_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  previous_status public.collection_status,
  new_status public.collection_status NOT NULL,
  notes TEXT,
  changed_by UUID,
  changed_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on history
ALTER TABLE public.collection_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users with role can view collection history"
ON public.collection_history FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert collection history"
ON public.collection_history FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'acceso_total'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_1'::app_role) OR 
  has_role(auth.uid(), 'revision_edicion_2'::app_role)
);