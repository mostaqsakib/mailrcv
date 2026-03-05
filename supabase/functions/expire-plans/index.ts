import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Find all paid users whose plan has expired
    const { data: expiredProfiles, error } = await supabase
      .from("profiles")
      .select("id, email, plan_expires_at")
      .eq("plan", "paid")
      .not("plan_expires_at", "is", null)
      .lt("plan_expires_at", new Date().toISOString());

    if (error) {
      console.error("Error fetching expired profiles:", error);
      throw error;
    }

    if (!expiredProfiles || expiredProfiles.length === 0) {
      console.log("No expired plans found");
      return new Response(
        JSON.stringify({ message: "No expired plans", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Downgrade all expired users to free
    const expiredIds = expiredProfiles.map((p) => p.id);
    
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ plan: "free", plan_expires_at: null })
      .in("id", expiredIds);

    if (updateError) {
      console.error("Error downgrading profiles:", updateError);
      throw updateError;
    }

    console.log(`Downgraded ${expiredIds.length} expired profiles to free:`, expiredProfiles.map(p => p.email));

    return new Response(
      JSON.stringify({ 
        message: "Expired plans downgraded", 
        count: expiredIds.length,
        users: expiredProfiles.map(p => p.email),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in expire-plans:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
