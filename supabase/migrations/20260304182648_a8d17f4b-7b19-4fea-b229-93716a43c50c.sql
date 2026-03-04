
CREATE TABLE public.payment_gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_type text NOT NULL,
  display_name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.payment_gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage gateways" ON public.payment_gateways
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read active gateways" ON public.payment_gateways
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE TRIGGER update_payment_gateways_updated_at
  BEFORE UPDATE ON public.payment_gateways
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed default gateways
INSERT INTO public.payment_gateways (gateway_type, display_name, is_active, config) VALUES
  ('binance', 'Binance Pay', true, '{"pay_id": "526944888", "currency": "USDT"}'::jsonb),
  ('cryptomus', 'Cryptomus', false, '{"currency": "USD"}'::jsonb);
