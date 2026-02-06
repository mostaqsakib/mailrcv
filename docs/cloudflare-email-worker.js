/**
 * Cloudflare Email Worker for mailrcv.site
 * 
 * This worker receives emails via Cloudflare Email Routing and forwards them
 * to your Supabase Edge Function for processing.
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

export default {
  async email(message, env, ctx) {
    const WEBHOOK_URL = env.WEBHOOK_URL || "https://euiqflvrdraydkhwksmh.supabase.co/functions/v1/receive-email";
    
    ctx.waitUntil((async () => {
      try {
        // Read the raw email
        const rawEmail = await new Response(message.raw).text();
        
        // Parse email content with inline attachments
        const emailData = await parseEmail(rawEmail, message);
        
        console.log(`Processing email from ${message.from} to ${message.to} with ${emailData.attachments?.length || 0} attachments`);
        
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
 * Decode header values (handles =?UTF-8?B?...?= and =?UTF-8?Q?...?= encoding)
 */
function decodeHeader(value) {
  if (!value) return "";
  
  const encodedPattern = /=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi;
  
  return value.replace(encodedPattern, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        // Base64 decoding with proper UTF-8 support
        const binaryStr = atob(text);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        return new TextDecoder("utf-8").decode(bytes);
      } else if (encoding.toUpperCase() === "Q") {
        // Quoted-printable with UTF-8 support
        const bytes = [];
        const cleaned = text.replace(/_/g, " ");
        for (let i = 0; i < cleaned.length; i++) {
          if (cleaned[i] === "=" && i + 2 < cleaned.length) {
            const hex = cleaned.substring(i + 1, i + 3);
            if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
              bytes.push(parseInt(hex, 16));
              i += 2;
              continue;
            }
          }
          bytes.push(cleaned.charCodeAt(i));
        }
        return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
      }
    } catch (e) {
      console.error("Header decode error:", e);
      return text;
    }
    return text;
  });
}

/**
 * Decode body based on content-transfer-encoding with proper UTF-8 support
 */
function decodeBody(body, encoding) {
  if (!body) return "";
  if (!encoding) return body.trim();
  
  encoding = encoding.toLowerCase().trim();
  
  if (encoding === "base64") {
    try {
      const cleaned = body.replace(/\s/g, "");
      const binaryStr = atob(cleaned);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      return new TextDecoder("utf-8").decode(bytes);
    } catch (e) {
      console.error("Base64 decode error:", e);
      return body;
    }
  } else if (encoding === "quoted-printable") {
    // Quoted-printable with proper UTF-8 multi-byte handling
    const cleaned = body.replace(/=\r?\n/g, ""); // Remove soft line breaks
    const bytes = [];
    
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "=" && i + 2 < cleaned.length) {
        const hex = cleaned.substring(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
          bytes.push(parseInt(hex, 16));
          i += 2;
          continue;
        }
      }
      bytes.push(cleaned.charCodeAt(i));
    }
    
    try {
      return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
    } catch (e) {
      console.error("QP decode error:", e);
      return cleaned;
    }
  }
  
  return body.trim();
}

/**
 * Parse multipart body and extract text, html, and inline attachments
 */
