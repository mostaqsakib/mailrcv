import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react";
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
      <div className="absolute inset-0 grid-dots opacity-50" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground">
            {isLogin 
              ? "Sign in to access your Free plan features" 
              : "Sign up for free — get 10 inboxes, 7-day retention & more"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6 rounded-2xl glass-strong">
          {!isLogin && (
            <div className="relative">
              <div className="flex items-center bg-background/70 rounded-xl px-4 py-3 gap-3 border border-border/50 focus-within:border-primary transition-all">
                <User className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="Display name (optional)"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1"
                />
              </div>
            </div>
          )}

          <div className="relative">
            <div className="flex items-center bg-background/70 rounded-xl px-4 py-3 gap-3 border border-border/50 focus-within:border-primary transition-all">
              <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
              <Input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1"
                required
              />
            </div>
          </div>

          <div className="relative">
            <div className="flex items-center bg-background/70 rounded-xl px-4 py-3 gap-3 border border-border/50 focus-within:border-primary transition-all">
              <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto py-1"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="shrink-0 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-12 rounded-xl gradient-bg text-primary-foreground font-semibold text-lg" disabled={loading}>
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </Button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setIsLogin(!isLogin); setPassword(""); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <span className="font-semibold text-primary">{isLogin ? "Sign Up" : "Sign In"}</span>
            </button>
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Or continue as <Link to="/" className="text-primary hover:underline">Guest</Link> — no signup needed
        </p>
      </div>
    </div>
  );
};

export default AuthPage;
