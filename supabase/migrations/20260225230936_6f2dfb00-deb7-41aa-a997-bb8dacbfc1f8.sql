
-- Partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  phone text,
  email text,
  rif text,
  address text,
  category text,
  logo_url text,
  notes text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage partners" ON public.partners FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view partners" ON public.partners FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));

-- Partner services table
CREATE TABLE public.partner_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  discount_type text NOT NULL DEFAULT 'porcentaje' CHECK (discount_type IN ('porcentaje', 'monto_fijo')),
  discount_value numeric NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage partner services" ON public.partner_services FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can view partner services" ON public.partner_services FOR SELECT USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));

-- Discount codes table
CREATE TABLE public.discount_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.partner_services(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  code text NOT NULL UNIQUE,
  max_uses integer NOT NULL DEFAULT 1,
  current_uses integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'generado' CHECK (status IN ('generado', 'enviado', 'utilizado', 'expirado')),
  expires_at timestamptz,
  sent_at timestamptz,
  used_at timestamptz,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage discount codes" ON public.discount_codes FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Edit roles can manage discount codes" ON public.discount_codes FOR ALL USING (has_role(auth.uid(), 'revision_edicion_1'::app_role) OR has_role(auth.uid(), 'revision_edicion_2'::app_role));
