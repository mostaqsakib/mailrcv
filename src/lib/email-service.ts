import { supabase } from "@/integrations/supabase/client";

export interface Domain {
  id: string;
  domain_name: string;
  is_verified: boolean;
  verification_code: string;
  forward_to_email: string | null;
  created_at: string;
}

export interface EmailAlias {
  id: string;
  domain_id: string | null;
  username: string;
  forward_to_email: string | null;
  is_active: boolean;
  email_count: number;
  created_at: string;
}

export interface ReceivedEmail {
  id: string;
  alias_id: string | null;
  from_email: string;
  subject: string | null;
  body_text: string | null;
  body_html: string | null;
  received_at: string;
  is_read: boolean;
  is_forwarded: boolean;
}

// Default domain for the app
const DEFAULT_DOMAIN = "mailrcv.site";

export async function getOrCreateDefaultDomain(): Promise<Domain | null> {
  // Check if default domain exists
  const { data: existing } = await supabase
    .from("domains")
    .select("*")
    .eq("domain_name", DEFAULT_DOMAIN)
    .maybeSingle();

  if (existing) return existing as Domain;

  // Create default domain
  const { data: created, error } = await supabase
    .from("domains")
    .insert({ domain_name: DEFAULT_DOMAIN, is_verified: true })
    .select()
    .single();

  if (error) {
    console.error("Error creating default domain:", error);
    return null;
  }

  return created as Domain;
}

export async function getAllDomains(): Promise<Domain[]> {
  const { data, error } = await supabase
    .from("domains")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching domains:", error);
    return [];
  }

  return data as Domain[];
}

export async function addDomain(domainName: string): Promise<Domain | null> {
  const { data, error } = await supabase
    .from("domains")
    .insert({ domain_name: domainName.toLowerCase() })
    .select()
    .single();

  if (error) {
    console.error("Error adding domain:", error);
    throw error;
  }

  return data as Domain;
}

export async function getOrCreateAlias(username: string, domainId: string): Promise<EmailAlias | null> {
  // Check if alias exists
  const { data: existing } = await supabase
    .from("email_aliases")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("domain_id", domainId)
    .maybeSingle();

  if (existing) return existing as EmailAlias;

  // Create new alias
  const { data: created, error } = await supabase
    .from("email_aliases")
    .insert({ 
      username: username.toLowerCase(), 
      domain_id: domainId 
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating alias:", error);
    return null;
  }

  return created as EmailAlias;
}

export async function getAliasByUsername(username: string, domainName: string): Promise<EmailAlias | null> {
  const { data: domain } = await supabase
    .from("domains")
    .select("id")
    .eq("domain_name", domainName)
    .maybeSingle();

  if (!domain) return null;

  const { data: alias } = await supabase
    .from("email_aliases")
    .select("*")
    .eq("username", username.toLowerCase())
    .eq("domain_id", domain.id)
    .maybeSingle();

  return alias as EmailAlias | null;
}

export async function getEmailsForAlias(aliasId: string): Promise<ReceivedEmail[]> {
  const { data, error } = await supabase
    .from("received_emails")
    .select("*")
    .eq("alias_id", aliasId)
    .order("received_at", { ascending: false });

  if (error) {
    console.error("Error fetching emails:", error);
    return [];
  }

  return data as ReceivedEmail[];
}

export async function markEmailAsRead(emailId: string): Promise<void> {
  await supabase
    .from("received_emails")
    .update({ is_read: true })
    .eq("id", emailId);
}

export async function deleteEmail(emailId: string): Promise<void> {
  await supabase
    .from("received_emails")
    .delete()
    .eq("id", emailId);
}

export async function updateAliasForwarding(aliasId: string, forwardTo: string): Promise<void> {
  await supabase
    .from("email_aliases")
    .update({ forward_to_email: forwardTo })
    .eq("id", aliasId);
}

export async function updateDomainForwarding(domainId: string, forwardTo: string): Promise<void> {
  await supabase
    .from("domains")
    .update({ forward_to_email: forwardTo })
    .eq("id", domainId);
}
