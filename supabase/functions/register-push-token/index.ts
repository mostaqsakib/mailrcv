import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegisterTokenRequest {
  alias_id: string;
  fcm_token: string;
  device_info?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { alias_id, fcm_token, device_info }: RegisterTokenRequest = await req.json();

    if (!alias_id || !fcm_token) {
      return new Response(
        JSON.stringify({ error: "alias_id and fcm_token are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify alias exists
    const { data: alias, error: aliasError } = await supabase
      .from("email_aliases")
      .select("id")
      .eq("id", alias_id)
      .maybeSingle();

    if (aliasError || !alias) {
      return new Response(
        JSON.stringify({ error: "Invalid alias_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Upsert the token (update if exists, insert if new)
    const { data, error } = await supabase
      .from("push_tokens")
      .upsert(
        { 
          alias_id, 
          fcm_token, 
          device_info,
          updated_at: new Date().toISOString()
        },
        { 
          onConflict: "alias_id,fcm_token",
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Failed to register token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to register token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Push token registered:", { alias_id, token_id: data.id });

    return new Response(
      JSON.stringify({ success: true, token_id: data.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("Error registering push token:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
