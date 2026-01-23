import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { admin_key, version_code, version_name, release_notes, is_force_update, download_url } = await req.json();

    // Verify admin key
    const expectedKey = Deno.env.get("ADMIN_SECRET_KEY");
    if (!expectedKey || admin_key !== expectedKey) {
      console.error("Invalid admin key attempt");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid admin key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Updating app version: ${version_name} (code: ${version_code})`);

    // Upsert the version (update if exists, insert if not)
    const { data, error } = await supabase
      .from("app_version")
      .upsert({
        id: "00000000-0000-0000-0000-000000000001", // Fixed ID for single row
        version_code,
        version_name,
        release_notes,
        is_force_update,
        download_url: download_url || "https://github.com/Digitaliz/mailrcv/releases/latest",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    console.log("Version updated successfully:", data);

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error updating version:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
