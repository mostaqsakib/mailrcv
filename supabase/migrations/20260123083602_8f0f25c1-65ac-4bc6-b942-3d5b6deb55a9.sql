-- Create table to store FCM push tokens for devices
CREATE TABLE public.push_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  alias_id UUID REFERENCES public.email_aliases(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_info TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(alias_id, fcm_token)
);

-- Enable RLS (public access for now since no auth)
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Allow public read/write for push tokens
CREATE POLICY "Allow public insert on push_tokens" 
ON public.push_tokens 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public select on push_tokens" 
ON public.push_tokens 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public update on push_tokens" 
ON public.push_tokens 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public delete on push_tokens" 
ON public.push_tokens 
FOR DELETE 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_push_tokens_updated_at
BEFORE UPDATE ON public.push_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();