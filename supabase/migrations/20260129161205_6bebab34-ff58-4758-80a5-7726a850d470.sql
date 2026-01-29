-- Create broker_settings table for brokerage configuration
CREATE TABLE public.broker_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Mi Corretaje',
  identification text,
  phone text,
  email text,
  address text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.broker_settings ENABLE ROW LEVEL SECURITY;

-- Users with any role can view broker settings
CREATE POLICY "Users with role can view broker settings" 
ON public.broker_settings 
FOR SELECT 
USING (has_any_role(auth.uid()));

-- Only acceso_total can update broker settings
CREATE POLICY "Acceso total can update broker settings" 
ON public.broker_settings 
FOR UPDATE 
USING (has_role(auth.uid(), 'acceso_total'));

-- Only acceso_total can insert broker settings
CREATE POLICY "Acceso total can insert broker settings" 
ON public.broker_settings 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'acceso_total'));

-- Create trigger for updated_at
CREATE TRIGGER update_broker_settings_updated_at
BEFORE UPDATE ON public.broker_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default record
INSERT INTO public.broker_settings (name) VALUES ('GIP Asesores Integrales');

-- Create storage bucket for broker assets (logo)
INSERT INTO storage.buckets (id, name, public) VALUES ('broker-assets', 'broker-assets', true);

-- Storage policies for broker-assets bucket
CREATE POLICY "Anyone can view broker assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'broker-assets');

CREATE POLICY "Acceso total can upload broker assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'broker-assets' AND has_role(auth.uid(), 'acceso_total'));

CREATE POLICY "Acceso total can update broker assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'broker-assets' AND has_role(auth.uid(), 'acceso_total'));

CREATE POLICY "Acceso total can delete broker assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'broker-assets' AND has_role(auth.uid(), 'acceso_total'));