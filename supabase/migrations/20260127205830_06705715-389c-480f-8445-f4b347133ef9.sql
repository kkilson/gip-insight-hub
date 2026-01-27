-- Create enum for identification types
CREATE TYPE public.identification_type AS ENUM ('cedula', 'pasaporte', 'ruc', 'otro');

-- Create enum for policy status
CREATE TYPE public.policy_status AS ENUM ('vigente', 'pendiente', 'cancelada', 'vencida', 'en_tramite');

-- Create enum for payment frequency
CREATE TYPE public.payment_frequency AS ENUM ('mensual', 'trimestral', 'semestral', 'anual', 'unico');

-- Create enum for relationship types
CREATE TYPE public.relationship_type AS ENUM ('conyuge', 'hijo', 'padre', 'madre', 'hermano', 'otro');

-- Create insurers catalog table
CREATE TABLE public.insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  ruc TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create products catalog table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create advisors table
CREATE TABLE public.advisors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  commission_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create clients (tomadores) table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identification_type identification_type NOT NULL DEFAULT 'cedula',
  identification_number TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  address TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Ecuador',
  birth_date DATE,
  occupation TEXT,
  workplace TEXT,
  notes TEXT,
  advisor_id UUID REFERENCES public.advisors(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(identification_type, identification_number)
);

-- Create policies table
CREATE TABLE public.policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  insurer_id UUID REFERENCES public.insurers(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  policy_number TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status policy_status DEFAULT 'en_tramite',
  premium DECIMAL(12,2),
  payment_frequency payment_frequency DEFAULT 'mensual',
  coverage_amount DECIMAL(14,2),
  deductible DECIMAL(12,2),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create beneficiaries table
CREATE TABLE public.beneficiaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_id UUID REFERENCES public.policies(id) ON DELETE CASCADE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  identification_type identification_type DEFAULT 'cedula',
  identification_number TEXT,
  relationship relationship_type NOT NULL,
  percentage DECIMAL(5,2) NOT NULL DEFAULT 100,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;

-- RLS for insurers (catalog - read for all authenticated with role, write for acceso_total)
CREATE POLICY "Users with role can view insurers"
  ON public.insurers FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Acceso total can manage insurers"
  ON public.insurers FOR ALL
  USING (public.has_role(auth.uid(), 'acceso_total'));

-- RLS for products (catalog)
CREATE POLICY "Users with role can view products"
  ON public.products FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Acceso total can manage products"
  ON public.products FOR ALL
  USING (public.has_role(auth.uid(), 'acceso_total'));

-- RLS for advisors
CREATE POLICY "Users with role can view advisors"
  ON public.advisors FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Acceso total can manage advisors"
  ON public.advisors FOR ALL
  USING (public.has_role(auth.uid(), 'acceso_total'));

-- RLS for clients
CREATE POLICY "Users with role can view clients"
  ON public.clients FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert clients"
  ON public.clients FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can update clients"
  ON public.clients FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Acceso total can delete clients"
  ON public.clients FOR DELETE
  USING (public.has_role(auth.uid(), 'acceso_total'));

-- RLS for policies
CREATE POLICY "Users with role can view policies"
  ON public.policies FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert policies"
  ON public.policies FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can update policies"
  ON public.policies FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Acceso total can delete policies"
  ON public.policies FOR DELETE
  USING (public.has_role(auth.uid(), 'acceso_total'));

-- RLS for beneficiaries
CREATE POLICY "Users with role can view beneficiaries"
  ON public.beneficiaries FOR SELECT
  USING (public.has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert beneficiaries"
  ON public.beneficiaries FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can update beneficiaries"
  ON public.beneficiaries FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can delete beneficiaries"
  ON public.beneficiaries FOR DELETE
  USING (
    public.has_role(auth.uid(), 'acceso_total') OR 
    public.has_role(auth.uid(), 'revision_edicion_1') OR 
    public.has_role(auth.uid(), 'revision_edicion_2')
  );

-- Create triggers for updated_at
CREATE TRIGGER update_insurers_updated_at
  BEFORE UPDATE ON public.insurers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_advisors_updated_at
  BEFORE UPDATE ON public.advisors
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_policies_updated_at
  BEFORE UPDATE ON public.policies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_beneficiaries_updated_at
  BEFORE UPDATE ON public.beneficiaries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default insurers for Ecuador
INSERT INTO public.insurers (name, short_name) VALUES
  ('Seguros Equinoccial', 'Equinoccial'),
  ('AIG Metropolitana', 'AIG'),
  ('Seguros Sucre', 'Sucre'),
  ('Liberty Seguros', 'Liberty'),
  ('Mapfre Atlas', 'Mapfre'),
  ('Seguros del Pichincha', 'Pichincha'),
  ('Seguros Oriente', 'Oriente'),
  ('Aseguradora del Sur', 'Sur'),
  ('Latina Seguros', 'Latina'),
  ('Sweaden Seguros', 'Sweaden'),
  ('QBE Seguros Colonial', 'QBE'),
  ('Generali Ecuador', 'Generali'),
  ('Seguros Confianza', 'Confianza'),
  ('Chubb Seguros Ecuador', 'Chubb'),
  ('BMI del Ecuador', 'BMI');