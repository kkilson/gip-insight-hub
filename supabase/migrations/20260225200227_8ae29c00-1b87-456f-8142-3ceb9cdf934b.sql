
-- Enum for sales pipeline stages
CREATE TYPE public.sales_stage AS ENUM (
  'lead_identificado',
  'reunion_inicial',
  'propuesta',
  'envio_propuesta',
  'seguimiento_1',
  'seguimiento_2',
  'seguimiento_3',
  'propuesta_aceptada',
  'ganado',
  'perdido',
  'postergado'
);

-- Main opportunities table
CREATE TABLE public.sales_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES public.clients(id),
  prospect_name text NOT NULL,
  prospect_email text,
  prospect_phone text,
  prospect_company text,
  stage sales_stage NOT NULL DEFAULT 'lead_identificado',
  notes text,
  expected_close_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage sales opportunities" ON public.sales_opportunities FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with edit role can view sales opportunities" ON public.sales_opportunities FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE TRIGGER update_sales_opportunities_updated_at BEFORE UPDATE ON public.sales_opportunities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Products linked to each opportunity with commission info
CREATE TABLE public.sales_opportunity_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  insurer_id uuid REFERENCES public.insurers(id),
  product_id uuid REFERENCES public.products(id),
  annual_premium numeric NOT NULL DEFAULT 0,
  commission_rate numeric NOT NULL DEFAULT 0,
  payment_frequency text NOT NULL DEFAULT 'anual',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_opportunity_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage sales products" ON public.sales_opportunity_products FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with edit role can view sales products" ON public.sales_opportunity_products FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));

CREATE TRIGGER update_sales_opportunity_products_updated_at BEFORE UPDATE ON public.sales_opportunity_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Activity log for tracking stage changes
CREATE TABLE public.sales_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.sales_opportunities(id) ON DELETE CASCADE,
  previous_stage sales_stage,
  new_stage sales_stage NOT NULL,
  notes text,
  changed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.sales_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total can manage sales activity" ON public.sales_activity_log FOR ALL USING (has_role(auth.uid(), 'acceso_total'::app_role));
CREATE POLICY "Users with edit role can view sales activity" ON public.sales_activity_log FOR SELECT USING (has_role(auth.uid(), 'acceso_total'::app_role) OR has_role(auth.uid(), 'revision_edicion_1'::app_role));
