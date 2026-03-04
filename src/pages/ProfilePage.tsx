import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { User, Lock, Eye, EyeOff, Save, CreditCard, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { PLAN_LIMITS } from "@/lib/plan-limits";

interface PaymentOrder {
  id: string;
  amount: number;
  currency: string;
  status: string;
  plan_type: string;
  payment_method: string;
  created_at: string;
  verified_at: string | null;
}

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { icon: typeof CheckCircle; label: string; classes: string }> = {
    completed: { icon: CheckCircle, label: "Completed", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    pending: { icon: Clock, label: "Pending", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
    failed: { icon: XCircle, label: "Failed", classes: "bg-destructive/10 text-destructive border-destructive/20" },
    expired: { icon: XCircle, label: "Expired", classes: "bg-muted/30 text-muted-foreground border-border/40" },
  };
  const c = config[status] || config.pending;
  const Icon = c.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.classes}`}>
      <Icon className="w-3 h-3" /> {c.label}
    </span>
  );
};

const ProfilePage = () => {
  const { user, profile, plan, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [savingPass, setSavingPass] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    if (profile) setDisplayName(profile.display_name || "");
  }, [user, profile, navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("payment_orders")
        .select("id, amount, currency, status, plan_type, payment_method, created_at, verified_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setOrders((data as PaymentOrder[]) || []);
      setLoadingOrders(false);
    };
    fetchOrders();
  }, [user]);

  const handleSaveName = async () => {
    if (!user || !displayName.trim()) { toast.error("Name cannot be empty"); return; }
    setSavingName(true);
    try {
      const { error } = await supabase.from("profiles").update({ display_name: displayName.trim() }).eq("id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Display name updated!");
    } catch {
      toast.error("Failed to update name");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error("Please fill in both fields"); return; }
    if (newPassword.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    setSavingPass(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setSavingPass(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-safe">
      <Header />

      <main className="container mx-auto px-4 pt-24 sm:pt-28 pb-16 relative">
        {/* Background effects */}
        <div className="absolute inset-0 grid-dots opacity-15 pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-primary/5 blur-[180px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
          {/* Page header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 group">
              <User className="w-8 h-8 text-primary-foreground" />
              <div className="absolute inset-0 rounded-2xl gradient-bg opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
            <p className="text-muted-foreground mt-1">{user.email}</p>
            <span className={`inline-flex items-center gap-1.5 mt-2 text-xs font-bold px-3 py-1 rounded-full ${
              plan === 'paid'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {PLAN_LIMITS[plan].label} Plan
            </span>
          </div>

          {/* Display Name Card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), transparent 40%)`,
              }}
            />
            {isHovered && (
              <div className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                style={{ background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)` }}
              />
            )}
            <div className="relative rounded-2xl p-6 bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" /> Display Name
              </h2>
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300">
                    <Input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveName}
                  disabled={savingName || displayName === (profile?.display_name || "")}
                  className="relative overflow-hidden rounded-xl group/btn"
                >
                  <div className="absolute inset-0 gradient-bg" />
                  <span className="relative z-10 text-primary-foreground flex items-center gap-1.5">
                    <Save className="w-4 h-4" /> {savingName ? "Saving..." : "Save"}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Change Password Card */}
          <div className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="relative rounded-2xl p-6 bg-card/80 backdrop-blur-xl border border-border/50 transition-all duration-500">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-400" /> Change Password
              </h2>
              <div className="space-y-3">
                <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={savingPass || !newPassword || !confirmPassword}
                  className="relative overflow-hidden rounded-xl w-full group/btn"
                >
                  <div className="absolute inset-0 gradient-bg" />
                  <span className="relative z-10 text-primary-foreground">
                    {savingPass ? "Updating..." : "Update Password"}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          {/* Purchase History Card */}
          <div className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative rounded-2xl p-6 bg-card/80 backdrop-blur-xl border border-border/50 transition-all duration-500">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-sky-400" /> Purchase History
              </h2>

              {loadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
                  ))}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">No purchases yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 rounded-full"
                    onClick={() => navigate("/pricing")}
                  >
                    View Plans
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between gap-3 p-4 rounded-xl bg-background/40 border border-border/30 hover:border-border/60 transition-all duration-300"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold">{order.amount} {order.currency}</p>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          <span className="text-muted-foreground/40">·</span>
                          <span className="capitalize">{order.payment_method}</span>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground capitalize shrink-0">{order.plan_type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Plan expiry info */}
          {profile?.plan_expires_at && plan === 'paid' && (
            <div className="text-center text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.4s" }}>
              Plan expires: {new Date(profile.plan_expires_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
