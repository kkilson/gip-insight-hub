-- Create storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('attachments', 'attachments', false);

-- Create table to track attachments
CREATE TABLE public.attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('client', 'policy', 'beneficiary')),
  entity_id UUID NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for attachments table
CREATE POLICY "Users with role can view attachments"
  ON public.attachments FOR SELECT
  USING (has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can insert attachments"
  ON public.attachments FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

CREATE POLICY "Users with edit role can delete attachments"
  ON public.attachments FOR DELETE
  USING (
    has_role(auth.uid(), 'acceso_total') OR 
    has_role(auth.uid(), 'revision_edicion_1') OR 
    has_role(auth.uid(), 'revision_edicion_2')
  );

-- Storage policies for attachments bucket
CREATE POLICY "Users with role can view attachments files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'attachments' AND has_any_role(auth.uid()));

CREATE POLICY "Users with edit role can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'attachments' AND (
      has_role(auth.uid(), 'acceso_total') OR 
      has_role(auth.uid(), 'revision_edicion_1') OR 
      has_role(auth.uid(), 'revision_edicion_2')
    )
  );

CREATE POLICY "Users with edit role can delete attachments files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'attachments' AND (
      has_role(auth.uid(), 'acceso_total') OR 
      has_role(auth.uid(), 'revision_edicion_1') OR 
      has_role(auth.uid(), 'revision_edicion_2')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();