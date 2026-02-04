import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendGridWebhook {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  envelope?: string; // JSON string containing to/from arrays
  charsets?: string;
  SPF?: string;
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

    // Parse the incoming email data from SendGrid Inbound Parse
    const contentType = req.headers.get("content-type") || "";
    let emailData: SendGridWebhook;

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      emailData = {
        from: formData.get("from") as string || "",
        to: formData.get("to") as string || "",
        subject: formData.get("subject") as string || "",
        text: formData.get("text") as string || "",
        html: formData.get("html") as string || "",
        envelope: formData.get("envelope") as string || "",
      };
    } else if (contentType.includes("application/json")) {
      emailData = await req.json();
    } else {
      // Try form data as fallback (SendGrid typically uses multipart)
      try {
        const formData = await req.formData();
        emailData = {
          from: formData.get("from") as string || "",
          to: formData.get("to") as string || "",
          subject: formData.get("subject") as string || "",
          text: formData.get("text") as string || "",
          html: formData.get("html") as string || "",
          envelope: formData.get("envelope") as string || "",
        };
      } catch {
        emailData = await req.json();
      }
    }

    console.log("Received SendGrid webhook:", JSON.stringify(emailData, null, 2));

    // Extract recipient address - SendGrid uses 'to' field or envelope
    let toAddress = emailData.to || "";
    
    // If envelope exists, parse it for more accurate recipient info
    if (emailData.envelope) {
      try {
        const envelope = JSON.parse(emailData.envelope);
        if (envelope.to && envelope.to.length > 0) {
          toAddress = envelope.to[0];
        }
      } catch (e) {
        console.log("Failed to parse envelope, using 'to' field:", e);
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
      // Create the domain if it doesn't exist
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

    // Extract sender email - SendGrid format: "Name <email@example.com>" or just "email@example.com"
    const fromEmail = emailData.from || "unknown@unknown.com";
    const fromMatch = fromEmail.match(/<?([^<>\s]+@[^<>\s]+)>?/);
    const senderEmail = fromMatch ? fromMatch[1] : fromEmail;

    // Store the email - SendGrid uses text and html fields
    const { data: savedEmail, error: saveError } = await supabase
      .from("received_emails")
      .insert({
        alias_id: alias.id,
        from_email: senderEmail,
        subject: emailData.subject || "(No Subject)",
        body_text: emailData.text || null,
        body_html: emailData.html || null,
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

    // Send push notification to registered devices
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
            body: emailData.subject || "(No Subject)",
            data: {
              email_id: savedEmail.id,
              from: senderEmail,
              subject: emailData.subject || "(No Subject)",
            },
          }),
        }
      );
      
      if (pushResponse.ok) {
        const pushResult = await pushResponse.json();
        console.log("Push notification result:", pushResult);
      } else {
        console.error("Push notification failed:", await pushResponse.text());
      }
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
      // Don't fail the whole request if push fails
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