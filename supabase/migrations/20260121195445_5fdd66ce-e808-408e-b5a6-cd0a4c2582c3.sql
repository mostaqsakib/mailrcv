-- Create domains table to store user's custom domains
CREATE TABLE public.domains (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_name TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  verification_code TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
  forward_to_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create email aliases table to track created email addresses
CREATE TABLE public.email_aliases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  domain_id UUID REFERENCES public.domains(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  forward_to_email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(domain_id, username)
);

-- Create received emails table to store incoming emails
CREATE TABLE public.received_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID REFERENCES public.email_aliases(id) ON DELETE CASCADE,
  from_email TEXT NOT NULL,
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_read BOOLEAN NOT NULL DEFAULT false,
  is_forwarded BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS on all tables
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.received_emails ENABLE ROW LEVEL SECURITY;

-- For now, allow public read/write access (no auth required for this app)
-- This is intentional as the app is designed for anonymous usage
CREATE POLICY "Allow public read on domains" 
  ON public.domains FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on domains" 
  ON public.domains FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on domains" 
  ON public.domains FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read on email_aliases" 
  ON public.email_aliases FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on email_aliases" 
  ON public.email_aliases FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on email_aliases" 
  ON public.email_aliases FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public read on received_emails" 
  ON public.received_emails FOR SELECT 
  USING (true);

CREATE POLICY "Allow public insert on received_emails" 
  ON public.received_emails FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Allow public update on received_emails" 
  ON public.received_emails FOR UPDATE 
  USING (true);

CREATE POLICY "Allow public delete on received_emails" 
  ON public.received_emails FOR DELETE 
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_email_aliases_domain ON public.email_aliases(domain_id);
CREATE INDEX idx_email_aliases_username ON public.email_aliases(username);
CREATE INDEX idx_received_emails_alias ON public.received_emails(alias_id);
CREATE INDEX idx_received_emails_received_at ON public.received_emails(received_at DESC);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_domains_updated_at
  BEFORE UPDATE ON public.domains
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_email_aliases_updated_at
  BEFORE UPDATE ON public.email_aliases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for received_emails to show new emails instantly
ALTER PUBLICATION supabase_realtime ADD TABLE public.received_emails;