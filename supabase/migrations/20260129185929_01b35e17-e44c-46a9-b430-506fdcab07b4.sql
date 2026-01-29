-- ============================================
-- MÓDULO DE RENOVACIONES - Tablas principales
-- ============================================

-- 1. Tipos de uso de póliza (configurables)
CREATE TABLE public.usage_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insertar tipos predeterminados
INSERT INTO public.usage_types (name) VALUES 
  ('Urgencia'),
  ('Emergencia'),
  ('Reembolso'),
  ('Consulta médica'),
  ('Carta aval'),
  ('Otro');

-- Enable RLS
ALTER TABLE public.usage_types ENABLE ROW LEVEL SECURITY;

-- Policies para usage_types
CREATE POLICY "Users with role can view usage types"
  ON public.usage_types FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Acceso total can manage usage types"
  ON public.usage_types FOR ALL
  USING (has_role(auth.uid(), 'acceso_total'));

-- 2. Consumos de póliza
CREATE TABLE public.policy_consumptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  beneficiary_id UUID REFERENCES public.beneficiaries(id) ON DELETE SET NULL,
  beneficiary_name TEXT, -- Backup if beneficiary is deleted or for tomador
  usage_type_id UUID NOT NULL REFERENCES public.usage_types(id),
  usage_date DATE NOT NULL,
  description TEXT NOT NULL,
  amount_bs DECIMAL(12, 2),
  amount_usd DECIMAL(12, 2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  deleted BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMP WITH TIME ZONE,
  deleted_by UUID REFERENCES auth.users(id),
  
  -- At least one amount must be provided
  CONSTRAINT at_least_one_amount CHECK (amount_bs IS NOT NULL OR amount_usd IS NOT NULL)
);

-- Enable RLS
ALTER TABLE public.policy_consumptions ENABLE ROW LEVEL SECURITY;

-- Policies para policy_consumptions
CREATE POLICY "Users with role can view consumptions"
  ON public.policy_consumptions FOR SELECT
  USING (has_any_role(auth.uid()) AND deleted = false);

CREATE POLICY "Users with edit role can insert consumptions"
  ON public.policy_consumptions FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can update consumptions"
  ON public.policy_consumptions FOR UPDATE
  USING (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Acceso total can delete consumptions"
  ON public.policy_consumptions FOR DELETE
  USING (has_role(auth.uid(), 'acceso_total'));

-- 3. Configuración de renovaciones
CREATE TYPE public.renewal_status AS ENUM ('pendiente', 'programada', 'enviada', 'error', 'completada');

CREATE TABLE public.renewal_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID NOT NULL REFERENCES public.policies(id) ON DELETE CASCADE,
  renewal_date DATE NOT NULL,
  current_amount DECIMAL(12, 2) NOT NULL,
  new_amount DECIMAL(12, 2),
  difference DECIMAL(12, 2) GENERATED ALWAYS AS (COALESCE(new_amount, 0) - current_amount) STORED,
  percentage DECIMAL(5, 2) GENERATED ALWAYS AS (
    CASE WHEN current_amount > 0 AND new_amount IS NOT NULL 
    THEN ((new_amount - current_amount) / current_amount * 100)
    ELSE 0 END
  ) STORED,
  status public.renewal_status NOT NULL DEFAULT 'pendiente',
  scheduled_send_date DATE,
  pdf_generated BOOLEAN NOT NULL DEFAULT false,
  pdf_path TEXT,
  email_sent BOOLEAN NOT NULL DEFAULT false,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Only one active config per policy per renewal date
  UNIQUE (policy_id, renewal_date)
);

-- Enable RLS
ALTER TABLE public.renewal_configs ENABLE ROW LEVEL SECURITY;

-- Policies para renewal_configs
CREATE POLICY "Users with role can view renewal configs"
  ON public.renewal_configs FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert renewal configs"
  ON public.renewal_configs FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can update renewal configs"
  ON public.renewal_configs FOR UPDATE
  USING (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Acceso total can delete renewal configs"
  ON public.renewal_configs FOR DELETE
  USING (has_role(auth.uid(), 'acceso_total'));

-- 4. Triggers para updated_at
CREATE TRIGGER update_usage_types_updated_at
  BEFORE UPDATE ON public.usage_types
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policy_consumptions_updated_at
  BEFORE UPDATE ON public.policy_consumptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_renewal_configs_updated_at
  BEFORE UPDATE ON public.renewal_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 5. Índices para performance
CREATE INDEX idx_policy_consumptions_policy_id ON public.policy_consumptions(policy_id);
CREATE INDEX idx_policy_consumptions_usage_date ON public.policy_consumptions(usage_date);
CREATE INDEX idx_renewal_configs_policy_id ON public.renewal_configs(policy_id);
CREATE INDEX idx_renewal_configs_renewal_date ON public.renewal_configs(renewal_date);
CREATE INDEX idx_renewal_configs_status ON public.renewal_configs(status);