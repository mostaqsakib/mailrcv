import { useState, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();

  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!isLogin && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          toast.error(error);
          return;
        }
        toast.success("Account created! Please check your email to verify.");
      }
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
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/4 dark:bg-primary/8 blur-[180px] animate-pulse-slow" />
      </div>

      {/* Horizontal light beam */}
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none" />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        {/* Logo & heading */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="relative w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 group">
            <Mail className="w-8 h-8 text-primary-foreground" />
            <div className="absolute inset-0 rounded-2xl gradient-bg opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Sign in to access your Free plan features" 
              : "Sign up for free — get 10 inboxes, 7-day retention & more"}
          </p>
        </div>

        {/* Form card with interactive border */}
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 180deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.4))`,
              animation: isHovered ? "none" : "borderSpin 8s linear infinite",
            }}
          />

          {/* Spotlight */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-2xl opacity-60 pointer-events-none"
              style={{
                background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)`,
              }}
            />
          )}

          <form onSubmit={handleSubmit} className="relative space-y-4 p-6 rounded-2xl bg-card/90 backdrop-blur-2xl border border-transparent">
            {!isLogin && (
              <div className="relative animate-slide-up">
                <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 group/input">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-400/15 to-purple-500/15 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-violet-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Display name (optional)"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                  />
                </div>
              </div>
            )}

            <div className="relative">
              <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 group/input focus-within:shadow-[0_0_25px_-5px] focus-within:shadow-primary/20">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-400/15 to-blue-500/15 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4 text-sky-400" />
                </div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 group/input focus-within:shadow-[0_0_25px_-5px] focus-within:shadow-primary/20">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-400/15 to-teal-500/15 flex items-center justify-center shrink-0">
                  <Lock className="w-4 h-4 text-emerald-400" />
                </div>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1 text-foreground placeholder:text-muted-foreground/40"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="relative w-full h-12 rounded-xl font-semibold text-lg overflow-hidden group/submit"
              disabled={loading}
            >
              <div className="absolute inset-0 gradient-bg" />
              <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500" style={{
                background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.12) 50%, transparent 100%)",
                animation: "shimmerSlide 2s ease-in-out infinite",
              }} />
              {loading ? (
                <div className="relative z-10 w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative z-10 text-primary-foreground">
                  {isLogin ? "Sign In" : "Create Account"}
                </span>
              )}
            </Button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsLogin(!isLogin); setPassword(""); }}
                className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300"
              >
                {isLogin ? "Don't have an account? " : "Already have an account? "}
                <span className="font-semibold text-primary">{isLogin ? "Sign Up" : "Sign In"}</span>
              </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-muted-foreground/60 mt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Or continue as <Link to="/" className="text-primary/80 hover:text-primary hover:underline transition-colors">Guest</Link> — no signup needed
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
