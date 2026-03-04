import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.177.0/node/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BINANCE_API_KEY = Deno.env.get("BINANCE_API_KEY");
    const BINANCE_API_SECRET = Deno.env.get("BINANCE_API_SECRET");
    const BINANCE_PAY_ID = Deno.env.get("BINANCE_PAY_ID");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!BINANCE_API_KEY || !BINANCE_API_SECRET || !BINANCE_PAY_ID) {
      throw new Error("Binance credentials not configured");
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

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    const { orderId, paymentOrderId } = await req.json();

    if (!orderId || !paymentOrderId) {
      return new Response(
        JSON.stringify({ error: "orderId and paymentOrderId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service role client for DB operations
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the payment order
    const { data: order, error: orderError } = await supabaseAdmin
      .from("payment_orders")
      .select("*")
      .eq("id", paymentOrderId)
      .eq("user_id", userId)
      .single();

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: "Payment order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (order.status === "verified") {
      return new Response(
        JSON.stringify({ success: true, message: "Already verified" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if order expired
    if (new Date(order.expires_at) < new Date()) {
      await supabaseAdmin
        .from("payment_orders")
        .update({ status: "expired" })
        .eq("id", paymentOrderId);

      return new Response(
        JSON.stringify({ error: "Payment order has expired. Please create a new one." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query Binance Pay trade history to find the transaction
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createHmac("sha256", BINANCE_API_SECRET)
      .update(queryString)
      .digest("hex");

    // Use Binance Pay trade history endpoint
    const binanceUrl = `https://api.binance.com/sapi/v1/pay/transactions?${queryString}&signature=${signature}`;

    const binanceResponse = await fetch(binanceUrl, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": BINANCE_API_KEY,
        "Content-Type": "application/json",
      },
    });

    if (!binanceResponse.ok) {
      const errorBody = await binanceResponse.text();
      console.error("Binance API error:", binanceResponse.status, errorBody);
      return new Response(
        JSON.stringify({ error: "Failed to verify with Binance. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const binanceData = await binanceResponse.json();

    // Search for matching transaction by orderId
    // The user provides their Binance Pay order ID
    const matchingTx = binanceData.data?.find((tx: any) => {
      return (
        tx.orderNo === orderId &&
        tx.orderType === "C2C" &&
        parseFloat(tx.amount) >= order.amount &&
        tx.currency === order.currency
      );
    });

    if (!matchingTx) {
      return new Response(
        JSON.stringify({
          error: "Payment not found. Make sure you entered the correct Order ID and the payment has been completed.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Payment verified! Update order and user plan
    await supabaseAdmin
      .from("payment_orders")
      .update({
        status: "verified",
        binance_order_id: orderId,
        verified_at: new Date().toISOString(),
      })
      .eq("id", paymentOrderId);

    // Determine plan duration
    const planUpdate: any = { plan: "paid" };
    if (order.amount >= 10) {
      // Lifetime
      planUpdate.plan_expires_at = null;
    } else {
      // Monthly - 30 days
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      planUpdate.plan_expires_at = expiresAt.toISOString();
    }

    await supabaseAdmin.from("profiles").update(planUpdate).eq("id", userId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Payment verified successfully! Your plan has been upgraded.",
        plan: "paid",
        lifetime: order.amount >= 10,
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