function parseBody(headerSection, bodySection) {
  let text = "";
  let html = "";
  const attachments = [];
  
  // Get content-type and encoding from headers
  const contentTypeMatch = headerSection.match(/^content-type:\s*([^\r\n]+)/im);
  const contentType = contentTypeMatch ? contentTypeMatch[1] : "text/plain";
  const encodingMatch = headerSection.match(/^content-transfer-encoding:\s*([^\r\n]+)/im);
  const encoding = encodingMatch ? encodingMatch[1].trim() : null;
  
  if (contentType.toLowerCase().includes("multipart/")) {
    // Extract boundary
    const boundaryMatch = contentType.match(/boundary=["']?([^"';\s]+)["']?/i);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      const parts = bodySection.split("--" + boundary);
      
      for (const part of parts) {
        const trimmedPart = part.trim();
        if (!trimmedPart || trimmedPart === "--") continue;
        
        // Support both \r\n\r\n and \n\n as header/body separator
        let partHeaderEnd = trimmedPart.indexOf("\r\n\r\n");
        let separatorLength = 4;
        if (partHeaderEnd < 0) {
          partHeaderEnd = trimmedPart.indexOf("\n\n");
          separatorLength = 2;
        }
        if (partHeaderEnd < 0) continue;
        
        const partHeaders = trimmedPart.substring(0, partHeaderEnd);
        let partBody = trimmedPart.substring(partHeaderEnd + separatorLength);
        
        // Remove trailing boundary marker
        if (partBody.endsWith("--")) {
          partBody = partBody.slice(0, -2);
        }
        partBody = partBody.replace(/\r?\n$/, "");
        
        const pCtMatch = partHeaders.match(/^content-type:\s*([^\r\n]+)/im);
        const pCt = pCtMatch ? pCtMatch[1].toLowerCase() : "";
        const pEncMatch = partHeaders.match(/^content-transfer-encoding:\s*([^\r\n]+)/im);
        const pEnc = pEncMatch ? pEncMatch[1].trim() : null;
        
        // Check for Content-ID (inline attachment)
        const cidMatch = partHeaders.match(/^content-id:\s*<?([^>\r\n]+)>?/im);
        const contentDisposition = partHeaders.match(/^content-disposition:\s*([^\r\n]+)/im);
        const isInline = contentDisposition && contentDisposition[1].toLowerCase().includes("inline");
        const isAttachment = contentDisposition && contentDisposition[1].toLowerCase().includes("attachment");
        
        // Handle message/rfc822 (forwarded email) - parse recursively
        if (pCt.includes("message/rfc822")) {
          console.log("Found embedded message/rfc822 (forwarded email), parsing recursively...");
          
          // Decode the part body first if needed
          let embeddedEmail = pEnc ? decodeBody(partBody, pEnc) : partBody;
          
          // Find header/body split in embedded email
          let embeddedHeaderEnd = embeddedEmail.indexOf("\r\n\r\n");
          let embeddedSepLen = 4;
          if (embeddedHeaderEnd < 0) {
            embeddedHeaderEnd = embeddedEmail.indexOf("\n\n");
            embeddedSepLen = 2;
          }
          
          if (embeddedHeaderEnd > 0) {
            const embeddedHeaders = embeddedEmail.substring(0, embeddedHeaderEnd);
            const embeddedBody = embeddedEmail.substring(embeddedHeaderEnd + embeddedSepLen);
            
            // Recursively parse the embedded email
            const nested = parseBody(embeddedHeaders, embeddedBody);
            if (nested.text && !text) text = nested.text;
            if (nested.html && !html) html = nested.html;
            if (nested.attachments) {
              attachments.push(...nested.attachments);
            }
          }
        }
        // If it has Content-ID or is an inline image, treat as attachment
        else if (cidMatch || (isInline && pCt.startsWith("image/"))) {
          const cid = cidMatch ? cidMatch[1].trim() : `auto_${Date.now()}_${Math.random().toString(36).slice(2)}`;
          
          // Extract filename
          let filename = null;
          const filenameMatch = partHeaders.match(/filename=["']?([^"';\r\n]+)["']?/i);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
          
          // Get content type without parameters
          const typeOnly = pCt.split(";")[0].trim();
          
          // Get raw base64 data (already encoded if transfer-encoding is base64)
          let base64Data = partBody.replace(/\s/g, "");
          
          // If encoding is not base64, we need to convert
          if (pEnc && pEnc.toLowerCase() !== "base64") {
            // Convert to base64
            const decoded = decodeBody(partBody, pEnc);
            base64Data = btoa(decoded);
          }
          
          attachments.push({
            content_id: cid,
            filename: filename,
            content_type: typeOnly || "application/octet-stream",
            data: base64Data,
          });
          
          console.log(`Found inline attachment: cid=${cid}, type=${typeOnly}, size=${base64Data.length}`);
        }
        // Handle nested multipart
        else if (pCt.includes("multipart/")) {
          const nested = parseBody(partHeaders, partBody);
          if (nested.text && !text) text = nested.text;
          if (nested.html && !html) html = nested.html;
          if (nested.attachments) {
            attachments.push(...nested.attachments);
          }
        }
        // Handle text parts
        else if (pCt.includes("text/plain") && !text) {
          text = decodeBody(partBody, pEnc);
        } else if (pCt.includes("text/html") && !html) {
          html = decodeBody(partBody, pEnc);
        }
      }
    }
  } else if (contentType.toLowerCase().includes("text/html")) {
    html = decodeBody(bodySection, encoding);
  } else {
    text = decodeBody(bodySection, encoding);
  }
  
  return { text, html, attachments };
}

/**
 * Parse raw email into structured data including inline attachments
 */
async function parseEmail(rawEmail, message) {
  // Split headers and body
  const headerEndIndex = rawEmail.indexOf("\r\n\r\n");
  const headerSection = headerEndIndex > 0 ? rawEmail.substring(0, headerEndIndex) : "";
  const bodySection = headerEndIndex > 0 ? rawEmail.substring(headerEndIndex + 4) : rawEmail;
  
  // Extract and decode subject
  const subjectMatch = headerSection.match(/^subject:\s*(.+?)(?:\r?\n(?![\t ])|\r?\n\r?\n|$)/ims);
  let subject = "(No Subject)";
  if (subjectMatch) {
    // Handle folded headers (continuation lines starting with space/tab)
    let rawSubject = subjectMatch[1];
    rawSubject = rawSubject.replace(/\r?\n[\t ]+/g, " ").trim();
    subject = decodeHeader(rawSubject);
  }
  
  // Parse body content and attachments
  const { text, html, attachments } = parseBody(headerSection, bodySection);
  
  return {
    from: message.from,
    to: message.to,
    subject: subject,
    text: text,
    html: html,
    attachments: attachments,
  };
}
