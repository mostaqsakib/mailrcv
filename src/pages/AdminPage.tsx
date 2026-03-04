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
  Wand2,
  Copy,
  CreditCard,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  DollarSign,
  Save,
  Edit,
} from "lucide-react";
import { toast } from "sonner";

interface Stats {
  totalUsers: number;
  totalInboxes: number;
  totalEmails: number;
  planCounts: { guest: number; free: number; paid: number };
  totalRevenue?: number;
  verifiedOrders?: number;
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

interface PaymentOrder {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  plan_type: string;
  payment_method: string;
  binance_order_id: string | null;
  created_at: string;
  expires_at: string;
  verified_at: string | null;
}

interface PaymentGateway {
  id: string;
  gateway_type: string;
  display_name: string;
  is_active: boolean;
  config: Record<string, any>;
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
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersPage, setOrdersPage] = useState(0);
  const [ordersUserMap, setOrdersUserMap] = useState<Record<string, string>>({});
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [editingGateway, setEditingGateway] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, any>>({});
  const [editDisplayName, setEditDisplayName] = useState("");
  const [loadingTab, setLoadingTab] = useState(false);

  // New coupon form
  const [newCode, setNewCode] = useState("");
  const [newType, setNewType] = useState<string>("trial_days");
  const [newValue, setNewValue] = useState("30");
  const [newMaxUses, setNewMaxUses] = useState("100");
  const [newExpiry, setNewExpiry] = useState("");

  // New gateway form
  const [newGwType, setNewGwType] = useState("");
  const [newGwName, setNewGwName] = useState("");

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

  const loadOrders = useCallback(async (page = 0) => {
    setLoadingTab(true);
    try {
      const data = await adminInvoke("payment_orders", { page });
      setOrders(data.orders);
      setOrdersTotal(data.total);
      setOrdersPage(page);
      setOrdersUserMap(data.userMap || {});
    } catch { toast.error("Failed to load orders"); }
    setLoadingTab(false);
  }, []);

  const loadGateways = useCallback(async () => {
    setLoadingTab(true);
    try {
      const data = await adminInvoke("gateways");
      setGateways(data.gateways);
    } catch { toast.error("Failed to load gateways"); }
    setLoadingTab(false);
  }, []);

  useEffect(() => {
    if (isAdmin) loadStats();
  }, [isAdmin, loadStats]);

