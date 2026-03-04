import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  ArrowLeft,
  BarChart3,
  Users,
  Ticket,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Crown,
  Mail,
  Inbox,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalInboxes: number;
  totalEmails: number;
  planCounts: { guest: number; free: number; paid: number };
}

interface UserProfile {
  id: string;
  email: string | null;
  display_name: string | null;
  plan: string;
  plan_expires_at: string | null;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  coupon_type: string;
  value: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const adminInvoke = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke("admin", {
    body: { action, ...params },
  });
  if (error) throw error;
  return data;
};

const AdminPage = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(0);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loadingTab, setLoadingTab] = useState(false);

  // New coupon form
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<string>("trial_days");
  const [newValue, setNewValue] = useState("30");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newExpiry, setNewExpiry] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Check admin status
  useEffect(() => {
    if (!user) return;
    const check = async () => {
      try {
        await adminInvoke("stats");
        setIsAdmin(true);
      } catch {
        setIsAdmin(false);
      }
    };
    check();
  }, [user]);

  const loadStats = useCallback(async () => {
    setLoadingTab(true);
    try {
      const data = await adminInvoke("stats");
      setStats(data);
    } catch { toast.error("Failed to load stats"); }
    setLoadingTab(false);
  }, []);

  const loadUsers = useCallback(async (page = 0) => {
    setLoadingTab(true);
    try {
      const data = await adminInvoke("users", { page });
      setUsers(data.users);
      setUsersTotal(data.total);
      setUsersPage(page);
    } catch { toast.error("Failed to load users"); }
    setLoadingTab(false);
  }, []);

  const loadCoupons = useCallback(async () => {
    setLoadingTab(true);
    try {
      const data = await adminInvoke("coupons");
      setCoupons(data.coupons);
    } catch { toast.error("Failed to load coupons"); }
    setLoadingTab(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin, loadStats]);

  const handleUpdatePlan = async (userId: string, plan: string) => {
    try {
      let planExpiresAt: string | null = null;
      if (plan === "paid") {
        // Default: 30 days from now
        const d = new Date();
        d.setDate(d.getDate() + 30);
        planExpiresAt = d.toISOString();
      }
      await adminInvoke("update_plan", { userId, plan, planExpiresAt });
      toast.success("Plan updated");
      loadUsers(usersPage);
    } catch { toast.error("Failed to update plan"); }
  };

  const handleCreateCoupon = async () => {
    if (!newCode.trim()) { toast.error("Enter a coupon code"); return; }
    try {
      await adminInvoke("create_coupon", {
        code: newCode.trim(),
        coupon_type: newType,
        value: parseInt(newValue) || 0,
        max_uses: parseInt(newMaxUses) || 1,
        expires_at: newExpiry || null,
      });
      toast.success("Coupon created");
      setNewCode("");
      loadCoupons();
    } catch (e: any) {
      toast.error(e.message || "Failed to create coupon");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    try {
      await adminInvoke("delete_coupon", { couponId: id });
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      toast.success("Coupon deleted");
    } catch { toast.error("Failed"); }
  };

  const handleToggleCoupon = async (id: string, active: boolean) => {
    try {
      await adminInvoke("toggle_coupon", { couponId: id, is_active: active });
      setCoupons((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: active } : c)));
    } catch { toast.error("Failed"); }
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">You don't have admin privileges.</p>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const couponTypeLabel = (t: string) => {
    switch (t) {
      case "trial_days": return "Trial Days";
      case "lifetime": return "Lifetime Pro";
      case "discount_percent": return "Discount %";
      default: return t;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h1 className="font-bold text-lg">Admin Panel</h1>
            <Badge variant="destructive" className="text-[10px]">ADMIN</Badge>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="container max-w-6xl mx-auto px-4 py-6">
        <Tabs defaultValue="stats" onValueChange={(v) => {
          if (v === "stats") loadStats();
          if (v === "users") loadUsers(0);
          if (v === "coupons") loadCoupons();
        }}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="stats" className="gap-2"><BarChart3 className="w-4 h-4" /> Stats</TabsTrigger>
            <TabsTrigger value="users" className="gap-2"><Users className="w-4 h-4" /> Users</TabsTrigger>
            <TabsTrigger value="coupons" className="gap-2"><Ticket className="w-4 h-4" /> Coupons</TabsTrigger>
          </TabsList>

          {/* STATS TAB */}
          <TabsContent value="stats">
            {stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Users className="w-6 h-6" />} label="Total Users" value={stats.totalUsers} />
                  <StatCard icon={<Inbox className="w-6 h-6" />} label="Total Inboxes" value={stats.totalInboxes} />
                  <StatCard icon={<Mail className="w-6 h-6" />} label="Total Emails" value={stats.totalEmails} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard icon={<Users className="w-5 h-5" />} label="Guest Users" value={stats.planCounts.guest} color="text-muted-foreground" />
                  <StatCard icon={<Shield className="w-5 h-5" />} label="Free Users" value={stats.planCounts.free} color="text-primary" />
                  <StatCard icon={<Crown className="w-5 h-5" />} label="Pro Users" value={stats.planCounts.paid} color="text-yellow-500" />
                </div>
              </div>
            ) : loadingTab ? (
              <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
            ) : null}
          </TabsContent>

          {/* USERS TAB */}
          <TabsContent value="users">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{usersTotal} total users</p>
                <Button variant="outline" size="sm" onClick={() => loadUsers(usersPage)} className="gap-2">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>

              {loadingTab ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="space-y-2">
                  {users.map((u) => (
                    <div key={u.id} className="p-4 rounded-xl border border-border/40 bg-card/50 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{u.email || "No email"}</p>
                        <p className="text-xs text-muted-foreground">{u.display_name} • Joined {new Date(u.created_at).toLocaleDateString()}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={u.plan === "paid" ? "default" : "secondary"} className={u.plan === "paid" ? "bg-yellow-500/20 text-yellow-600" : ""}>
                          {u.plan}
                        </Badge>
                        <Select defaultValue={u.plan} onValueChange={(val) => handleUpdatePlan(u.id, val)}>
                          <SelectTrigger className="w-[100px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="guest">Guest</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {usersTotal > 50 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={usersPage === 0} onClick={() => loadUsers(usersPage - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {usersPage + 1} of {Math.ceil(usersTotal / 50)}
                  </span>
                  <Button variant="outline" size="sm" disabled={(usersPage + 1) * 50 >= usersTotal} onClick={() => loadUsers(usersPage + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* COUPONS TAB */}
          <TabsContent value="coupons">
            <div className="space-y-6">
              {/* Create coupon form */}
              <div className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Coupon</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <Input placeholder="CODE" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="font-mono" />
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial_days">Trial Days</SelectItem>
                      <SelectItem value="lifetime">Lifetime Pro</SelectItem>
                      <SelectItem value="discount_percent">Discount %</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder="Value" value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                  <Input type="number" placeholder="Max uses" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} />
                  <Button onClick={handleCreateCoupon} className="gradient-bg text-primary-foreground">Create</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="max-w-xs" />
                  <span className="text-xs text-muted-foreground">Expiry (optional)</span>
                </div>
              </div>

              {/* Coupons list */}
              {loadingTab ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : coupons.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No coupons yet</p>
              ) : (
                <div className="space-y-2">
                  {coupons.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-border/40 bg-card/50 flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm">{c.code}</span>
                          <Badge variant={c.is_active ? "default" : "secondary"}>
                            {c.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{couponTypeLabel(c.coupon_type)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value: {c.value} • Used: {c.used_count}/{c.max_uses}
                          {c.expires_at && ` • Expires: ${new Date(c.expires_at).toLocaleDateString()}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleToggleCoupon(c.id, !c.is_active)}>
                          {c.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => handleDeleteCoupon(c.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) => (
  <div className="p-5 rounded-xl border border-border/40 bg-card/50 flex items-center gap-4">
    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${color || "text-primary"}`}>
      {icon}
    </div>
    <div>
      <p className="text-2xl font-bold text-foreground">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </div>
);

export default AdminPage;
