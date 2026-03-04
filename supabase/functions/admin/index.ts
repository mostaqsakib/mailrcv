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

    // Check admin role
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    // --- STATS ---
    if (action === "stats") {
      const [profiles, aliases, emails, orders] = await Promise.all([
        supabase.from("profiles").select("plan", { count: "exact" }),
        supabase.from("email_aliases").select("id", { count: "exact" }),
        supabase.from("received_emails").select("id", { count: "exact" }),
        supabase.from("payment_orders").select("status, amount"),
      ]);

      // Plan breakdown
      const { data: planData } = await supabase.from("profiles").select("plan");
      const planCounts = { guest: 0, free: 0, paid: 0 };
      (planData || []).forEach((p: any) => {
        if (p.plan in planCounts) planCounts[p.plan as keyof typeof planCounts]++;
      });

      // Payment stats
      const orderData = orders.data || [];
      const totalRevenue = orderData
        .filter((o: any) => o.status === "verified")
        .reduce((sum: number, o: any) => sum + parseFloat(o.amount), 0);
      const verifiedOrders = orderData.filter((o: any) => o.status === "verified").length;

      return new Response(
        JSON.stringify({
          totalUsers: profiles.count || 0,
          totalInboxes: aliases.count || 0,
          totalEmails: emails.count || 0,
          planCounts,
          totalRevenue,
          verifiedOrders,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- USERS LIST ---
    if (action === "users") {
      const page = params.page || 0;
      const limit = 50;
      const { data, count } = await supabase
        .from("profiles")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      return new Response(
        JSON.stringify({ users: data || [], total: count || 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- UPDATE USER PLAN ---
    if (action === "update_plan") {
      const { userId, plan, planExpiresAt } = params;
      const updateData: any = { plan };
      if (planExpiresAt) updateData.plan_expires_at = planExpiresAt;
      else updateData.plan_expires_at = null;

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- COUPONS LIST ---
    if (action === "coupons") {
      const { data } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      return new Response(JSON.stringify({ coupons: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- CREATE COUPON ---
    if (action === "create_coupon") {
      const { code, coupon_type, value, max_uses, expires_at } = params;
      const { data, error } = await supabase.from("coupons").insert({
        code: code.toUpperCase(),
        coupon_type,
        value,
        max_uses: max_uses || 1,
        expires_at: expires_at || null,
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ coupon: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DELETE COUPON ---
    if (action === "delete_coupon") {
      const { couponId } = params;
      const { error } = await supabase.from("coupons").delete().eq("id", couponId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TOGGLE COUPON ---
    if (action === "toggle_coupon") {
      const { couponId, is_active } = params;
      const { error } = await supabase
        .from("coupons")
        .update({ is_active })
        .eq("id", couponId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- PAYMENT ORDERS ---
    if (action === "payment_orders") {
      const page = params.page || 0;
      const limit = 50;
      const { data, count } = await supabase
        .from("payment_orders")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * limit, (page + 1) * limit - 1);

      const userIds = [...new Set((data || []).map((o: any) => o.user_id))];
      let userMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, email, display_name")
          .in("id", userIds);
        (profiles || []).forEach((p: any) => {
          userMap[p.id] = p.email || p.display_name || p.id;
        });
      }

      return new Response(
        JSON.stringify({ orders: data || [], total: count || 0, userMap }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- GATEWAYS LIST ---
    if (action === "gateways") {
      const { data } = await supabase
        .from("payment_gateways")
        .select("*")
        .order("created_at", { ascending: true });

      return new Response(JSON.stringify({ gateways: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- CREATE GATEWAY ---
    if (action === "create_gateway") {
      const { gateway_type, display_name, config } = params;
      const { data, error } = await supabase.from("payment_gateways").insert({
        gateway_type,
        display_name,
        config: config || {},
      }).select().single();

      if (error) throw error;
      return new Response(JSON.stringify({ gateway: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- UPDATE GATEWAY ---
    if (action === "update_gateway") {
      const { gatewayId, display_name, config, is_active } = params;
      const updateData: any = {};
      if (display_name !== undefined) updateData.display_name = display_name;
      if (config !== undefined) updateData.config = config;
      if (is_active !== undefined) updateData.is_active = is_active;

      const { error } = await supabase
        .from("payment_gateways")
        .update(updateData)
        .eq("id", gatewayId);

      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- DELETE GATEWAY ---
    if (action === "delete_gateway") {
      const { gatewayId } = params;
      const { error } = await supabase.from("payment_gateways").delete().eq("id", gatewayId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TOGGLE GATEWAY ---
    if (action === "toggle_gateway") {
      const { gatewayId, is_active } = params;
      const { error } = await supabase
        .from("payment_gateways")
        .update({ is_active })
        .eq("id", gatewayId);
      if (error) throw error;
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