  const handleToggleGateway = async (id: string, active: boolean) => {
    try {
      await adminInvoke("toggle_gateway", { gatewayId: id, is_active: active });
      setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, is_active: active } : g)));
      toast.success(active ? "Gateway enabled" : "Gateway disabled");
    } catch { toast.error("Failed"); }
  };

  const handleUpdateGateway = async (id: string) => {
    try {
      await adminInvoke("update_gateway", { gatewayId: id, display_name: editDisplayName, config: editConfig });
      setGateways((prev) => prev.map((g) => (g.id === id ? { ...g, display_name: editDisplayName, config: editConfig } : g)));
      setEditingGateway(null);
      toast.success("Gateway updated");
    } catch { toast.error("Failed to update"); }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!confirm("Delete this gateway?")) return;
    try {
      await adminInvoke("delete_gateway", { gatewayId: id });
      setGateways((prev) => prev.filter((g) => g.id !== id));
      toast.success("Gateway deleted");
    } catch { toast.error("Failed"); }
  };


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
          if (v === "payments") loadOrders(0);
          if (v === "gateways") loadGateways();
        }}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="stats" className="gap-1 text-xs sm:text-sm"><BarChart3 className="w-4 h-4" /> <span className="hidden sm:inline">Stats</span></TabsTrigger>
            <TabsTrigger value="users" className="gap-1 text-xs sm:text-sm"><Users className="w-4 h-4" /> <span className="hidden sm:inline">Users</span></TabsTrigger>
            <TabsTrigger value="coupons" className="gap-1 text-xs sm:text-sm"><Ticket className="w-4 h-4" /> <span className="hidden sm:inline">Coupons</span></TabsTrigger>
            <TabsTrigger value="payments" className="gap-1 text-xs sm:text-sm"><CreditCard className="w-4 h-4" /> <span className="hidden sm:inline">Payments</span></TabsTrigger>
            <TabsTrigger value="gateways" className="gap-1 text-xs sm:text-sm"><Settings className="w-4 h-4" /> <span className="hidden sm:inline">Gateways</span></TabsTrigger>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <StatCard icon={<DollarSign className="w-5 h-5" />} label="Total Revenue (USD)" value={stats.totalRevenue || 0} color="text-green-500" />
                  <StatCard icon={<CheckCircle className="w-5 h-5" />} label="Verified Payments" value={stats.verifiedOrders || 0} color="text-green-500" />
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
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2"><Plus className="w-4 h-4" /> Create Coupon</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                  <div className="relative">
                    <Input placeholder="CODE" value={newCode} onChange={(e) => setNewCode(e.target.value.toUpperCase())} className="font-mono pr-16" />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-2 text-xs gap-1 text-muted-foreground hover:text-primary"
                      onClick={() => {
                        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
                        let code = "";
                        for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
                        setNewCode(code);
                      }}
                    >
                      <Wand2 className="w-3 h-3" /> Auto
                    </Button>
                  </div>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="trial_days">Trial Days</SelectItem>
                      <SelectItem value="lifetime">Lifetime Pro</SelectItem>
                      <SelectItem value="discount_percent">Discount %</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input type="number" placeholder={newType === "trial_days" ? "Days" : newType === "discount_percent" ? "Percent" : "1"} value={newValue} onChange={(e) => setNewValue(e.target.value)} />
                  <Input type="number" placeholder="Max uses" value={newMaxUses} onChange={(e) => setNewMaxUses(e.target.value)} />
                  <Button onClick={handleCreateCoupon} className="gradient-bg text-primary-foreground">Create</Button>
                </div>
                <div className="flex items-center gap-2">
                  <Input type="datetime-local" value={newExpiry} onChange={(e) => setNewExpiry(e.target.value)} className="max-w-xs" />
                  <span className="text-xs text-muted-foreground">Expiry (optional)</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {newType === "trial_days" && "Value = number of days Pro plan will be active"}
                  {newType === "lifetime" && "Value is ignored — grants permanent Pro access"}
                  {newType === "discount_percent" && "Value = discount percentage (e.g. 50 = 50% off)"}
                </p>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6"
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                              toast.success("Code copied!");
                            }}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                          <Badge variant={c.is_active ? "default" : "secondary"}>
                            {c.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Badge variant="outline">{couponTypeLabel(c.coupon_type)}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Value: {c.coupon_type === "trial_days" ? `${c.value} days` : c.coupon_type === "discount_percent" ? `${c.value}%` : "Lifetime"} • Used: {c.used_count}/{c.max_uses}
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

          {/* PAYMENTS TAB */}
          <TabsContent value="payments">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{ordersTotal} total orders</p>
                <Button variant="outline" size="sm" onClick={() => loadOrders(ordersPage)} className="gap-2">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>

              {loadingTab ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : orders.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No payment orders yet</p>
              ) : (
                <div className="space-y-2">
                  {orders.map((o) => (
                    <div key={o.id} className="p-4 rounded-xl border border-border/40 bg-card/50 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{ordersUserMap[o.user_id] || o.user_id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleString()} • {o.payment_method.toUpperCase()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="font-mono">
                            {o.amount} {o.currency}
                          </Badge>
                          <Badge variant="outline">{o.plan_type}</Badge>
                          <Badge
                            variant={o.status === "verified" ? "default" : o.status === "expired" ? "destructive" : "secondary"}
                            className={`gap-1 ${o.status === "verified" ? "bg-green-500/20 text-green-600" : ""}`}
                          >
                            {o.status === "verified" && <CheckCircle className="w-3 h-3" />}
                            {o.status === "pending" && <Clock className="w-3 h-3" />}
                            {o.status === "expired" && <XCircle className="w-3 h-3" />}
                            {o.status}
                          </Badge>
                        </div>
                      </div>
                      {o.binance_order_id && (
                        <p className="text-xs text-muted-foreground">
                          Order ID: <span className="font-mono text-foreground">{o.binance_order_id}</span>
                        </p>
                      )}
                      {o.verified_at && (
                        <p className="text-xs text-muted-foreground">
                          Verified: {new Date(o.verified_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {ordersTotal > 50 && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button variant="outline" size="sm" disabled={ordersPage === 0} onClick={() => loadOrders(ordersPage - 1)}>
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground self-center">
                    Page {ordersPage + 1} of {Math.ceil(ordersTotal / 50)}
                  </span>
                  <Button variant="outline" size="sm" disabled={(ordersPage + 1) * 50 >= ordersTotal} onClick={() => loadOrders(ordersPage + 1)}>
                    Next
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* GATEWAYS TAB */}
          <TabsContent value="gateways">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Payment Gateway Configuration</p>
                <Button variant="outline" size="sm" onClick={() => loadGateways()} className="gap-2">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>

              {loadingTab ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
              ) : gateways.length === 0 ? (
                <p className="text-center text-muted-foreground py-10">No gateways configured</p>
              ) : (
                <div className="space-y-3">
                  {gateways.map((g) => (
                    <div key={g.id} className="p-5 rounded-xl border border-border/40 bg-card/50 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              g.gateway_type === "binance" ? "bg-yellow-500/20" : "bg-primary/20"
                            }`}>
                              {g.gateway_type === "binance" ? (
                                <span className="text-yellow-500 font-bold text-xs">₿</span>
                              ) : (
                                <CreditCard className="w-4 h-4 text-primary" />
                              )}
                            </div>
                            <span className="font-semibold text-foreground">{g.display_name}</span>
                            <Badge variant="outline" className="text-xs">{g.gateway_type}</Badge>
                            <Badge variant={g.is_active ? "default" : "secondary"}>
                              {g.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8"
                            onClick={() => {
                              if (editingGateway === g.id) {
                                setEditingGateway(null);
                              } else {
                                setEditingGateway(g.id);
                                setEditDisplayName(g.display_name);
                                setEditConfig({ ...g.config });
                              }
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => handleToggleGateway(g.id, !g.is_active)}>
                            {g.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => handleDeleteGateway(g.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Config display */}
                      {editingGateway !== g.id && (
                        <div className="text-xs text-muted-foreground space-y-1">
                          {Object.entries(g.config).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="font-medium text-foreground/70">{key}:</span>
                              <span className="font-mono">{String(val)}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Edit form */}
                      {editingGateway === g.id && (
                        <div className="space-y-3 pt-2 border-t border-border/30">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">Display Name</label>
                            <Input
                              value={editDisplayName}
                              onChange={(e) => setEditDisplayName(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          {Object.entries(editConfig).map(([key, val]) => (
                            <div key={key}>
                              <label className="text-xs font-medium text-muted-foreground mb-1 block">{key}</label>
                              <Input
                                value={String(val)}
                                onChange={(e) => setEditConfig((prev) => ({ ...prev, [key]: e.target.value }))}
                                className="h-8 text-sm font-mono"
                              />
                            </div>
                          ))}
                          {/* Add new config field */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="New field name"
                              className="h-8 text-sm"
                              id={`new-key-${g.id}`}
                            />
                            <Input
                              placeholder="Value"
                              className="h-8 text-sm"
                              id={`new-val-${g.id}`}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs shrink-0"
                              onClick={() => {
                                const keyEl = document.getElementById(`new-key-${g.id}`) as HTMLInputElement;
                                const valEl = document.getElementById(`new-val-${g.id}`) as HTMLInputElement;
                                if (keyEl?.value) {
                                  setEditConfig((prev) => ({ ...prev, [keyEl.value]: valEl?.value || "" }));
                                  keyEl.value = "";
                                  if (valEl) valEl.value = "";
                                }
                              }}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" className="gap-1" onClick={() => handleUpdateGateway(g.id)}>
                              <Save className="w-3 h-3" /> Save
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingGateway(null)}>Cancel</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Add new gateway */}
              <div className="p-5 rounded-xl border border-dashed border-border/60 bg-card/30">
                <h3 className="font-semibold flex items-center gap-2 mb-3 text-sm"><Plus className="w-4 h-4" /> Add Gateway</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select value={newGwType} onValueChange={setNewGwType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="binance">Binance</SelectItem>
                      <SelectItem value="cryptomus">Cryptomus</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input placeholder="Display Name" value={newGwName} onChange={(e) => setNewGwName(e.target.value)} className="h-9 text-sm" />
                  <Button
                    size="sm"
                    className="h-9"
                    onClick={async () => {
                      if (!newGwType || !newGwName.trim()) {
                        toast.error("Enter gateway type and name");
                        return;
                      }
                      try {
                        await adminInvoke("create_gateway", {
                          gateway_type: newGwType,
                          display_name: newGwName.trim(),
                          config: newGwType === "binance" ? { pay_id: "", currency: "USDT" } : newGwType === "cryptomus" ? { merchant_id: "", api_key: "", currency: "USD" } : {},
                        });
                        toast.success("Gateway created");
                        setNewGwType("");
                        setNewGwName("");
                        loadGateways();
                      } catch { toast.error("Failed"); }
                    }}
                  >
                    Create
                  </Button>
                </div>
              </div>
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
