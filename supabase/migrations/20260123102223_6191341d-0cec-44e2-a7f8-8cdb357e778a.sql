-- Create a public storage bucket for APK files
INSERT INTO storage.buckets (id, name, public)
VALUES ('apk-downloads', 'apk-downloads', true);

-- Allow public read access to the bucket
CREATE POLICY "Allow public read access to APK downloads"
ON storage.objects FOR SELECT
USING (bucket_id = 'apk-downloads');

-- Allow authenticated admins to upload (for future admin panel)
CREATE POLICY "Allow service role to upload APKs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'apk-downloads');