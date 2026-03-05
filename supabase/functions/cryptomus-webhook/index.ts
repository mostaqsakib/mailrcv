import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function md5(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("MD5", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function toBase64(str: string): string {
  return btoa(str);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load Cryptomus API key from payment_gateways table
    const { data: gateway } = await supabase
      .from("payment_gateways")
      .select("config")
      .eq("gateway_type", "cryptomus")
      .eq("is_active", true)
      .single();

    const CRYPTOMUS_API_KEY = gateway?.config?.api_key || Deno.env.get("CRYPTOMUS_API_KEY");
    if (!CRYPTOMUS_API_KEY) {
      throw new Error("Cryptomus API key not configured");
    }

    const body = await req.json();

    // Verify signature
    const { sign: receivedSign, ...dataWithoutSign } = body;
    const dataString = JSON.stringify(dataWithoutSign);
    const expectedSign = await md5(toBase64(dataString) + CRYPTOMUS_API_KEY);

    if (receivedSign !== expectedSign) {
      console.error("Invalid webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const status = body.status;
    const additionalData = body.additional_data ? JSON.parse(body.additional_data) : null;

    if (!additionalData?.paymentOrderId || !additionalData?.userId) {
      console.error("Missing additional_data in webhook");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Only process successful payments
    if (status === "paid" || status === "paid_over") {
      const { data: order } = await supabase
        .from("payment_orders")
        .select("*")
        .eq("id", additionalData.paymentOrderId)
        .single();

      if (!order || order.status === "verified") {
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark order as verified
      await supabase
        .from("payment_orders")
        .update({
          status: "verified",
          binance_order_id: body.uuid || body.order_id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", additionalData.paymentOrderId);

      // Upgrade user plan
      const planUpdate: any = { plan: "paid" };
      if (order.amount >= 10) {
        planUpdate.plan_expires_at = null; // Lifetime
      } else {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        planUpdate.plan_expires_at = expiresAt.toISOString();
      }

      await supabase.from("profiles").update(planUpdate).eq("id", additionalData.userId);

      console.log(`Payment verified for user ${additionalData.userId}, order ${additionalData.paymentOrderId}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
