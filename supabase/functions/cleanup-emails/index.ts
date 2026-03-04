import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Cutoff date: emails created before this date are NOT affected by retention rules
const SYSTEM_LAUNCH_DATE = "2026-03-04T00:00:00Z";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    let deletedGuest = 0;
    let deletedFree = 0;

    // 1. Clean up GUEST emails (aliases with no user_id) older than 24 hours
    // Only emails received AFTER system launch date
    const guest24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get guest aliases (no user_id)
    const { data: guestAliases } = await supabase
      .from("email_aliases")
      .select("id")
      .is("user_id", null);

    if (guestAliases && guestAliases.length > 0) {
      const guestAliasIds = guestAliases.map((a) => a.id);

      // Delete old emails for guest aliases, only those after launch date
      const { count } = await supabase
        .from("received_emails")
        .delete({ count: "exact" })
        .in("alias_id", guestAliasIds)
        .lt("received_at", guest24hAgo)
        .gte("received_at", SYSTEM_LAUNCH_DATE);

      deletedGuest = count || 0;
    }

    // 2. Clean up FREE plan emails older than 7 days
    const free7dAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get free plan user IDs
    const { data: freeProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("plan", "free");

    if (freeProfiles && freeProfiles.length > 0) {
      const freeUserIds = freeProfiles.map((p) => p.id);

      // Get aliases owned by free users
      const { data: freeAliases } = await supabase
        .from("email_aliases")
        .select("id")
        .in("user_id", freeUserIds);

      if (freeAliases && freeAliases.length > 0) {
        const freeAliasIds = freeAliases.map((a) => a.id);

        const { count } = await supabase
          .from("received_emails")
          .delete({ count: "exact" })
          .in("alias_id", freeAliasIds)
          .lt("received_at", free7dAgo)
          .gte("received_at", SYSTEM_LAUNCH_DATE);

        deletedFree = count || 0;
      }
    }

    console.log(`Cleanup complete: ${deletedGuest} guest emails, ${deletedFree} free emails deleted`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted_guest: deletedGuest,
        deleted_free: deletedFree,
        timestamp: now.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cleanup error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
