import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Copy,
  Check,
  Plus,
  Layers,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { CreateInboxDialog } from "@/components/CreateInboxDialog";

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
  last_email_at?: string | null;
  share_token?: string | null;
}

// Format relative time
const formatRelativeTime = (dateStr: string) => {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

// Interactive inbox card
const InboxCard = ({ alias, onDelete, onOpen, deleting, unreadCount }: {
  alias: UserAlias;
  onDelete: (a: UserAlias) => void;
  onOpen: (a: UserAlias) => void;
  deleting: string | null;
  unreadCount: number;
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const emailAddress = `${alias.username}@${alias.domain_name}`;

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(emailAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [emailAddress]);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpen(alias)}
      className={`group relative rounded-xl p-[1px] transition-all duration-500 cursor-pointer ${unreadCount > 0 ? "ring-1 ring-primary/40 shadow-glow" : ""}`}
    >
      <div
        className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), transparent 40%)`,
        }}
      />
      {isHovered && (
        <div
          className="absolute inset-0 rounded-xl opacity-50 pointer-events-none"
          style={{
            background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.06), transparent 60%)`,
          }}
        />
      )}

      <div className="relative p-4 rounded-xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500">
        <div className="flex items-center gap-3">
          <div className={`relative w-10 h-10 rounded-lg bg-gradient-to-br ${alias.is_password_protected ? "from-amber-400/15 to-orange-500/15" : "from-sky-400/15 to-blue-500/15"} flex items-center justify-center shrink-0 group-hover:scale-110 transition-all duration-300`}>
            {alias.is_password_protected ? (
              <Lock className="w-5 h-5 text-amber-400" />
            ) : (
              <Mail className="w-5 h-5 text-sky-400" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center shadow-sm">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground truncate">
                {emailAddress}
              </span>
              {alias.is_password_protected && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-amber-500/10 text-amber-400 border-amber-500/20">
                  <Shield className="w-3 h-3 mr-1" /> Protected
                </Badge>
              )}
              {alias.domain_name !== "mailrcv.site" && alias.domain_name !== "getemail.cfd" && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  <Globe className="w-3 h-3 mr-1" /> Custom
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
              <span>{alias.email_count} email{alias.email_count !== 1 ? "s" : ""}</span>
              {unreadCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 animate-pulse">
                  {unreadCount} unread
                </Badge>
              )}
              {alias.last_email_at && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatRelativeTime(alias.last_email_at)}
                </span>
              )}
              {alias.forward_to_email && (
                <span className="truncate">→ {alias.forward_to_email}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
            <Button
              variant="ghost"
              size="icon"
              className="w-8 h-8 hover:bg-secondary/80"
              onClick={handleCopy}
              title="Copy email address"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); onDelete(alias); }} disabled={deleting === alias.id}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, plan, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<UserAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "protected" | "public">("all");
  const [deleteTarget, setDeleteTarget] = useState<UserAlias | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  const fetchAliases = async () => {
    if (!user) return;
    setLoading(true);
    const { data: aliasData, error } = await supabase
      .from("email_aliases").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (error) { console.error("Error fetching aliases:", error); setLoading(false); return; }

    const domainIds = [...new Set((aliasData || []).filter(a => a.domain_id).map(a => a.domain_id!))];
    let domainMap: Record<string, string> = {};
    if (domainIds.length > 0) {
      const { data: domains } = await supabase.from("domains").select("id, domain_name").in("id", domainIds);
      if (domains) domainMap = Object.fromEntries(domains.map(d => [d.id, d.domain_name]));
    }
    setAliases((aliasData || []).map(a => ({ ...a, domain_name: a.domain_id ? domainMap[a.domain_id] || "mailrcv.site" : "mailrcv.site" })));
    setLoading(false);

    // Fetch unread counts and last email times for all aliases
    const aliasIds = (aliasData || []).map(a => a.id);
    if (aliasIds.length > 0) {
      const { data: emailStats } = await supabase
        .from("received_emails")
        .select("alias_id, is_read, received_at")
        .in("alias_id", aliasIds)
        .order("received_at", { ascending: false });
      if (emailStats) {
        const counts: Record<string, number> = {};
        const lastTimes: Record<string, string> = {};
        emailStats.forEach(e => {
          if (!e.is_read) {
            counts[e.alias_id!] = (counts[e.alias_id!] || 0) + 1;
          }
          if (!lastTimes[e.alias_id!]) {
            lastTimes[e.alias_id!] = e.received_at;
          }
        });
        setUnreadCounts(counts);
        // Update aliases with last email time
        setAliases(prev => prev.map(a => ({ ...a, last_email_at: lastTimes[a.id] || null })));
      }
    }
  };

  useEffect(() => { if (user) fetchAliases(); }, [user]);

  const handleDelete = async (alias: UserAlias) => {
    setDeleteTarget(alias);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteTarget(null);
    setDeleting(deleteTarget.id);
    try {
      await supabase.from("received_emails").delete().eq("alias_id", deleteTarget.id);
      await supabase.from("email_aliases").delete().eq("id", deleteTarget.id);
      setAliases(prev => prev.filter(a => a.id !== deleteTarget.id));
      toast.success("Inbox deleted");
    } catch { toast.error("Failed to delete inbox"); }
    finally { setDeleting(null); }
  };

  const getInboxUrl = (alias: UserAlias) => {
    const domain = alias.domain_name || "mailrcv.site";
    if (alias.is_password_protected) return `/secure/${alias.username}@${domain}`;
    const basePath = domain === "mailrcv.site" ? `/inbox/${alias.username}` : `/inbox/${alias.username}@${domain}`;
    return alias.share_token ? `${basePath}?token=${alias.share_token}` : basePath;
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
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-15 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 blur-[200px] pointer-events-none" />

      <Header />
      <main className="flex-1 pt-20 sm:pt-24 pb-8 px-4 relative z-10">
        <div className="container max-w-4xl mx-auto">
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 animate-fade-in">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">My Inboxes</h1>
              <p className="text-muted-foreground mt-1">
                {aliases.length} inbox{aliases.length !== 1 ? "es" : ""} • {limits.label} Plan
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchAliases} className="gap-2">
                <RefreshCw className="w-4 h-4" /> Refresh
              </Button>
              <Button size="sm" onClick={() => setShowCreateDialog(true)} className="relative gap-2 overflow-hidden group/btn">
                  <div className="absolute inset-0 gradient-bg" />
                  <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)", animation: "shimmerSlide 2s infinite" }} />
                  <Plus className="w-4 h-4 relative z-10" />
                  <span className="relative z-10 text-primary-foreground">New Inbox</span>
              </Button>
            </div>
          </div>

          {/* Plan Info Bar — interactive card */}
          <div className="group relative rounded-xl p-[1px] mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="relative p-4 rounded-xl bg-card/60 backdrop-blur-xl border border-border/40 flex flex-wrap items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-sky-400/15 to-blue-500/15 flex items-center justify-center">
                  <Inbox className="w-3.5 h-3.5 text-sky-400" />
                </div>
                <span className="text-foreground/80">
                  {aliases.length} / {limits.maxInboxes === Infinity ? "∞" : limits.maxInboxes} inboxes
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <span className="text-foreground/80">Retention: {limits.retentionLabel}</span>
              </div>
              {plan !== "paid" && (
                <Button variant="link" size="sm" asChild className="ml-auto text-primary p-0 h-auto">
                  <Link to="/pricing">Upgrade →</Link>
                </Button>
              )}
            </div>
          </div>

          {/* Search & Filter */}
          {aliases.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search inboxes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-card/60 backdrop-blur-xl border-border/40 focus-visible:border-primary/50 transition-all duration-300"
                />
              </div>
              <div className="flex gap-2">
                {(["all", "protected", "public"] as const).map((f) => (
                  <Button
                    key={f}
                    variant={filter === f ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(f)}
                    className={`capitalize ${filter === f ? "" : "bg-card/40 backdrop-blur-sm border-border/40 hover:border-primary/30"}`}
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
              <div className="text-center py-20 space-y-4 animate-fade-in">
                <div className="relative w-20 h-20 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/40 flex items-center justify-center mx-auto group">
                  <Inbox className="w-10 h-10 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
                  <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                </div>
                <h2 className="text-xl font-semibold text-foreground tracking-tight">No inboxes yet</h2>
                <p className="text-muted-foreground">Create your first disposable inbox to get started.</p>
                <Button onClick={() => setShowCreateDialog(true)} className="relative overflow-hidden group/btn">
                    <div className="absolute inset-0 gradient-bg" />
                    <span className="relative z-10 text-primary-foreground">Create Inbox</span>
                </Button>
              </div>
            );

            if (filtered.length === 0 && aliases.length > 0) return (
              <div className="text-center py-16 space-y-3 animate-fade-in">
                <Search className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                <p className="text-muted-foreground">No inboxes match your search</p>
              </div>
            );

            return (
              <div className="space-y-3">
                {filtered.map((alias, index) => (
                  <div key={alias.id} className="animate-slide-up" style={{ animationDelay: `${index * 0.05}s` }}>
                    <InboxCard
                      alias={alias}
                      onDelete={handleDelete}
                      onOpen={(a) => navigate(getInboxUrl(a))}
                      deleting={deleting}
                      unreadCount={unreadCounts[alias.id] || 0}
                    />
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      </main>
      <Footer />

      {/* Create Inbox Dialog */}
      <CreateInboxDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreated={fetchAliases}
      />

      {/* Premium Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="border-0 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden">
          {/* Ambient glow */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-destructive/10 rounded-full blur-[80px] pointer-events-none" />
          
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-destructive" />
              </div>
              <AlertDialogTitle className="text-lg">Delete Inbox</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-mono text-foreground font-medium">
                {deleteTarget?.username}@{deleteTarget?.domain_name}
              </span>
              ? This will permanently remove the inbox and all received emails. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="rounded-xl border-border/50 bg-secondary/30 hover:bg-secondary/50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm"
            >
              <Trash2 className="w-4 h-4 mr-1.5" />
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DashboardPage;
