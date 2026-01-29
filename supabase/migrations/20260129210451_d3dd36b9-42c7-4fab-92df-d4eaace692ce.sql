-- Table to track birthday greetings sent to clients
CREATE TABLE public.birthday_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  send_year INTEGER NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  channels JSONB NOT NULL DEFAULT '[]'::jsonb, -- ["whatsapp", "email"]
  status_whatsapp TEXT, -- enviado, error, pendiente, null
  status_email TEXT, -- enviado, error, pendiente, null
  error_whatsapp TEXT,
  error_email TEXT,
  card_path TEXT,
  sent_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, send_year) -- One send per client per year
);

-- Enable RLS
ALTER TABLE public.birthday_sends ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users with role can view birthday sends"
  ON public.birthday_sends
  FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert birthday sends"
  ON public.birthday_sends
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'acceso_total'::app_role) OR
    has_role(auth.uid(), 'revision_edicion_1'::app_role) OR
    has_role(auth.uid(), 'revision_edicion_2'::app_role)
  );

CREATE POLICY "Users with edit role can update birthday sends"
  ON public.birthday_sends
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'acceso_total'::app_role) OR
    has_role(auth.uid(), 'revision_edicion_1'::app_role) OR
    has_role(auth.uid(), 'revision_edicion_2'::app_role)
  );

CREATE POLICY "Acceso total can delete birthday sends"
  ON public.birthday_sends
  FOR DELETE
  USING (has_role(auth.uid(), 'acceso_total'::app_role));

-- Indexes for better performance
CREATE INDEX idx_birthday_sends_year ON public.birthday_sends(send_year);
CREATE INDEX idx_birthday_sends_client ON public.birthday_sends(client_id);
CREATE INDEX idx_birthday_sends_sent_at ON public.birthday_sends(sent_at);

-- Trigger for updated_at
CREATE TRIGGER update_birthday_sends_updated_at
  BEFORE UPDATE ON public.birthday_sends
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();