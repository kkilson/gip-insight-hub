
-- Enum for case status
CREATE TYPE public.tracking_case_status AS ENUM ('abierto', 'en_progreso', 'en_espera', 'completado', 'cancelado');

-- Table: tracking_case_types (configurable case types)
CREATE TABLE public.tracking_case_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  default_duration_days integer NOT NULL DEFAULT 30,
  is_active boolean NOT NULL DEFAULT true,
  affects_consumption boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: tracking_case_phases (phases per case type)
CREATE TABLE public.tracking_case_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type_id uuid NOT NULL REFERENCES public.tracking_case_types(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  expected_duration_days integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: tracking_cases (individual cases)
CREATE TABLE public.tracking_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type_id uuid NOT NULL REFERENCES public.tracking_case_types(id),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  policy_id uuid REFERENCES public.policies(id),
  current_phase_id uuid REFERENCES public.tracking_case_phases(id),
  status tracking_case_status NOT NULL DEFAULT 'abierto',
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'normal',
  opened_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz,
  due_date date,
  affects_consumption boolean NOT NULL DEFAULT false,
  consumption_id uuid REFERENCES public.policy_consumptions(id),
  renewal_id uuid REFERENCES public.renewal_configs(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: tracking_case_updates (phase transitions and notes)
CREATE TABLE public.tracking_case_updates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.tracking_cases(id) ON DELETE CASCADE,
  previous_phase_id uuid REFERENCES public.tracking_case_phases(id),
  new_phase_id uuid REFERENCES public.tracking_case_phases(id),
  previous_status tracking_case_status,
  new_status tracking_case_status,
  notes text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Table: tracking_follow_up_patterns (automated contact patterns per case type)
CREATE TABLE public.tracking_follow_up_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_type_id uuid NOT NULL REFERENCES public.tracking_case_types(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.tracking_case_phases(id) ON DELETE CASCADE,
  days_after_phase_start integer NOT NULL DEFAULT 1,
  action_type text NOT NULL DEFAULT 'mensaje',
  message_template text,
  channel text NOT NULL DEFAULT 'whatsapp',
  is_active boolean NOT NULL DEFAULT true,
  requires_approval boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Table: tracking_scheduled_reminders (generated reminders)
CREATE TABLE public.tracking_scheduled_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.tracking_cases(id) ON DELETE CASCADE,
  pattern_id uuid REFERENCES public.tracking_follow_up_patterns(id),
  scheduled_date timestamptz NOT NULL,
  sent_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  status text NOT NULL DEFAULT 'pendiente',
  channel text NOT NULL DEFAULT 'whatsapp',
  message_content text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.tracking_case_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_case_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_case_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_follow_up_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracking_scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tracking_case_types
CREATE POLICY "Acceso total can manage case types" ON public.tracking_case_types FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with role can view case types" ON public.tracking_case_types FOR SELECT USING (has_any_role(auth.uid()));

-- RLS Policies for tracking_case_phases
CREATE POLICY "Acceso total can manage case phases" ON public.tracking_case_phases FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with role can view case phases" ON public.tracking_case_phases FOR SELECT USING (has_any_role(auth.uid()));

-- RLS Policies for tracking_cases
CREATE POLICY "Acceso total can manage cases" ON public.tracking_cases FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can manage cases" ON public.tracking_cases FOR ALL USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));
CREATE POLICY "Users with role can view cases" ON public.tracking_cases FOR SELECT USING (has_any_role(auth.uid()));

-- RLS Policies for tracking_case_updates
CREATE POLICY "Acceso total can manage case updates" ON public.tracking_case_updates FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can insert case updates" ON public.tracking_case_updates FOR INSERT WITH CHECK (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));
CREATE POLICY "Users with role can view case updates" ON public.tracking_case_updates FOR SELECT USING (has_any_role(auth.uid()));

-- RLS Policies for tracking_follow_up_patterns
CREATE POLICY "Acceso total can manage follow up patterns" ON public.tracking_follow_up_patterns FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with role can view follow up patterns" ON public.tracking_follow_up_patterns FOR SELECT USING (has_any_role(auth.uid()));

-- RLS Policies for tracking_scheduled_reminders
CREATE POLICY "Acceso total can manage scheduled reminders" ON public.tracking_scheduled_reminders FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can manage scheduled reminders" ON public.tracking_scheduled_reminders FOR ALL USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));
CREATE POLICY "Users with role can view scheduled reminders" ON public.tracking_scheduled_reminders FOR SELECT USING (has_any_role(auth.uid()));

-- Insert default case types
INSERT INTO public.tracking_case_types (name, description, default_duration_days, affects_consumption) VALUES
  ('Reembolso', 'Seguimiento de reembolsos médicos - 3 fases (~30 días)', 30, true),
  ('Carta Aval', 'Seguimiento de cartas avales - plazo de 14 días hábiles', 14, true),
  ('Emergencia/Urgencia', 'Seguimiento post-atención médica de emergencia', 7, true),
  ('Notificación de Pago', 'Seguimiento de notificaciones de pago', 15, false),
  ('Cambio Administrativo', 'Seguimiento de cambios administrativos en pólizas', 10, false),
  ('Emisión', 'Seguimiento de emisión de pólizas nuevas', 15, false),
  ('Cotización', 'Seguimiento de cotizaciones enviadas', 10, false);

-- Insert default phases for Reembolso
INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Documentación Recibida', 'Se recibe la documentación del asegurado', 1, 10
FROM public.tracking_case_types WHERE name = 'Reembolso';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'En Revisión / Procesando', 'Sometido a la compañía, en proceso de revisión', 2, 10
FROM public.tracking_case_types WHERE name = 'Reembolso';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Procesado / Pagado', 'Reembolso procesado y pagado al asegurado', 3, 10
FROM public.tracking_case_types WHERE name = 'Reembolso';

-- Insert default phases for Carta Aval
INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Solicitud Enviada', 'Carta aval solicitada a la compañía', 1, 5
FROM public.tracking_case_types WHERE name = 'Carta Aval';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'En Proceso', 'Carta aval en proceso de aprobación', 2, 5
FROM public.tracking_case_types WHERE name = 'Carta Aval';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Aprobada / Emitida', 'Carta aval aprobada y emitida', 3, 4
FROM public.tracking_case_types WHERE name = 'Carta Aval';

-- Insert default phases for Emergencia
INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Atención Reportada', 'Se reporta la atención de emergencia', 1, 1
FROM public.tracking_case_types WHERE name = 'Emergencia/Urgencia';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Seguimiento Post-Atención', 'Contacto de seguimiento con el asegurado', 2, 3
FROM public.tracking_case_types WHERE name = 'Emergencia/Urgencia';

INSERT INTO public.tracking_case_phases (case_type_id, name, description, sort_order, expected_duration_days)
SELECT id, 'Caso Cerrado', 'Seguimiento completado, caso cerrado', 3, 3
FROM public.tracking_case_types WHERE name = 'Emergencia/Urgencia';
