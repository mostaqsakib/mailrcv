import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Copy, KeyRound, Lock, Crown, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const BASE = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/api`;

const endpoints = [
  { m: "GET", p: "/domains", d: "List available domains" },
  { m: "POST", p: "/inboxes", d: 'Create inbox. Body (optional): {"username":"john","domain":"mailrcv.site"}' },
  { m: "GET", p: "/inboxes", d: "List your inboxes" },
  { m: "GET", p: "/inboxes/{address}/messages?limit=50", d: "List emails in an inbox" },
  { m: "GET", p: "/messages/{id}", d: "Read full email (text + HTML)" },
  { m: "DELETE", p: "/messages/{id}", d: "Delete an email" },
  { m: "DELETE", p: "/inboxes/{address}", d: "Delete an inbox and its emails" },
];

const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied!"); };

const ApiDocsPage = () => {
  const { user, plan } = useAuth();
  const [prefix, setPrefix] = useState<string | null>(null);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("api_keys").select("key_prefix").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => setPrefix(data?.key_prefix ?? null));
  }, [user]);

  const generate = async () => {
    setLoading(true);
    const { data: s } = await supabase.auth.getSession();
    const res = await fetch(`${BASE}/keys`, {
      method: "POST",
      headers: { Authorization: `Bearer ${s.session?.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    });
    const body = await res.json();
    setLoading(false);
    if (!res.ok) return toast.error(body.error || "Failed");
    setNewKey(body.api_key);
    setPrefix(body.api_key.slice(0, 10));
    toast.success("New API key created");
  };

  const curl = `curl -X POST ${BASE}/inboxes \\\n  -H "x-api-key: YOUR_API_KEY" \\\n  -H "Content-Type: application/json" \\\n  -d '{"username":"john"}'`;

  return (
    <div className="min-h-screen pt-safe bg-background">
      <Header />
      <main className="container px-4 py-24 sm:py-32 max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Developer <span className="gradient-text">API</span>
          </h1>
          <p className="text-muted-foreground">Create inboxes and read emails programmatically.</p>
        </div>

        <section className="p-5 rounded-2xl bg-card border border-border/50 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2"><KeyRound className="w-4 h-4" /> Your API key</h2>
          {!user ? (
            <Button asChild><Link to="/auth">Sign in to get a key</Link></Button>
          ) : plan !== "paid" ? (
            <div className="flex items-center gap-3 flex-wrap">
              <Lock className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">API access is available for Pro users.</span>
              <Button asChild size="sm" className="gap-2"><Link to="/pricing"><Crown className="w-4 h-4" /> Upgrade</Link></Button>
            </div>
          ) : (
            <div className="space-y-3">
              {newKey ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-sm break-all">{newKey}</code>
                    <Button variant="outline" size="icon" onClick={() => copy(newKey)}><Copy className="w-4 h-4" /></Button>
                  </div>
                  <p className="text-xs text-destructive">Save this key now — it won't be shown again.</p>
                </div>
              ) : prefix ? (
                <p className="text-sm text-muted-foreground">Active key: <code className="font-mono">{prefix}…</code></p>
              ) : (
                <p className="text-sm text-muted-foreground">No key yet.</p>
              )}
              <Button onClick={generate} disabled={loading} className="gap-2">
                <RefreshCw className="w-4 h-4" /> {prefix ? "Regenerate key" : "Generate key"}
              </Button>
              {prefix && <p className="text-xs text-muted-foreground">Regenerating disables your old key.</p>}
            </div>
          )}
        </section>

        <section className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
          <h2 className="font-semibold text-foreground">Base URL</h2>
          <div className="flex gap-2">
            <code className="flex-1 p-3 rounded-lg bg-muted font-mono text-xs break-all">{BASE}</code>
            <Button variant="outline" size="icon" onClick={() => copy(BASE)}><Copy className="w-4 h-4" /></Button>
          </div>
          <p className="text-sm text-muted-foreground">Send your key in the <code className="font-mono">x-api-key</code> header on every request.</p>
        </section>

        <section className="rounded-2xl bg-card border border-border/50 overflow-hidden">
          <h2 className="font-semibold text-foreground p-5 pb-3">Endpoints</h2>
          <div className="divide-y divide-border/30">
            {endpoints.map((e) => (
              <div key={e.m + e.p} className="px-5 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
                <span className={`font-mono text-xs font-bold w-16 ${e.m === "DELETE" ? "text-destructive" : "text-primary"}`}>{e.m}</span>
                <code className="font-mono text-sm text-foreground sm:w-80 break-all">{e.p}</code>
                <span className="text-sm text-muted-foreground flex-1">{e.d}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="p-5 rounded-2xl bg-card border border-border/50 space-y-3">
          <h2 className="font-semibold text-foreground">Example</h2>
          <pre className="p-4 rounded-lg bg-muted font-mono text-xs overflow-x-auto">{curl}</pre>
          <p className="text-sm text-muted-foreground">Address format: <code className="font-mono">john@mailrcv.site</code></p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ApiDocsPage;
