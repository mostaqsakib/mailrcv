import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mail, Shield, Zap, Crown, ArrowRight, Sparkles } from "lucide-react";

const ONBOARDING_KEY = "mailrcv_onboarding_seen";

const steps = [
  {
    icon: Sparkles,
    title: "Welcome to MailRCV! 🎉",
    description: "Your privacy-first disposable email service. Let's show you around!",
    accent: "from-primary to-accent",
  },
  {
    icon: Mail,
    title: "Create Instant Inboxes",
    description: "Just pick a username — no forms, no wait. Your temporary inbox is ready in seconds.",
    accent: "from-sky-400 to-blue-500",
  },
  {
    icon: Shield,
    title: "Password Protection",
    description: "Lock your inbox with a password so only you can access it. Your emails, your rules.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    icon: Crown,
    title: "Go Pro for $1/mo",
    description: "Unlimited inboxes, custom domains, bulk generation, and permanent email storage. Upgrade anytime!",
    accent: "from-amber-400 to-orange-500",
  },
];

export const WelcomeOnboarding = () => {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(ONBOARDING_KEY);
    if (!seen) {
      // Small delay so the page loads first
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleClose();
    }
  };

  const step = steps[currentStep];
  const Icon = step.icon;
  const isLast = currentStep === steps.length - 1;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-2xl border-border/50 rounded-2xl">
        <DialogHeader className="text-center items-center pt-2">
          {/* Progress dots */}
          <div className="flex gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentStep ? "w-8 bg-primary" : i < currentStep ? "w-4 bg-primary/40" : "w-4 bg-muted/40"
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>

          <DialogTitle className="text-xl font-bold text-center">{step.title}</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground leading-relaxed mt-2">
            {step.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 mt-4">
          {currentStep > 0 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => prev - 1)}
              className="flex-1 rounded-xl"
            >
              Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            className="flex-1 relative overflow-hidden rounded-xl group/btn"
          >
            <div className="absolute inset-0 gradient-bg" />
            <span className="relative z-10 text-primary-foreground flex items-center gap-2">
              {isLast ? "Get Started" : "Next"}
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
            </span>
          </Button>
        </div>

        {currentStep === 0 && (
          <button
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center mt-1"
          >
            Skip tour
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};
