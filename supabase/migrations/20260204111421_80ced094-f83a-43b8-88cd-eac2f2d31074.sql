-- Add delete policy for email_aliases table
CREATE POLICY "Allow public delete on email_aliases"
ON public.email_aliases FOR DELETE
USING (true);