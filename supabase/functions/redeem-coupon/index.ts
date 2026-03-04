import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: userError } = await anonClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, code } = await req.json();

    if (action !== "redeem" || !code) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find coupon
    const { data: coupon, error: couponError } = await supabase
      .from("coupons")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("is_active", true)
      .maybeSingle();

    if (couponError || !coupon) {
      return new Response(JSON.stringify({ error: "Invalid or expired coupon code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "This coupon has expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check max uses
    if (coupon.used_count >= coupon.max_uses) {
      return new Response(JSON.stringify({ error: "This coupon has been fully redeemed" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already redeemed
    const { data: existing } = await supabase
      .from("coupon_redemptions")
      .select("id")
      .eq("coupon_id", coupon.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ error: "You've already used this coupon" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apply coupon
    let message = "";
    if (coupon.coupon_type === "trial_days") {
      const d = new Date();
      d.setDate(d.getDate() + coupon.value);
      await supabase.from("profiles").update({
        plan: "paid",
        plan_expires_at: d.toISOString(),
      }).eq("id", user.id);
      message = `Pro plan activated for ${coupon.value} days!`;
    } else if (coupon.coupon_type === "lifetime") {
      await supabase.from("profiles").update({
        plan: "paid",
        plan_expires_at: null,
      }).eq("id", user.id);
      message = "Lifetime Pro plan activated!";
    } else if (coupon.coupon_type === "discount_percent") {
      message = `${coupon.value}% discount applied! Use at checkout.`;
    }

    // Record redemption
    await supabase.from("coupon_redemptions").insert({
      coupon_id: coupon.id,
      user_id: user.id,
    });

    // Increment used count
    await supabase.from("coupons").update({
      used_count: coupon.used_count + 1,
    }).eq("id", coupon.id);

    return new Response(
      JSON.stringify({ success: true, message, coupon_type: coupon.coupon_type }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
