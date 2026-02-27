
-- Commission rules: predefined % per advisor+insurer+plan_type
CREATE TABLE public.commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  insurer_id uuid NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  plan_type text NOT NULL DEFAULT 'general',
  commission_percentage numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(advisor_id, insurer_id, plan_type)
);

-- Commission batches (lotes)
CREATE TABLE public.commission_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id uuid REFERENCES public.insurers(id) ON DELETE SET NULL,
  batch_date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'verificado', 'asignado')),
  total_premium numeric NOT NULL DEFAULT 0,
  total_commission numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Commission entries (pólizas dentro de un lote)
CREATE TABLE public.commission_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.commission_batches(id) ON DELETE CASCADE,
  policy_number text,
  client_name text NOT NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  insurer_id uuid REFERENCES public.insurers(id) ON DELETE SET NULL,
  plan_type text,
  premium numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  has_discrepancy boolean NOT NULL DEFAULT false,
  discrepancy_note text,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Commission assignments (asignación de asesores a entries)
CREATE TABLE public.commission_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.commission_entries(id) ON DELETE CASCADE,
  advisor_id uuid NOT NULL REFERENCES public.advisors(id) ON DELETE CASCADE,
  percentage numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_assignments ENABLE ROW LEVEL SECURITY;

-- Rules policies
CREATE POLICY "Acceso total can manage commission rules" ON public.commission_rules FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view commission rules" ON public.commission_rules FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));

-- Batches policies
CREATE POLICY "Acceso total can manage commission batches" ON public.commission_batches FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view commission batches" ON public.commission_batches FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));
CREATE POLICY "Edit role 1 can insert commission batches" ON public.commission_batches FOR INSERT WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role));
CREATE POLICY "Edit role 1 can update commission batches" ON public.commission_batches FOR UPDATE USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Entries policies
CREATE POLICY "Acceso total can manage commission entries" ON public.commission_entries FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view commission entries" ON public.commission_entries FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));
CREATE POLICY "Edit role 1 can insert commission entries" ON public.commission_entries FOR INSERT WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role));
CREATE POLICY "Edit role 1 can update commission entries" ON public.commission_entries FOR UPDATE USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Assignments policies
CREATE POLICY "Acceso total can manage commission assignments" ON public.commission_assignments FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view commission assignments" ON public.commission_assignments FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role));
CREATE POLICY "Edit role 1 can insert commission assignments" ON public.commission_assignments FOR INSERT WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role));

-- Updated_at triggers
CREATE TRIGGER update_commission_rules_updated_at BEFORE UPDATE ON public.commission_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_batches_updated_at BEFORE UPDATE ON public.commission_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commission_entries_updated_at BEFORE UPDATE ON public.commission_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
