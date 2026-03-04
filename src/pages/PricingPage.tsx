import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft, Zap, Shield, Crown, Mail } from "lucide-react";
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
  guest: <Mail className="w-6 h-6" />,
  free: <Shield className="w-6 h-6" />,
  paid: <Crown className="w-6 h-6" />,
};

const planColors: Record<PlanType, string> = {
  guest: "from-muted-foreground/20 to-muted/20",
  free: "from-primary/20 to-accent/20",
  paid: "from-yellow-500/20 to-orange-500/20",
};

const planBorders: Record<PlanType, string> = {
  guest: "border-border/50",
  free: "border-primary/30",
  paid: "border-yellow-500/30",
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { plan: currentPlan, user } = useAuth();

  const plans: PlanType[] = ['guest', 'free', 'paid'];

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-50" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 container px-4 py-8 sm:py-16 max-w-5xl mx-auto">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Simple Pricing</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-4">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Start free, upgrade when you need more power
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((planKey) => {
            const limits = PLAN_LIMITS[planKey];
            const isCurrentPlan = currentPlan === planKey;
            const isPro = planKey === 'paid';

            return (
              <div
                key={planKey}
                className={`relative flex flex-col p-6 rounded-2xl glass-strong border ${planBorders[planKey]} ${
                  isPro ? "ring-2 ring-yellow-500/30 shadow-[0_0_40px_-10px] shadow-yellow-500/20" : ""
                } transition-all duration-300 hover:scale-[1.02]`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-xs font-bold text-white">
                    POPULAR
                  </div>
                )}

                {/* Plan header */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${planColors[planKey]} flex items-center justify-center mb-4`}>
                  {planIcons[planKey]}
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{limits.label}</h3>
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
                      <div className="text-3xl font-bold text-foreground">$4.99 <span className="text-base font-normal text-muted-foreground">/ month</span></div>
                      <div className="text-sm text-muted-foreground mt-1">or $29.99 lifetime</div>
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
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                          )
                        ) : (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                        <span className={isBoolean && !value ? "text-muted-foreground/60" : "text-foreground/80"}>
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
                  <Button
                    className="w-full rounded-xl h-11"
                    variant="outline"
                    onClick={() => navigate("/")}
                  >
                    Continue as Guest
                  </Button>
                ) : planKey === 'free' ? (
                  <Button
                    className="w-full rounded-xl h-11 gradient-bg text-primary-foreground"
                    onClick={() => navigate("/auth")}
                  >
                    Sign Up Free
                  </Button>
                ) : (
                  <Button
                    className="w-full rounded-xl h-11 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                    onClick={() => {
                      if (!user) {
                        navigate("/auth");
                      } else {
                        // TODO: Payment integration
                        navigate("/pricing");
                      }
                    }}
                  >
                    Upgrade to Pro
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
