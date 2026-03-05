import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Load Cryptomus credentials from payment_gateways table
    const { data: gateway } = await supabaseAdmin
      .from("payment_gateways")
      .select("config")
      .eq("gateway_type", "cryptomus")
      .eq("is_active", true)
      .single();

    const CRYPTOMUS_MERCHANT_ID = gateway?.config?.merchant_id || Deno.env.get("CRYPTOMUS_MERCHANT_ID");
    const CRYPTOMUS_API_KEY = gateway?.config?.api_key || Deno.env.get("CRYPTOMUS_API_KEY");

    if (!CRYPTOMUS_MERCHANT_ID || !CRYPTOMUS_API_KEY) {
      throw new Error("Cryptomus credentials not configured. Please set them in Admin → Gateways.");
    }

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { planType, returnUrl } = await req.json();
    const amount = planType === "lifetime" ? "10.00" : "1.00";
    const orderId = `mailrcv_${user.id}_${Date.now()}`;

    // Create payment order in DB
    const { data: order, error: orderError } = await supabaseAdmin
      .from("payment_orders")
      .insert({
        user_id: user.id,
        plan_type: "paid",
        amount: parseFloat(amount),
        currency: "USD",
        payment_method: "cryptomus",
        status: "pending",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create Cryptomus invoice
    const body = JSON.stringify({
      amount,
      currency: "USD",
      order_id: orderId,
      url_return: returnUrl || `${SUPABASE_URL.replace('.supabase.co', '')}/dashboard`,
      url_callback: `${SUPABASE_URL}/functions/v1/cryptomus-webhook`,
      lifetime: 900,
      is_payment_multiple: false,
      additional_data: JSON.stringify({ paymentOrderId: order.id, userId: user.id }),
    });

    const sign = await md5(toBase64(body) + CRYPTOMUS_API_KEY);

    const response = await fetch("https://api.cryptomus.com/v1/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        merchant: CRYPTOMUS_MERCHANT_ID,
        sign,
      },
      body,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Cryptomus API error:", response.status, errorBody);
      throw new Error("Failed to create Cryptomus invoice");
    }

    const cryptomusData = await response.json();

    // Update order with cryptomus reference
    await supabaseAdmin
      .from("payment_orders")
      .update({ binance_order_id: cryptomusData.result?.uuid || orderId })
      .eq("id", order.id);

    return new Response(
      JSON.stringify({
        success: true,
        paymentUrl: cryptomusData.result?.url,
        paymentOrderId: order.id,
        uuid: cryptomusData.result?.uuid,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
