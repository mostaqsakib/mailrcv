import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-api-key, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
};
const PROTECT_BEFORE = "2026-03-04T00:00:00Z"; // never delete emails received before this
const DEFAULT_DOMAIN = "mailrcv.site";

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...cors, "Content-Type": "application/json" } });
const err = (message: string, status: number) => json({ error: message }, status);

const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function randomStr(n: number, chars = "abcdefghijkmnpqrstuvwxyz23456789") {
  const a = crypto.getRandomValues(new Uint8Array(n));
  return Array.from(a, (x) => chars[x % chars.length]).join("");
}
const shareToken = () => randomStr(8, "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789");

async function isPaid(userId: string) {
  const { data } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", userId).maybeSingle();
  if (!data || data.plan !== "paid") return false;
  return !data.plan_expires_at || new Date(data.plan_expires_at) > new Date();
}

async function findAlias(userId: string, address: string) {
  const [username, domain] = address.toLowerCase().split("@");
  if (!username || !domain) return null;
  const { data: d } = await admin.from("domains").select("id").eq("domain_name", domain).maybeSingle();
  if (!d) return null;
  const { data: a } = await admin.from("email_aliases").select("*")
    .eq("username", username).eq("domain_id", d.id).eq("user_id", userId).maybeSingle();
  return a ? { ...a, address: `${username}@${domain}` } : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const url = new URL(req.url);
    const idx = url.pathname.indexOf("/api");
    const parts = url.pathname.slice(idx + 4).split("/").filter(Boolean).map(decodeURIComponent);
    const m = req.method;

    // ---- Key management (logged-in user via JWT) ----
    if (parts[0] === "keys") {
      const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!auth) return err("Unauthorized", 401);
      const { data: u } = await admin.auth.getUser(auth);
      if (!u?.user) return err("Unauthorized", 401);
      if (m === "POST") {
        if (!(await isPaid(u.user.id))) return err("API access requires Pro plan", 403);
        const raw = `mrcv_${randomStr(40)}`;
        await admin.from("api_keys").delete().eq("user_id", u.user.id);
        const { error } = await admin.from("api_keys").insert({
          user_id: u.user.id, key_hash: await sha256(raw), key_prefix: raw.slice(0, 10),
        });
        if (error) return err(error.message, 500);
        return json({ api_key: raw });
      }
      if (m === "DELETE") {
        await admin.from("api_keys").delete().eq("user_id", u.user.id);
        return json({ success: true });
      }
      return err("Method not allowed", 405);
    }

    // ---- API key auth ----
    const key = req.headers.get("x-api-key") ||
      (req.headers.get("Authorization")?.startsWith("Bearer mrcv_") ? req.headers.get("Authorization")!.slice(7) : null);
    if (!key) return err("Missing API key (x-api-key header)", 401);
    const { data: k } = await admin.from("api_keys").select("id, user_id").eq("key_hash", await sha256(key)).maybeSingle();
    if (!k) return err("Invalid API key", 401);
    if (!(await isPaid(k.user_id))) return err("API access requires an active Pro plan", 403);
    admin.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", k.id).then(() => {});
    const userId = k.user_id;

    // GET /domains
    if (parts[0] === "domains" && m === "GET") {
      const { data } = await admin.from("domains").select("domain_name").eq("is_verified", true);
      return json({ domains: (data || []).map((d) => d.domain_name) });
    }

    if (parts[0] === "inboxes") {
      // POST /inboxes
      if (parts.length === 1 && m === "POST") {
        const body = await req.json().catch(() => ({}));
        const domain = String(body.domain || DEFAULT_DOMAIN).toLowerCase().trim();
        let username = body.username ? String(body.username).toLowerCase().trim() : randomStr(10);
        if (!/^[a-z0-9._-]{1,64}$/.test(username)) return err("Invalid username", 400);
        const { data: d } = await admin.from("domains").select("id").eq("domain_name", domain).eq("is_verified", true).maybeSingle();
        if (!d) return err("Unknown domain", 400);
        const { data: existing } = await admin.from("email_aliases").select("id, user_id")
          .eq("username", username).eq("domain_id", d.id).maybeSingle();
        if (existing) {
          if (existing.user_id && existing.user_id !== userId) return err("Address already taken", 409);
          if (!existing.user_id) {
            await admin.from("email_aliases").update({ user_id: userId, share_token: shareToken() }).eq("id", existing.id);
          }
        } else {
          const { error } = await admin.from("email_aliases").insert({
            username, domain_id: d.id, user_id: userId, share_token: shareToken(),
          });
          if (error) return err(error.message, 500);
        }
        const address = `${username}@${domain}`;
        return json({ address, inbox_url: `https://mailrcv.site/inbox/${address}` }, 201);
      }
      // GET /inboxes
      if (parts.length === 1 && m === "GET") {
        const { data } = await admin.from("email_aliases")
          .select("username, email_count, created_at, domains(domain_name)")
          .eq("user_id", userId).order("created_at", { ascending: false }).limit(1000);
        return json({
          inboxes: (data || []).map((a: any) => ({
            address: `${a.username}@${a.domains?.domain_name}`, email_count: a.email_count, created_at: a.created_at,
          })),
        });
      }
      const alias = await findAlias(userId, parts[1]);
      if (!alias) return err("Inbox not found", 404);
      // GET /inboxes/:address/messages
      if (parts[2] === "messages" && m === "GET") {
        const limit = Math.min(parseInt(url.searchParams.get("limit") || "50") || 50, 100);
        const { data } = await admin.from("received_emails")
          .select("id, from_email, subject, received_at, is_read")
          .eq("alias_id", alias.id).order("received_at", { ascending: false }).limit(limit);
        return json({ address: alias.address, messages: data || [] });
      }
      // DELETE /inboxes/:address
      if (parts.length === 2 && m === "DELETE") {
        const { count } = await admin.from("received_emails").select("id", { count: "exact", head: true })
          .eq("alias_id", alias.id).lt("received_at", PROTECT_BEFORE);
        await admin.from("received_emails").delete().eq("alias_id", alias.id).gte("received_at", PROTECT_BEFORE);
        if (count && count > 0) return json({ success: true, note: "Recent emails deleted; archived emails kept, inbox retained" });
        await admin.from("push_tokens").delete().eq("alias_id", alias.id);
        await admin.from("email_aliases").delete().eq("id", alias.id);
        return json({ success: true });
      }
    }

    if (parts[0] === "messages" && parts[1]) {
      const { data: msg } = await admin.from("received_emails")
        .select("id, alias_id, from_email, subject, body_text, body_html, received_at, is_read, email_aliases!inner(user_id)")
        .eq("id", parts[1]).maybeSingle();
      if (!msg || (msg as any).email_aliases?.user_id !== userId) return err("Message not found", 404);
      if (m === "GET") {
        if (!msg.is_read) await admin.from("received_emails").update({ is_read: true }).eq("id", msg.id);
        const { email_aliases: _, alias_id: __, ...rest } = msg as any;
        return json({ message: { ...rest, is_read: true } });
      }
      if (m === "DELETE") {
        if (msg.received_at < PROTECT_BEFORE) return err("This email is archived and cannot be deleted", 403);
        await admin.from("received_emails").delete().eq("id", msg.id);
        return json({ success: true });
      }
    }

    return err("Not found", 404);
  } catch (e) {
    return err(e instanceof Error ? e.message : "Server error", 500);
  }
});
