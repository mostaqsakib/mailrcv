/**
 * Clean bounce/return-path addresses to extract a meaningful sender.
 * e.g. "bounces+570829-e094-isabella.z=mailrcv.site@em5716.symbolab.com"
 *   → "symbolab.com" (the sending service domain, not the encoded recipient)
 */
export function cleanSenderEmail(rawFrom: string): string {
  if (!rawFrom) return rawFrom;

  // Extract email from angle brackets if present
  const emailMatch = rawFrom.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = emailMatch ? emailMatch[1] : rawFrom;

  if (!email.includes("@")) return email;

  // Detect bounce/return-path: bounces+NNNNN-XXXX-recipient=recipientdomain@senderdomain
  // The part after @ is the SENDER's domain (e.g. em5716.symbolab.com → symbolab.com)
  const bounceMatch = email.match(/^bounces\+[^@]+@(.+)$/i);
  if (bounceMatch) {
    const bounceDomain = bounceMatch[1];
    // Strip subdomain prefix like "em5716." to get root domain
    const parts = bounceDomain.split(".");
    const rootDomain = parts.length > 2 ? parts.slice(-2).join(".") : bounceDomain;
    return rootDomain;
  }

  // BATV: prvs=XXXXX=user@domain
  const batvMatch = email.match(/^prvs=[^=]+=(.+@.+)$/i);
  if (batvMatch) return batvMatch[1];

  // SRS: SRS0=XXX=XX=domain=user@bouncedomain
  const srsMatch = email.match(/^SRS[01]=[^=]+=[^=]+=([^=]+)=([^@]+)@/i);
  if (srsMatch) return `${srsMatch[2]}@${srsMatch[1]}`;

  return email;
}
