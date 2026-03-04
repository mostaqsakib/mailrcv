
CREATE TABLE public.payment_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  plan_type text NOT NULL DEFAULT 'paid',
  amount numeric(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'USDT',
  payment_method text NOT NULL DEFAULT 'binance',
  binance_order_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  verified_at timestamp with time zone,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '15 minutes')
);

ALTER TABLE public.payment_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders" ON public.payment_orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own orders" ON public.payment_orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Service role can update orders" ON public.payment_orders
  FOR UPDATE
  USING (true);
