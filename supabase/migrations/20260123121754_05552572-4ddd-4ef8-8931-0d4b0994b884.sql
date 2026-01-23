-- Add password_hash column to email_aliases for password-protected inboxes
ALTER TABLE public.email_aliases 
ADD COLUMN password_hash text;

-- Add is_password_protected column to easily check inbox type
ALTER TABLE public.email_aliases 
ADD COLUMN is_password_protected boolean NOT NULL DEFAULT false;

-- Create index for faster lookups on password-protected aliases
CREATE INDEX idx_email_aliases_password_protected ON public.email_aliases(username, is_password_protected) WHERE is_password_protected = true;