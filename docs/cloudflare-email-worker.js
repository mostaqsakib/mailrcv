/**
 * Cloudflare Email Worker for mailrcv.site
 * 
 * Uses postal-mime library for robust email parsing that handles ALL email formats:
 * - Simple text/html emails
 * - Multipart emails (text + html + attachments)
 * - Forwarded emails (message/rfc822)
 * - Nested multipart structures
 * - All encodings (base64, quoted-printable, 7bit, 8bit)
 * - International charsets (UTF-8, ISO-8859-1, etc.)
 * - Inline images and attachments
 * 
 * SETUP INSTRUCTIONS:
 * 
 * 1. Go to Cloudflare Dashboard > Your Domain > Email > Email Routing
 * 2. Enable Email Routing for your domain
 * 3. Go to Workers & Pages > Create Worker
 * 4. Paste this code and deploy
 * 5. Go back to Email Routing > Routing Rules
 * 6. Create a catch-all rule: *@yourdomain.com → Send to Worker → Select your worker
 * 
 * Required: Add your Supabase Edge Function URL as an environment variable
 * WEBHOOK_URL = https://euiqflvrdraydkhwksmh.supabase.co/functions/v1/receive-email
 */

import PostalMime from 'postal-mime';

export default {
  async email(message, env, ctx) {
    const WEBHOOK_URL = env.WEBHOOK_URL || "https://euiqflvrdraydkhwksmh.supabase.co/functions/v1/receive-email";
    
    ctx.waitUntil((async () => {
      try {
        // Read the raw email as ArrayBuffer for postal-mime
        const rawEmail = await new Response(message.raw).arrayBuffer();
        
        // Parse email using postal-mime - handles ALL formats automatically
        const parser = new PostalMime();
        const email = await parser.parse(rawEmail);
        
        console.log(`Processing email from ${message.from} to ${message.to}`);
        console.log(`Subject: ${email.subject}`);
        console.log(`Text length: ${email.text?.length || 0}, HTML length: ${email.html?.length || 0}`);
        console.log(`Attachments: ${email.attachments?.length || 0}`);
        
        // Process attachments - convert to base64
        const attachments = [];
        if (email.attachments && email.attachments.length > 0) {
          for (const att of email.attachments) {
            try {
              // postal-mime provides content as Uint8Array
              const base64Data = uint8ArrayToBase64(att.content);
              
              attachments.push({
                content_id: att.contentId || `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`,
                filename: att.filename || null,
                content_type: att.mimeType || "application/octet-stream",
                data: base64Data,
              });
              
              console.log(`Attachment: ${att.filename || att.contentId}, type=${att.mimeType}, size=${base64Data.length}`);
            } catch (attErr) {
              console.error("Error processing attachment:", attErr);
            }
          }
        }
        
        // Build email data payload
        const emailData = {
          from: message.from,
          to: message.to,
          subject: email.subject || "(No Subject)",
          text: email.text || "",
          html: email.html || "",
          attachments: attachments,
        };
        
        console.log(`Sending to webhook: text=${emailData.text.length} chars, html=${emailData.html.length} chars, attachments=${attachments.length}`);
        
        // Forward to Supabase Edge Function
        const response = await fetch(WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Source": "cloudflare",
            "CF-Worker": "email-receiver",
          },
          body: JSON.stringify(emailData),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Webhook failed: ${response.status} - ${errorText}`);
        } else {
          const result = await response.json();
          console.log(`Email processed successfully: ${result.email_id}, attachments: ${result.attachments_processed || 0}`);
        }
        
      } catch (error) {
        console.error("Error processing email:", error);
      }
    })());
  },
};

/**
 * Convert Uint8Array to base64 string
 */
function uint8ArrayToBase64(uint8Array) {
  let binary = '';
  const len = uint8Array.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(uint8Array[i]);
  }
  return btoa(binary);
}
