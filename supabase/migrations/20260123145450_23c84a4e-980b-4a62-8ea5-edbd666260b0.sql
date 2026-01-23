-- Create app_version table to track latest version
CREATE TABLE public.app_version (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  version_code INTEGER NOT NULL DEFAULT 1,
  version_name TEXT NOT NULL DEFAULT '1.0.0',
  release_notes TEXT,
  download_url TEXT DEFAULT 'https://mailrcv.site/download',
  is_force_update BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_version ENABLE ROW LEVEL SECURITY;

-- Everyone can read version info
CREATE POLICY "Anyone can read app version" 
ON public.app_version 
FOR SELECT 
USING (true);

-- Insert initial version
INSERT INTO public.app_version (version_code, version_name, release_notes)
VALUES (1, '1.0.0', 'Initial release with email inbox, notifications, and more!');