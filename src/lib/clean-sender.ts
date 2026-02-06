/**
 * Clean bounce/return-path addresses to extract the real sender.
 * e.g. "bounces+570829-e094-isabella.z=mailrcv.site@em5716.symbolab.com"
 *   → "isabella.z@mailrcv.site"
 */
export function cleanSenderEmail(rawFrom: string): string {
  if (!rawFrom) return rawFrom;

  // Extract email from angle brackets if present
  const emailMatch = rawFrom.match(/<?([^<>\s]+@[^<>\s]+)>?/);
  const email = emailMatch ? emailMatch[1] : rawFrom;

  if (!email.includes("@")) return email;

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
