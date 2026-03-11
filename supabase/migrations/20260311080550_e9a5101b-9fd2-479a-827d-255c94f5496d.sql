
-- Add share_token column to email_aliases
ALTER TABLE public.email_aliases ADD COLUMN IF NOT EXISTS share_token text;

-- Generate share tokens for all existing user-owned aliases
UPDATE public.email_aliases 
SET share_token = substr(replace(replace(encode(gen_random_bytes(12), 'base64'), '+', ''), '/', ''), 1, 16)
WHERE user_id IS NOT NULL AND share_token IS NULL;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_email_aliases_share_token ON public.email_aliases(share_token) WHERE share_token IS NOT NULL;
