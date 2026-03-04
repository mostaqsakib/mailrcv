import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  Mail,
  Inbox,
  Trash2,
  ExternalLink,
  Lock,
  Globe,
  Clock,
  Shield,
  RefreshCw,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface UserAlias {
  id: string;
  username: string;
  email_count: number;
  is_password_protected: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  domain_id: string | null;
  domain_name?: string;
  forward_to_email: string | null;
}

const DashboardPage = () => {
  const { user, plan, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<UserAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "protected" | "public">("all");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  const fetchAliases = async () => {
    if (!user) return;
    setLoading(true);

    const { data: aliasData, error } = await supabase
      .from("email_aliases")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Error fetching aliases:", error);
      setLoading(false);
      return;
    }

    // Fetch domain names for aliases with domain_id
    const domainIds = [...new Set((aliasData || []).filter(a => a.domain_id).map(a => a.domain_id!))];
    let domainMap: Record<string, string> = {};

    if (domainIds.length > 0) {
      const { data: domains } = await supabase
        .from("domains")
        .select("id, domain_name")
        .in("id", domainIds);

      if (domains) {
        domainMap = Object.fromEntries(domains.map(d => [d.id, d.domain_name]));
      }
    }

    const enriched = (aliasData || []).map(a => ({
      ...a,
      domain_name: a.domain_id ? domainMap[a.domain_id] || "mailrcv.site" : "mailrcv.site",
    }));

    setAliases(enriched);
    setLoading(false);
  };

  useEffect(() => {
    if (user) fetchAliases();
  }, [user]);

  const handleDelete = async (alias: UserAlias) => {
    if (!confirm(`Delete inbox ${alias.username}@${alias.domain_name}? This will remove all emails.`)) return;

    setDeleting(alias.id);
    try {
      // Delete emails first
      await supabase.from("received_emails").delete().eq("alias_id", alias.id);
      // Delete alias
      await supabase.from("email_aliases").delete().eq("id", alias.id);
      setAliases(prev => prev.filter(a => a.id !== alias.id));
      toast.success("Inbox deleted");
    } catch {
      toast.error("Failed to delete inbox");
    } finally {
      setDeleting(null);
    }
  };

  const getInboxUrl = (alias: UserAlias) => {
    const domain = alias.domain_name || "mailrcv.site";
    if (alias.is_password_protected) {
      return `/secure/${alias.username}@${domain}`;
    }
    return domain === "mailrcv.site"
      ? `/inbox/${alias.username}`
      : `/inbox/${alias.username}@${domain}`;
  };

  const limits = PLAN_LIMITS[plan];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-8 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">My Inboxes</h1>
              <p className="text-muted-foreground mt-1">
                {aliases.length} inbox{aliases.length !== 1 ? "es" : ""} • {limits.label} Plan
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAliases} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
              <Button size="sm" asChild className="gap-2 gradient-bg text-primary-foreground">
                <Link to="/"><Mail className="w-4 h-4" /> New Inbox</Link>
              </Button>
            </div>
          </div>

          {/* Plan Info Bar */}
          <div className="p-4 rounded-xl glass mb-6 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Inbox className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">
                {aliases.length} / {limits.maxInboxes === Infinity ? "∞" : limits.maxInboxes} inboxes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-foreground/80">Retention: {limits.retentionLabel}</span>
            </div>
            {plan !== "paid" && (
              <Button variant="link" size="sm" asChild className="ml-auto text-primary p-0 h-auto">
                <Link to="/pricing">Upgrade →</Link>
              </Button>
            )}
          </div>

          {/* Search & Filter */}
          {aliases.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inboxes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "protected", "public"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className="capitalize"
                  >
                    {f === "all" ? "All" : f === "protected" ? "🔒 Protected" : "🌐 Public"}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Inbox List */}
          {(() => {
            const filtered = aliases.filter((a) => {
              const matchesSearch = search === "" || 
                `${a.username}@${a.domain_name}`.toLowerCase().includes(search.toLowerCase());
              const matchesFilter = filter === "all" || 
                (filter === "protected" && a.is_password_protected) ||
                (filter === "public" && !a.is_password_protected);
              return matchesSearch && matchesFilter;
            });

            if (loading) return (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            );

            if (aliases.length === 0) return (
            <div className="text-center py-20 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Inbox className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">No inboxes yet</h2>
              <p className="text-muted-foreground">Create your first disposable inbox to get started.</p>
              <Button asChild className="gradient-bg text-primary-foreground">
                <Link to="/">Create Inbox</Link>
              </Button>
            </div>
            );

            if (filtered.length === 0 && aliases.length > 0) return (
              <div className="text-center py-16 space-y-3">
                <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No inboxes match your search</p>
              </div>
            );

            return (
              <div className="space-y-3">
                {filtered.map((alias) => (
                  <div
                    key={alias.id}
                    className="group p-4 rounded-xl glass border border-border/40 hover:border-primary/30 transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {alias.is_password_protected ? (
                          <Lock className="w-5 h-5 text-primary" />
                        ) : (
                          <Mail className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground truncate">
                            {alias.username}@{alias.domain_name}
                          </span>
                          {alias.is_password_protected && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              <Shield className="w-3 h-3 mr-1" /> Protected
                            </Badge>
                          )}
                          {alias.domain_name !== "mailrcv.site" && alias.domain_name !== "getemail.cfd" && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              <Globe className="w-3 h-3 mr-1" /> Custom
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          <span>{alias.email_count} email{alias.email_count !== 1 ? "s" : ""}</span>
                          {alias.forward_to_email && (
                            <span className="truncate">→ {alias.forward_to_email}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8"
                          onClick={() => navigate(getInboxUrl(alias))}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-8 h-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(alias)}
                          disabled={deleting === alias.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
