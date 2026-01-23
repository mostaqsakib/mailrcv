import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface MailgunWebhook {
  sender: string;
  from: string;
  recipient: string;
  To?: string;
  subject?: string;
  "body-plain"?: string;
  "body-html"?: string;
  "stripped-text"?: string;
  "stripped-html"?: string;
  timestamp?: string;
  token?: string;
  signature?: string;
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

    // Parse the incoming email data from Mailgun
    const contentType = req.headers.get("content-type") || "";
    let emailData: MailgunWebhook;

    if (contentType.includes("application/json")) {
      emailData = await req.json();
    } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      emailData = {
        sender: formData.get("sender") as string || "",
        from: formData.get("from") as string || "",
        recipient: formData.get("recipient") as string || "",
        To: formData.get("To") as string || "",
        subject: formData.get("subject") as string || "",
        "body-plain": formData.get("body-plain") as string || "",
        "body-html": formData.get("body-html") as string || "",
        "stripped-text": formData.get("stripped-text") as string || "",
        "stripped-html": formData.get("stripped-html") as string || "",
      };
    } else {
      // Try JSON as fallback
      emailData = await req.json();
    }

    console.log("Received Mailgun webhook:", JSON.stringify(emailData, null, 2));

    // Extract recipient address - Mailgun uses 'recipient' field
    const toAddress = emailData.recipient || emailData.To || "";
    
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

    // Extract sender email
    const fromEmail = emailData.from || "unknown@unknown.com";
    const fromMatch = fromEmail.match(/<?([^<>\s]+@[^<>\s]+)>?/);
    const senderEmail = fromMatch ? fromMatch[1] : fromEmail;

    // Store the email - Mailgun uses body-plain and body-html
    const { data: savedEmail, error: saveError } = await supabase
      .from("received_emails")
      .insert({
        alias_id: alias.id,
        from_email: senderEmail,
        subject: emailData.subject || "(No Subject)",
        body_text: emailData["body-plain"] || emailData["stripped-text"] || null,
        body_html: emailData["body-html"] || emailData["stripped-html"] || null,
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
