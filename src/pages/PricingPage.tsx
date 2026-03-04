import { useState, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft, Zap, Shield, Crown, Mail, Ticket } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS, type PlanType } from "@/lib/plan-limits";

const features: { label: string; guest: string | boolean; free: string | boolean; paid: string | boolean }[] = [
  { label: "Inboxes", guest: "5", free: "10", paid: "Unlimited" },
  { label: "Emails per inbox", guest: "10", free: "50", paid: "Unlimited" },
  { label: "Email retention", guest: "24 hours", free: "7 days", paid: "Forever" },
  { label: "Password protection", guest: false, free: true, paid: true },
  { label: "Custom domains", guest: false, free: false, paid: true },
  { label: "Bulk generate (up to 500)", guest: false, free: false, paid: true },
  { label: "Push notifications", guest: true, free: true, paid: true },
  { label: "Real-time inbox updates", guest: true, free: true, paid: true },
  { label: "Email forwarding", guest: false, free: true, paid: true },
  { label: "Priority support", guest: false, free: false, paid: true },
];

const planIcons: Record<PlanType, React.ReactNode> = {
  guest: <Mail className="w-6 h-6 text-white" />,
  free: <Shield className="w-6 h-6 text-white" />,
  paid: <Crown className="w-6 h-6 text-white" />,
};

const planAccents: Record<PlanType, string> = {
  guest: "from-slate-400 to-zinc-500",
  free: "from-sky-400 to-blue-500",
  paid: "from-amber-400 to-orange-500",
};

interface PlanCardProps {
  planKey: PlanType;
  isCurrentPlan: boolean;
  user: any;
  navigate: (path: string) => void;
}

const PlanCard = ({ planKey, isCurrentPlan, user, navigate }: PlanCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const isPro = planKey === 'paid';
  const limits = PLAN_LIMITS[planKey];

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative rounded-2xl p-[1px] transition-all duration-500 ${isPro ? "md:-mt-4 md:mb-[-16px]" : ""}`}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: isPro
            ? `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(43 90% 55% / 0.5), hsl(35 80% 50% / 0.3), transparent 40%)`
            : `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent 40%)`,
        }}
      />

      {/* Spotlight */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, ${isPro ? "hsl(43 90% 55% / 0.08)" : "hsl(var(--primary) / 0.08)"}, transparent 60%)`,
          }}
        />
      )}

      {/* Pro badge */}
      {isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-xs font-bold text-white shadow-lg">
          POPULAR
        </div>
      )}

      {/* Card content */}
      <div className={`relative flex flex-col p-6 sm:p-7 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500 h-full ${isPro ? "sm:py-8" : ""}`}>
        {/* Icon */}
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${planAccents[planKey]} flex items-center justify-center mb-4 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}>
          {planIcons[planKey]}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${planAccents[planKey]} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
        </div>

        <h3 className="text-2xl font-bold text-foreground mb-1 tracking-tight">{limits.label}</h3>
        <p className="text-sm text-muted-foreground mb-6">{limits.description}</p>

        {/* Price */}
        <div className="mb-6">
          {planKey === 'guest' && (
            <div className="text-3xl font-bold text-foreground">Free</div>
          )}
          {planKey === 'free' && (
            <div className="text-3xl font-bold text-foreground">$0 <span className="text-base font-normal text-muted-foreground">/ forever</span></div>
          )}
          {planKey === 'paid' && (
            <div>
              <div className="text-3xl font-bold text-foreground">$1 <span className="text-base font-normal text-muted-foreground">/ month</span></div>
              <div className="text-sm text-muted-foreground mt-1">or $10 lifetime</div>
            </div>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-8 flex-1">
          {features.map((feature) => {
            const value = feature[planKey as 'guest' | 'free' | 'paid'];
            const isBoolean = typeof value === "boolean";
            return (
              <li key={feature.label} className="flex items-center gap-3 text-sm">
                {isBoolean ? (
                  value ? (
                    <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted/30 flex items-center justify-center shrink-0">
                      <X className="w-3 h-3 text-muted-foreground/40" />
                    </div>
                  )
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-primary" />
                  </div>
                )}
                <span className={isBoolean && !value ? "text-muted-foreground/50" : "text-foreground/80"}>
                  {isBoolean ? feature.label : `${value} ${feature.label.toLowerCase()}`}
                </span>
              </li>
            );
          })}
        </ul>

        {/* CTA */}
        {isCurrentPlan ? (
          <Button className="w-full rounded-xl h-11" variant="outline" disabled>
            Current Plan
          </Button>
        ) : planKey === 'guest' ? (
          <Button className="w-full rounded-xl h-11" variant="outline" onClick={() => navigate("/")}>
            Continue as Guest
          </Button>
        ) : planKey === 'free' ? (
          <Button className="relative w-full rounded-xl h-11 overflow-hidden group/btn" onClick={() => navigate("/auth")}>
            <div className="absolute inset-0 gradient-bg" />
            <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)", animation: "shimmerSlide 2s infinite" }} />
            <span className="relative z-10 text-primary-foreground font-semibold">Sign Up Free</span>
          </Button>
        ) : (
          <div className="space-y-2">
            <Button
              className="relative w-full rounded-xl h-11 overflow-hidden group/btn"
              onClick={() => { if (!user) navigate("/auth"); else navigate("/checkout?plan=monthly"); }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500" />
              <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)", animation: "shimmerSlide 2s infinite" }} />
              <span className="relative z-10 text-white font-semibold">$1/month</span>
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl h-11 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all duration-300"
              onClick={() => { if (!user) navigate("/auth"); else navigate("/checkout?plan=lifetime"); }}
            >
              $10 Lifetime
            </Button>
          </div>
        )}

        {/* Bottom shine line */}
        <div className="mt-5 h-[1px] w-full overflow-hidden rounded-full">
          <div
            className="h-full w-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-full"
            style={{ background: `linear-gradient(90deg, transparent, ${isPro ? "hsl(43 90% 55% / 0.6)" : "hsl(var(--primary) / 0.6)"}, transparent)` }}
          />
        </div>
      </div>
    </div>
  );
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { plan: currentPlan, user } = useAuth();
  const plans: PlanType[] = ['guest', 'free', 'paid'];

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-20" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/8 dark:bg-primary/15 blur-[150px] animate-float" />
        <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/6 dark:bg-accent/12 blur-[130px] animate-float" style={{ animationDelay: "-3s" }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-primary/4 dark:bg-primary/8 blur-[180px] animate-pulse-slow" />
      </div>
      <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 container px-4 py-8 sm:py-16 max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Simple Pricing
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4 tracking-tight">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more power
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mb-12 items-start">
          {plans.map((planKey, index) => (
            <div key={planKey} className="animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <PlanCard
                planKey={planKey}
                isCurrentPlan={currentPlan === planKey}
                user={user}
                navigate={navigate}
              />
            </div>
          ))}
        </div>

        {/* Coupon link */}
        <div className="text-center mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <Button variant="link" asChild className="gap-2 text-primary">
            <Link to="/redeem"><Ticket className="w-4 h-4" /> Have a coupon code? Redeem here</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
