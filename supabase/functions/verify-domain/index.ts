import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { domain_id, domain_name } = await req.json();

    if (!domain_id || !domain_name) {
      return new Response(
        JSON.stringify({ error: "domain_id and domain_name required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the domain's verification code
    const { data: domain, error: domainError } = await supabase
      .from("domains")
      .select("verification_code")
      .eq("id", domain_id)
      .single();

    if (domainError || !domain) {
      return new Response(
        JSON.stringify({ error: "Domain not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check MX records using DNS-over-HTTPS (Google)
    let mxValid = false;
    try {
      const mxRes = await fetch(
        `https://dns.google/resolve?name=${domain_name}&type=MX`
      );
      const mxData = await mxRes.json();
      if (mxData.Answer) {
        mxValid = mxData.Answer.some((record: any) => {
          const value = record.data?.toLowerCase().trim().replace(/\.$/, "");
          return (
            value?.includes("mx.mailrcv.site") ||
            value?.includes("route1.mx.cloudflare.net") ||
            value?.includes("route2.mx.cloudflare.net") ||
            value?.includes("route3.mx.cloudflare.net")
          );
        });
      }
    } catch (e) {
      console.error("MX lookup failed:", e);
    }

    // Check TXT records for verification
    let txtValid = false;
    const expectedTxt = `mailrcv-verify=${domain.verification_code}`;
    try {
      const txtRes = await fetch(
        `https://dns.google/resolve?name=${domain_name}&type=TXT`
      );
      const txtData = await txtRes.json();
      if (txtData.Answer) {
        txtValid = txtData.Answer.some((record: any) => {
          const value = record.data?.replace(/"/g, "").trim();
          return value === expectedTxt;
        });
      }
    } catch (e) {
      console.error("TXT lookup failed:", e);
    }

    const isVerified = mxValid && txtValid;

    if (isVerified) {
      await supabase
        .from("domains")
        .update({ is_verified: true })
        .eq("id", domain_id);
    }

    return new Response(
      JSON.stringify({
        verified: isVerified,
        mx_valid: mxValid,
        txt_valid: txtValid,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Error:", e);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
