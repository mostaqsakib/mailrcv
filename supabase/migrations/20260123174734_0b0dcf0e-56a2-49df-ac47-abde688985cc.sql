-- Allow public insert and update on app_version table for GitHub Actions
CREATE POLICY "Allow public insert on app_version" 
ON public.app_version 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public update on app_version" 
ON public.app_version 
FOR UPDATE 
USING (true);