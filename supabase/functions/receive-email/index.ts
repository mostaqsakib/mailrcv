import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CloudflareEmailPayload {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  raw?: string;
}

interface SendGridWebhook {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  envelope?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const contentType = req.headers.get("content-type") || "";
    let fromEmail = "";
    let toAddress = "";
    let subject = "";
    let bodyText = "";
    let bodyHtml = "";

    // Detect source based on headers or content
    const isCloudflare = req.headers.get("cf-worker") || req.headers.get("x-source") === "cloudflare";
    
    if (contentType.includes("application/json")) {
      const jsonData = await req.json();
      console.log("Received JSON webhook:", JSON.stringify(jsonData, null, 2));
      
      // Cloudflare Email Workers format
      if (isCloudflare || jsonData.raw || jsonData.headers) {
        const cfData = jsonData as CloudflareEmailPayload;
        fromEmail = cfData.from || "";
        toAddress = cfData.to || "";
        subject = cfData.subject || "";
        bodyText = cfData.text || "";
        bodyHtml = cfData.html || "";
        
        // If raw email provided, we already have parsed data from worker
        console.log("Processing Cloudflare Email Workers payload");
      } else {
        // Generic JSON format (SendGrid JSON mode or custom)
        fromEmail = jsonData.from || "";
        toAddress = jsonData.to || "";
        subject = jsonData.subject || "";
        bodyText = jsonData.text || jsonData.body_text || "";
        bodyHtml = jsonData.html || jsonData.body_html || "";
      }
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      // SendGrid Inbound Parse format
      const formData = await req.formData();
      const emailData: SendGridWebhook = {
        from: formData.get("from") as string || "",
        to: formData.get("to") as string || "",
        subject: formData.get("subject") as string || "",
        text: formData.get("text") as string || "",
        html: formData.get("html") as string || "",
        envelope: formData.get("envelope") as string || "",
      };
      
      console.log("Received SendGrid form-data webhook:", JSON.stringify(emailData, null, 2));
      
      fromEmail = emailData.from;
      toAddress = emailData.to;
      subject = emailData.subject || "";
      bodyText = emailData.text || "";
      bodyHtml = emailData.html || "";
      
      // Parse envelope for more accurate recipient
      if (emailData.envelope) {
        try {
          const envelope = JSON.parse(emailData.envelope);
          if (envelope.to && envelope.to.length > 0) {
            toAddress = envelope.to[0];
          }
        } catch (e) {
          console.log("Failed to parse envelope:", e);
        }
      }
    } else {
      // Try JSON as fallback
      try {
        const jsonData = await req.json();
        fromEmail = jsonData.from || "";
        toAddress = jsonData.to || "";
        subject = jsonData.subject || "";
        bodyText = jsonData.text || "";
        bodyHtml = jsonData.html || "";
      } catch {
        return new Response(JSON.stringify({ error: "Unsupported content type" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!toAddress) {
      console.error("No recipient address found");
      return new Response(JSON.stringify({ error: "No recipient address" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the recipient email: username@domain
    const emailMatch = toAddress.match(/<?([^<>@\s]+)@([^<>\s]+)>?/);
    if (!emailMatch) {
      console.error("Invalid recipient format:", toAddress);
      return new Response(JSON.stringify({ error: "Invalid recipient format" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [, username, domainName] = emailMatch;
    console.log(`Parsed recipient: ${username}@${domainName}`);

    // Find the domain
    let { data: domain, error: domainError } = await supabase
      .from("domains")
      .select("id")
      .eq("domain_name", domainName.toLowerCase())
      .maybeSingle();

    if (domainError) {
      console.error("Domain lookup error:", domainError);
      return new Response(JSON.stringify({ error: "Domain lookup failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!domain) {
      console.log(`Domain not found: ${domainName}, creating it...`);
      const { data: newDomain, error: createDomainError } = await supabase
        .from("domains")
        .insert({ domain_name: domainName.toLowerCase(), is_verified: true })
        .select("id")
        .single();

      if (createDomainError || !newDomain) {
        console.error("Failed to create domain:", createDomainError);
        return new Response(JSON.stringify({ error: "Failed to create domain" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      domain = newDomain;
    }

    // Find or create the alias
    let { data: alias, error: aliasError } = await supabase
      .from("email_aliases")
      .select("id")
      .eq("username", username.toLowerCase())
      .eq("domain_id", domain.id)
      .maybeSingle();

    if (aliasError) {
      console.error("Alias lookup error:", aliasError);
    }

    if (!alias) {
      console.log(`Alias not found: ${username}, creating it...`);
      const { data: newAlias, error: createAliasError } = await supabase
        .from("email_aliases")
        .insert({ 
          username: username.toLowerCase(), 
          domain_id: domain.id,
          is_active: true 
        })
        .select("id")
        .single();

      if (createAliasError || !newAlias) {
        console.error("Failed to create alias:", createAliasError);
        return new Response(JSON.stringify({ error: "Failed to create alias" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      alias = newAlias;
    }

    // Extract sender email
    const fromMatch = fromEmail.match(/<?([^<>\s]+@[^<>\s]+)>?/);
    const senderEmail = fromMatch ? fromMatch[1] : fromEmail || "unknown@unknown.com";

    // Store the email
    const { data: savedEmail, error: saveError } = await supabase
      .from("received_emails")
      .insert({
        alias_id: alias.id,
        from_email: senderEmail,
        subject: subject || "(No Subject)",
        body_text: bodyText || null,
        body_html: bodyHtml || null,
        is_read: false,
        is_forwarded: false,
      })
      .select()
      .single();

    if (saveError) {
      console.error("Failed to save email:", saveError);
      return new Response(JSON.stringify({ error: "Failed to save email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update email count for the alias
    const { data: currentAlias } = await supabase
      .from("email_aliases")
      .select("email_count")
      .eq("id", alias.id)
      .single();

    if (currentAlias) {
      await supabase
        .from("email_aliases")
        .update({ email_count: (currentAlias.email_count || 0) + 1 })
        .eq("id", alias.id);
    }

    console.log("Email saved successfully:", savedEmail.id);

    // Send push notification
    try {
      const pushResponse = await fetch(
        `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            alias_id: alias.id,
            title: `New Email from ${senderEmail}`,
            body: subject || "(No Subject)",
            data: {
              email_id: savedEmail.id,
              from: senderEmail,
              subject: subject || "(No Subject)",
            },
          }),
        }
      );
      
      if (pushResponse.ok) {
        console.log("Push notification sent successfully");
      } else {
        console.error("Push notification failed:", await pushResponse.text());
      }
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Email received and stored",
        email_id: savedEmail.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal server error";
    console.error("Error processing email webhook:", err);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
