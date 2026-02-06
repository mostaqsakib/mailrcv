import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import PostalMime from "npm:postal-mime@2.4.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InlineAttachment {
  content_id: string;
  filename?: string;
  content_type: string;
  data: string; // base64 encoded
}

interface CloudflareEmailPayload {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  headers?: Record<string, string>;
  raw?: string; // full raw RFC822 email as text
  raw_base64?: string; // full raw RFC822 email as base64
  attachments?: InlineAttachment[];
}

interface SendGridWebhook {
  from: string;
  to: string;
  subject?: string;
  text?: string;
  html?: string;
  envelope?: string;
}

// Convert base64 to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Clean bounce/return-path addresses to extract the real sender
function cleanSenderEmail(rawFrom: string): string {
  const emailMatch = rawFrom.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = emailMatch ? emailMatch[1] : rawFrom;
  
  if (!email || !email.includes("@")) return email;

  // bounces+NNNNN-XXXX-localpart=originaldomain@bouncedomain
  const bounceMatch = email.match(/^bounces\+[^-]+-[^-]+-([^=]+)=([^@]+)@/i);
  if (bounceMatch) return `${bounceMatch[1]}@${bounceMatch[2]}`;

  // BATV: prvs=XXXXX=user@domain
  const batvMatch = email.match(/^prvs=[^=]+=(.+@.+)$/i);
  if (batvMatch) return batvMatch[1];

  // SRS: SRS0=XXX=XX=domain=user@bouncedomain
  const srsMatch = email.match(/^SRS[01]=[^=]+=[^=]+=([^=]+)=([^@]+)@/i);
  if (srsMatch) return `${srsMatch[2]}@${srsMatch[1]}`;

  return email;
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
    let inlineAttachments: InlineAttachment[] = [];

    // Detect source based on headers or content
    const isCloudflare = req.headers.get("cf-worker") || req.headers.get("x-source") === "cloudflare";
    
    if (contentType.includes("application/json")) {
      const jsonData = await req.json();
      console.log("Received JSON webhook:", JSON.stringify(jsonData, null, 2).slice(0, 2000));
      
      // Cloudflare Email Workers format
      if (isCloudflare || jsonData.raw || jsonData.headers) {
        const cfData = jsonData as CloudflareEmailPayload;
        fromEmail = cfData.from || "";
        toAddress = cfData.to || "";
        subject = cfData.subject || "";
        bodyText = cfData.text || "";
        bodyHtml = cfData.html || "";
        inlineAttachments = cfData.attachments || [];

        // If worker couldn't parse (text/html empty OR subject is placeholder), fall back to parsing raw RFC822 here.
        const needsFallbackParse = (!bodyText && !bodyHtml) || !subject || subject === "(unknown)";
        if (needsFallbackParse && (cfData.raw || cfData.raw_base64)) {
          try {
            const rawBytes = cfData.raw_base64
              ? base64ToUint8Array(cfData.raw_base64)
              : new TextEncoder().encode(cfData.raw ?? "");

            const parser = new PostalMime();
            const parsed = await parser.parse(rawBytes);

            // Override with parsed values
            if (parsed.text) bodyText = parsed.text;
            if (parsed.html) bodyHtml = parsed.html;
            if (parsed.subject && (!subject || subject === "(unknown)")) {
              subject = parsed.subject;
            }

            console.log(
              `Parsed raw RFC822 fallback: subject=${parsed.subject || ""}, text=${parsed.text?.length || 0}, html=${parsed.html?.length || 0}`
            );
          } catch (e) {
            console.error("Raw RFC822 fallback parse failed:", e);
          }
        }

        console.log(`Processing Cloudflare Email Workers payload with ${inlineAttachments.length} attachments`);
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

    // Extract clean sender email (strips bounce/return-path encoding)
    const senderEmail = cleanSenderEmail(fromEmail) || "unknown@unknown.com";

    // Store the email first (we need the email_id for attachments)
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

    console.log("Email saved successfully:", savedEmail.id);

    // Process inline attachments
    const cidToUrl: Record<string, string> = {};
    
    if (inlineAttachments.length > 0) {
      console.log(`Processing ${inlineAttachments.length} inline attachments...`);
      
      for (const attachment of inlineAttachments) {
        try {
          // Clean content_id (remove angle brackets if present)
          const cleanCid = attachment.content_id.replace(/^<|>$/g, "");
          
          // Generate unique filename
          const ext = attachment.content_type.split("/")[1] || "bin";
          const filename = attachment.filename || `${cleanCid}.${ext}`;
          const storagePath = `${savedEmail.id}/${filename}`;
          
          // Convert base64 to binary
          const fileData = base64ToUint8Array(attachment.data);
          
          // Upload to storage
          const { error: uploadError } = await supabase.storage
            .from("email-attachments")
            .upload(storagePath, fileData, {
              contentType: attachment.content_type,
              upsert: true,
            });
          
          if (uploadError) {
            console.error(`Failed to upload attachment ${cleanCid}:`, uploadError);
            continue;
          }
          
          // Get public URL
          const { data: urlData } = supabase.storage
            .from("email-attachments")
            .getPublicUrl(storagePath);
          
          const publicUrl = urlData.publicUrl;
          console.log(`Uploaded attachment: ${cleanCid} -> ${publicUrl}`);
          
          // Store mapping
          cidToUrl[cleanCid] = publicUrl;
          
          // Save attachment record
          await supabase.from("email_attachments").insert({
            email_id: savedEmail.id,
            content_id: cleanCid,
            filename: filename,
            content_type: attachment.content_type,
            storage_path: storagePath,
            storage_url: publicUrl,
          });
          
        } catch (attachErr) {
          console.error("Error processing attachment:", attachErr);
        }
      }
      
      // Rewrite cid: URLs in HTML body
      if (bodyHtml && Object.keys(cidToUrl).length > 0) {
        let rewrittenHtml = bodyHtml;
        
        for (const [cid, url] of Object.entries(cidToUrl)) {
          // Replace cid:xxx with actual URL
          const cidPatterns = [
            new RegExp(`cid:${cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi"),
            new RegExp(`cid:${cid.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/@/g, "%40")}`, "gi"),
          ];
          
          for (const pattern of cidPatterns) {
            rewrittenHtml = rewrittenHtml.replace(pattern, url);
          }
        }
        
        // Update the email with rewritten HTML
        if (rewrittenHtml !== bodyHtml) {
          console.log("Updating email with rewritten HTML (cid: replaced with URLs)");
          await supabase
            .from("received_emails")
            .update({ body_html: rewrittenHtml })
            .eq("id", savedEmail.id);
        }
      }
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
        email_id: savedEmail.id,
        attachments_processed: Object.keys(cidToUrl).length,
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
