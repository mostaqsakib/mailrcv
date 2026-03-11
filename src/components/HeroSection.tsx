import { useState, useEffect, useCallback, useRef, memo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ArrowRight, Shuffle, Copy, Check, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Wand2, Crown, Sparkles, Layers } from "lucide-react";
import { CreateInboxDialog } from "@/components/CreateInboxDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDomains } from "@/hooks/use-domains";
import { useAuth } from "@/contexts/AuthContext";
import { canUsePasswordProtection, canCreateInbox, getGuestInboxes, addGuestInbox, PLAN_LIMITS } from "@/lib/plan-limits";
import { generateRandomName, generateStrongPassword } from "@/lib/name-generator";

// Session storage key prefix
const SESSION_KEY_PREFIX = "mailrcv_session_";

// Default domains list (always available)
const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];

// Floating particle component
const FloatingParticle = ({ delay, size, x, y, duration }: { delay: number; size: number; x: number; y: number; duration: number }) => (
  <div
    className="absolute rounded-full bg-primary/20 dark:bg-primary/30"
    style={{
      width: size,
      height: size,
      left: `${x}%`,
      top: `${y}%`,
      animation: `floatParticle ${duration}s ease-in-out ${delay}s infinite`,
    }}
  />
);

// Animated typing text - optimized with refs to avoid re-render lag
const TypingText = memo(({ texts }: { texts: string[] }) => {
  const [displayText, setDisplayText] = useState("");
  const stateRef = useRef({ currentIndex: 0, isDeleting: false, isPaused: false });
  const rafRef = useRef<number>(0);
  const lastTickRef = useRef(0);

  useEffect(() => {
    const tick = (timestamp: number) => {
      const state = stateRef.current;
      const currentFullText = texts[state.currentIndex];
      const speed = state.isDeleting ? 35 : 65;

      if (timestamp - lastTickRef.current < speed) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      lastTickRef.current = timestamp;

      setDisplayText(prev => {
        if (state.isPaused) return prev;

        if (!state.isDeleting && prev === currentFullText) {
          state.isPaused = true;
          setTimeout(() => {
            state.isPaused = false;
            state.isDeleting = true;
          }, 2000);
          return prev;
        }

        if (state.isDeleting && prev === "") {
          state.isDeleting = false;
          state.currentIndex = (state.currentIndex + 1) % texts.length;
          return prev;
        }

        return state.isDeleting
          ? currentFullText.substring(0, prev.length - 1)
          : currentFullText.substring(0, prev.length + 1);
      });

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [texts]);

  return (
    <span className="gradient-text">
      {displayText}
      <span className="animate-pulse text-primary">|</span>
    </span>
  );
});
TypingText.displayName = "TypingText";

export const HeroSection = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const { domains } = useDomains();
  const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAINS[0]);
  const navigate = useNavigate();
  const { plan, user } = useAuth();
  const canUsePassword = canUsePasswordProtection(plan);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  // Track mouse for spotlight effect
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (plan === 'guest') {
      const guestInboxes = getGuestInboxes();
      const inboxKey = `${cleanUsername}@${selectedDomain}`;
      if (!guestInboxes.includes(inboxKey) && !canCreateInbox(plan, guestInboxes.length)) {
        toast("Guest limit reached! Max 5 inboxes.", {
          description: "Sign up for free to get 10 inboxes and more features.",
          action: { label: "Sign Up", onClick: () => navigate("/auth") },
        });
        return;
      }
    }

    if (!password) {
      if (plan === 'guest') addGuestInbox(`${cleanUsername}@${selectedDomain}`);
      const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
      navigate(`/inbox/${urlParam}`);
      return;
    }

    setIsLoading(true);
    try {
      const { data: checkData, error: checkError } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'check', username: cleanUsername, domain: selectedDomain }
      });
      if (checkError) throw checkError;

      if (checkData.exists) {
        if (!checkData.is_password_protected) {
          toast.error("This is a public inbox, remove password to access");
          setIsLoading(false);
          return;
        }
        const { data: loginData, error: loginError } = await supabase.functions.invoke('inbox-auth', {
          body: { action: 'login', username: cleanUsername, domain: selectedDomain, password }
        });
        if (loginError) throw loginError;
        if (loginData.error) { toast.error(loginData.error); setIsLoading(false); return; }
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: loginData.alias_id, token: loginData.session_token, password, domain: selectedDomain, created_at: Date.now()
        }));
        toast.success("Login successful!");
        const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
        navigate(`/inbox/${urlParam}`);
      } else {
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); setIsLoading(false); return; }
        const { data: registerData, error: registerError } = await supabase.functions.invoke('inbox-auth', {
          body: { action: 'register', username: cleanUsername, domain: selectedDomain, password }
        });
        if (registerError) throw registerError;
        if (registerData.error) { toast.error(registerData.error); setIsLoading(false); return; }
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: registerData.alias_id, token: registerData.session_token, password, domain: selectedDomain, created_at: Date.now()
        }));
        toast.success("Secure inbox created!");
        const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
        navigate(`/inbox/${urlParam}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomGenerate = () => setUsername(generateRandomName());

  const handleGeneratePassword = async () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setShowPassword(true);
    await navigator.clipboard.writeText(newPassword);
    toast.success("Strong password generated & copied!");
  };

  const handleCopyEmail = async () => {
    if (!username.trim()) { toast.error("Please enter a name first"); return; }
    const fullEmail = `${username.trim().toLowerCase()}@${selectedDomain}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section
      className="relative sm:min-h-screen flex items-start sm:items-center justify-center overflow-hidden pt-24 sm:pt-20 pb-0 sm:py-20"
      onMouseMove={handleMouseMove}
    >
      {/* Animated mesh gradient background */}
      <div className="absolute inset-0 hero-gradient" />
      
      {/* Mouse-tracking spotlight */}
      <div
        className="absolute inset-0 opacity-30 dark:opacity-40 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(800px circle at ${mousePos.x}% ${mousePos.y}%, hsl(var(--primary) / 0.12), transparent 50%)`,
        }}
      />

      {/* Animated grid with perspective */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 grid-dots opacity-40 dark:opacity-30"
          style={{
            transform: "perspective(1000px) rotateX(60deg)",
            transformOrigin: "center top",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, transparent 0%, black 20%, black 60%, transparent 100%)",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingParticle delay={0} size={6} x={10} y={20} duration={8} />
        <FloatingParticle delay={1.5} size={4} x={85} y={15} duration={10} />
        <FloatingParticle delay={3} size={8} x={70} y={70} duration={7} />
        <FloatingParticle delay={0.5} size={5} x={25} y={80} duration={9} />
        <FloatingParticle delay={2} size={3} x={50} y={10} duration={11} />
        <FloatingParticle delay={4} size={7} x={90} y={50} duration={8} />
        <FloatingParticle delay={1} size={4} x={15} y={55} duration={12} />
        <FloatingParticle delay={2.5} size={6} x={60} y={35} duration={9} />
      </div>
      
      {/* Animated aurora blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/8 dark:bg-primary/15 blur-[150px] animate-float" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/6 dark:bg-accent/12 blur-[130px] animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/4 dark:bg-primary/8 blur-[180px] animate-pulse-slow" />
      </div>


      <div className="container relative z-10 px-4 py-4 sm:py-20">
        <div className="max-w-3xl mx-auto text-center">

          {/* Animated badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 mb-6 sm:mb-8 animate-fade-in backdrop-blur-sm hover:bg-primary/10 hover:border-primary/30 transition-all duration-300 cursor-default group">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-xs font-medium text-primary tracking-wide">INSTANT PRIVACY · NO SIGNUP REQUIRED</span>
          </div>

          {/* Main heading with typing effect */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight mt-2 sm:mt-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            Disposable Email
            <span className="block pb-2">
              <TypingText texts={["In Seconds", "With Privacy", "No Signup", "Stay Anonymous"]} />
            </span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.2s" }}>
            Create temporary inboxes instantly. Receive emails, protect your privacy, and keep spam out of your real inbox.
          </p>

          {/* Email creation form — premium glass card */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <div className="relative group/card">
              {/* Animated gradient border */}
              <div className="absolute -inset-[1px] rounded-[1.6rem] opacity-50 group-hover/card:opacity-100 transition-opacity duration-500" style={{
                background: "conic-gradient(from 180deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.4))",
                animation: "borderSpin 8s linear infinite",
              }} />
              
              <div className="relative flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-card/95 dark:bg-card/80 backdrop-blur-2xl border-0 shadow-none dark:shadow-none">
                {/* Input row with random button */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative group">
                    <div className="relative flex items-center bg-background/80 dark:bg-background/50 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 group-hover:border-primary/30 transition-all duration-300 group-focus-within:border-primary/60 group-focus-within:shadow-[0_0_25px_-5px] group-focus-within:shadow-primary/30">
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0 group-focus-within:from-primary/25 group-focus-within:to-accent/20 transition-all duration-300">
                        <Mail className="w-4 h-4 text-primary" />
                      </div>
                      <Input
                        type="text"
                        placeholder="enter-name"
                        value={username}
                        onChange={(e) => {
                          let value = e.target.value;
                          if (value.includes('@')) {
                            const emailMatch = value.match(/^([a-zA-Z0-9._-]+)@mailrcv\.site$/i);
                            if (emailMatch) { value = emailMatch[1]; } else { value = value.split('@')[0]; }
                          }
                          setUsername(value.replace(/[^a-zA-Z0-9._-]/g, ""));
                        }}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 font-mono text-lg font-medium text-foreground placeholder:text-muted-foreground/40 min-w-0 h-auto py-1"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon"
                    onClick={handleRandomGenerate}
                    className="h-14 w-14 shrink-0 rounded-xl border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/15 hover:to-accent/15 hover:border-primary/40 transition-all duration-300 group/btn hover:scale-105 active:scale-95 hover:shadow-[0_0_20px_-5px] hover:shadow-primary/30"
                    title="Generate random name"
                  >
                    <Shuffle className="w-5 h-5 text-primary group-hover/btn:rotate-180 transition-transform duration-500" />
                  </Button>
                </div>

                {/* Email preview */}
                <div className="flex items-center justify-between gap-2 py-3 px-4 rounded-xl bg-primary/[0.03] dark:bg-primary/[0.06] border border-primary/10 dark:border-primary/15 group/preview hover:border-primary/25 transition-all duration-300">
                  <div className="flex items-center gap-1 min-w-0 flex-1">
                    <span className="font-mono text-base sm:text-lg font-semibold text-foreground truncate">
                      {username || <span className="text-muted-foreground/40">your-name</span>}
                    </span>
                    <span className="font-mono text-base sm:text-lg font-semibold text-primary shrink-0">@</span>
                    <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                      <SelectTrigger className="h-auto px-2 py-1 border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 rounded-lg font-mono text-base sm:text-lg font-semibold text-primary focus:ring-1 focus:ring-primary/40 focus:ring-offset-0 w-auto gap-1.5 transition-all duration-200 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover/95 backdrop-blur-xl border border-primary/15 shadow-xl shadow-primary/5 rounded-xl overflow-hidden">
                        {domains.map((d) => (
                          <SelectItem key={d} value={d} className="font-mono text-sm cursor-pointer py-2.5 pl-8 pr-4 focus:bg-primary/10 focus:text-primary transition-colors">
                            {d}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={handleCopyEmail} className="h-8 w-8 shrink-0 opacity-40 group-hover/preview:opacity-100 transition-all duration-300" title="Copy email address">
                    {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>

                {/* Password toggle */}
                <button
                  type="button"
                  onClick={() => {
                    if (!canUsePassword) {
                      toast("Password protection requires a Free account or higher", {
                        action: { label: "Sign Up", onClick: () => navigate("/auth") },
                      });
                      return;
                    }
                    setShowPasswordField(!showPasswordField);
                    if (showPasswordField) setPassword("");
                  }}
                  className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/lock"
                >
                  <Lock className="w-4 h-4 group-hover/lock:text-primary transition-colors" />
                  <span>{showPasswordField ? "Remove password protection" : "Add password protection"}</span>
                  {!canUsePassword && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
                  {canUsePassword && (showPasswordField ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                </button>

                {/* Password input */}
                {showPasswordField && (
                  <div className="relative animate-slide-up">
                    <div className="relative flex items-center bg-background/80 dark:bg-background/50 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/40 transition-all duration-300">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Lock className="w-4 h-4 text-primary" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter password (min 6 chars)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-base text-foreground placeholder:text-muted-foreground/40 min-w-0 h-auto py-0"
                      />
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleGeneratePassword} title="Generate strong password">
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground/50 mt-2 text-center">
                      With password: creates secure inbox or logs in to existing one
                    </p>
                  </div>
                )}

                {/* Submit button */}
                <Button 
                  type="submit" 
                  variant="hero" 
                  size="lg" 
                  className="w-full rounded-xl h-14 text-base font-semibold shadow-lg hover:shadow-xl dark:shadow-primary/15 dark:hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/submit"
                  disabled={isLoading}
                >
                  {/* Button shimmer effect */}
                  <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500" style={{
                    background: "linear-gradient(90deg, transparent 0%, hsl(var(--primary-foreground) / 0.1) 50%, transparent 100%)",
                    animation: "shimmerSlide 2s ease-in-out infinite",
                  }} />
                  
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span className="relative flex items-center gap-2">
                      {password ? "Open Secure Inbox" : "Open Inbox"}
                      <ArrowRight className="w-5 h-5 group-hover/submit:translate-x-1 transition-transform duration-300" />
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Bottom hints */}
          <div className="mt-5 flex flex-col items-center gap-2 animate-fade-in" style={{ animationDelay: "0.5s" }}>
            <p className="text-xs sm:text-sm text-muted-foreground/50">
              💡 Click the <Shuffle className="inline w-3.5 h-3.5 mx-0.5" /> button for a random name
            </p>
            {!user && (
              <p className="text-xs text-muted-foreground/40">
                Using as <span className="font-semibold text-muted-foreground/60">Guest</span> · <Link to="/auth" className="text-primary/80 hover:text-primary hover:underline transition-colors">Sign up</Link> for more features · <Link to="/pricing" className="text-primary/80 hover:text-primary hover:underline transition-colors">See plans</Link>
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
};
