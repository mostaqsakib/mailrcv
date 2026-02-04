-- Create storage bucket for email attachments (inline images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('email-attachments', 'email-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for email-attachments bucket
CREATE POLICY "Anyone can read email attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'email-attachments');

CREATE POLICY "Service role can insert email attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'email-attachments');

CREATE POLICY "Service role can delete email attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'email-attachments');

-- Create email_attachments table to track inline images
CREATE TABLE public.email_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email_id uuid NOT NULL REFERENCES public.received_emails(id) ON DELETE CASCADE,
  content_id text NOT NULL,
  filename text,
  content_type text,
  storage_path text NOT NULL,
  storage_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for looking up attachments by email_id and content_id
CREATE INDEX idx_email_attachments_email_id ON public.email_attachments(email_id);
CREATE INDEX idx_email_attachments_content_id ON public.email_attachments(content_id);

-- Enable RLS
ALTER TABLE public.email_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies - public read access (like received_emails)
CREATE POLICY "Allow public read on email_attachments"
ON public.email_attachments FOR SELECT
USING (true);

CREATE POLICY "Allow public insert on email_attachments"
ON public.email_attachments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public delete on email_attachments"
ON public.email_attachments FOR DELETE
USING (true);