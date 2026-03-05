import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, ArrowLeft, Eye, EyeOff, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";

const ResetPasswordPage = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const navigate = useNavigate();

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    // Check for recovery event from URL hash
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });

    // Also check URL hash for type=recovery
    const hash = window.location.hash;
    if (hash.includes("type=recovery")) {
      setIsRecovery(true);
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) { toast.error("Please fill in all fields"); return; }
    if (password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { toast.error("Passwords don't match"); return; }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { toast.error(error.message); return; }
      setSuccess(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/"), 2000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen hero-gradient flex items-center justify-center relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-30" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/8 dark:bg-primary/15 blur-[150px] animate-float" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/6 dark:bg-accent/12 blur-[130px] animate-float" style={{ animationDelay: "-3s" }} />
      </div>

      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none" />

      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 group">
            {success ? <CheckCircle className="w-8 h-8 text-primary-foreground" /> : <Lock className="w-8 h-8 text-primary-foreground" />}
            <div className="absolute inset-0 rounded-2xl gradient-bg opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {success ? "Password Updated!" : "Set New Password"}
          </h1>
          <p className="text-muted-foreground">
            {success ? "Redirecting you back..." : "Enter your new password below"}
          </p>
        </div>

        {!success && (
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in"
            style={{ animationDelay: "0.15s" }}
          >
            <div
              className="absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `conic-gradient(from 180deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.4))`,
                animation: isHovered ? "none" : "borderSpin 8s linear infinite",
              }}
            />

            {isHovered && (
              <div
                className="absolute inset-0 rounded-2xl opacity-60 pointer-events-none"
                style={{
                  background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)`,
                }}
              />
            )}

            <form onSubmit={handleSubmit} className="relative space-y-4 p-6 rounded-2xl bg-card/90 backdrop-blur-2xl border border-transparent">
              <div className="relative">
                <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-4 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 focus-within:shadow-[0_0_25px_-5px] focus-within:shadow-primary/20">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0 px-1 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-4 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 focus-within:shadow-[0_0_25px_-5px] focus-within:shadow-primary/20">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-emerald-400" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-w-0 px-1 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="relative w-full h-12 rounded-xl font-semibold text-lg overflow-hidden group/submit" disabled={loading}>
                <div className="absolute inset-0 gradient-bg" />
                <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500" style={{
                  background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.12) 50%, transparent 100%)",
                  animation: "shimmerSlide 2s ease-in-out infinite",
                }} />
                {loading ? (
                  <div className="relative z-10 w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="relative z-10 text-primary-foreground">Update Password</span>
                )}
              </Button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
