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
    
    try {
      // Read the raw email
      const rawEmail = await new Response(message.raw).text();
      
      // Parse email content
      const emailData = await parseEmail(rawEmail, message);
      
      console.log(`Processing email from ${message.from} to ${message.to}`);
      
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
        // Still accept the email to prevent bounces
      } else {
        const result = await response.json();
        console.log(`Email processed successfully: ${result.email_id}`);
      }
      
    } catch (error) {
      console.error("Error processing email:", error);
      // Accept email anyway to prevent bounces
    }
  },
};

/**
 * Parse raw email into structured data
 */
async function parseEmail(rawEmail, message) {
  // Extract headers and body
  const headerEndIndex = rawEmail.indexOf("\r\n\r\n");
  const headerSection = headerEndIndex > 0 ? rawEmail.substring(0, headerEndIndex) : "";
  const bodySection = headerEndIndex > 0 ? rawEmail.substring(headerEndIndex + 4) : rawEmail;
  
  // Parse headers
  const headers = {};
  const headerLines = headerSection.split("\r\n");
  let currentHeader = "";
  
  for (const line of headerLines) {
    if (line.startsWith(" ") || line.startsWith("\t")) {
      // Continuation of previous header
      currentHeader += " " + line.trim();
    } else {
      if (currentHeader) {
        const colonIndex = currentHeader.indexOf(":");
        if (colonIndex > 0) {
          const key = currentHeader.substring(0, colonIndex).toLowerCase();
          const value = currentHeader.substring(colonIndex + 1).trim();
          headers[key] = value;
        }
      }
      currentHeader = line;
    }
  }
  
  // Parse last header
  if (currentHeader) {
    const colonIndex = currentHeader.indexOf(":");
    if (colonIndex > 0) {
      const key = currentHeader.substring(0, colonIndex).toLowerCase();
      const value = currentHeader.substring(colonIndex + 1).trim();
      headers[key] = value;
    }
  }
  
  // Extract subject (decode if needed)
  let subject = headers["subject"] || "(No Subject)";
  subject = decodeHeaderValue(subject);
  
  // Determine content type and extract body
  const contentType = headers["content-type"] || "text/plain";
  let textBody = "";
  let htmlBody = "";
  
  if (contentType.includes("multipart/")) {
    // Parse multipart email
    const boundary = extractBoundary(contentType);
    if (boundary) {
      const parts = parseMultipart(bodySection, boundary);
      for (const part of parts) {
        if (part.contentType.includes("text/plain")) {
          textBody = part.body;
        } else if (part.contentType.includes("text/html")) {
          htmlBody = part.body;
        }
      }
    }
  } else if (contentType.includes("text/html")) {
    htmlBody = bodySection;
  } else {
    textBody = bodySection;
  }
  
  // Clean up bodies
  textBody = decodeBody(textBody, headers["content-transfer-encoding"]);
  htmlBody = decodeBody(htmlBody, headers["content-transfer-encoding"]);
  
  return {
    from: message.from,
    to: message.to,
    subject: subject,
    text: textBody,
    html: htmlBody,
    headers: headers,
  };
}

/**
 * Decode header values (handles =?UTF-8?B?...?= encoding)
 */
function decodeHeaderValue(value) {
  const encodedPattern = /=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi;
  
  return value.replace(encodedPattern, (match, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === "B") {
        // Base64
        return atob(text);
      } else if (encoding.toUpperCase() === "Q") {
        // Quoted-printable
        return text.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (m, hex) => {
          return String.fromCharCode(parseInt(hex, 16));
        });
      }
    } catch (e) {
      return text;
    }
    return text;
  });
}

/**
 * Extract boundary from content-type header
 */
function extractBoundary(contentType) {
  const match = contentType.match(/boundary=["']?([^"';\s]+)["']?/i);
  return match ? match[1] : null;
}

/**
 * Parse multipart email body
 */
function parseMultipart(body, boundary) {
  const parts = [];
  const delimiter = "--" + boundary;
  const sections = body.split(delimiter);
  
  for (const section of sections) {
    if (section.trim() === "" || section.trim() === "--") continue;
    
    const partHeaderEnd = section.indexOf("\r\n\r\n");
    if (partHeaderEnd < 0) continue;
    
    const partHeaders = section.substring(0, partHeaderEnd);
    const partBody = section.substring(partHeaderEnd + 4).replace(/\r\n--$/, "");
    
    const contentTypeMatch = partHeaders.match(/content-type:\s*([^;\r\n]+)/i);
    const contentType = contentTypeMatch ? contentTypeMatch[1].trim() : "text/plain";
    
    const transferEncodingMatch = partHeaders.match(/content-transfer-encoding:\s*([^\r\n]+)/i);
    const transferEncoding = transferEncodingMatch ? transferEncodingMatch[1].trim() : null;
    
    parts.push({
      contentType,
      body: decodeBody(partBody, transferEncoding),
    });
  }
  
  return parts;
}

/**
 * Decode body based on content-transfer-encoding
 */
function decodeBody(body, encoding) {
  if (!encoding) return body.trim();
  
  encoding = encoding.toLowerCase();
  
  if (encoding === "base64") {
    try {
      return atob(body.replace(/\s/g, ""));
    } catch (e) {
      return body;
    }
  } else if (encoding === "quoted-printable") {
    return body
      .replace(/=\r\n/g, "")
      .replace(/=([0-9A-F]{2})/gi, (m, hex) => {
        return String.fromCharCode(parseInt(hex, 16));
      });
  }
  
  return body.trim();
}
