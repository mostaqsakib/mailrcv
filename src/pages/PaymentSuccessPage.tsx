import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { CheckCircle, Crown, Sparkles, ArrowRight, Infinity, Calendar } from "lucide-react";
import { motion } from "framer-motion";

const Confetti = () => {
  const [particles] = useState(() =>
    Array.from({ length: 60 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2 + Math.random() * 3,
      size: 4 + Math.random() * 8,
      color: [
        "hsl(var(--primary))",
        "hsl(43 90% 55%)",
        "hsl(160 70% 50%)",
        "hsl(280 70% 60%)",
        "hsl(20 90% 60%)",
        "hsl(200 80% 60%)",
      ][Math.floor(Math.random() * 6)],
      shape: Math.random() > 0.5 ? "circle" : "rect",
      rotation: Math.random() * 360,
    }))
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: -20,
            width: p.shape === "circle" ? p.size : p.size * 0.6,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            rotate: p.rotation,
          }}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{
            y: typeof window !== "undefined" ? window.innerHeight + 50 : 900,
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotation + 360 * (Math.random() > 0.5 ? 1 : -1),
            x: (Math.random() - 0.5) * 200,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
          }}
        />
      ))}
    </div>
  );
};

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { refreshProfile, profile } = useAuth();
  const [showConfetti, setShowConfetti] = useState(true);

  const planType = searchParams.get("plan") || "monthly";
  const isLifetime = planType === "lifetime";

  useEffect(() => {
    refreshProfile();
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [refreshProfile]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-20 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/8 blur-[200px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/8 blur-[150px] pointer-events-none" />

      {showConfetti && <Confetti />}

      <div className="relative z-10 px-4 py-8 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center space-y-8"
        >
          {/* Success icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="relative mx-auto w-24 h-24"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              Payment Successful! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Your Pro plan is now active
            </p>
          </motion.div>

          {/* Plan card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative p-[1px] rounded-2xl overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/50 via-emerald-500/30 to-primary/50" />
            <div className="relative bg-card/95 backdrop-blur-xl rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <Crown className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-bold text-foreground">Pro Plan</span>
                <div className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20">
                  <span className="text-xs font-semibold text-emerald-500">ACTIVE</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                {isLifetime ? (
                  <>
                    <Infinity className="w-4 h-4 text-primary" />
                    <span>Lifetime Access — Never expires</span>
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>30 days — Renew anytime</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: "Inboxes", value: "Unlimited" },
                  { label: "Emails", value: "Unlimited" },
                  { label: "Retention", value: "Forever" },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-secondary/30">
                    <div className="text-sm font-bold text-foreground">{item.value}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-3"
          >
            <Button
              onClick={() => navigate("/dashboard")}
              className="w-full h-12 rounded-xl text-base font-semibold gap-2 relative overflow-hidden group"
              size="lg"
            >
              <div className="absolute inset-0 gradient-bg" />
              <span className="relative z-10 flex items-center gap-2 text-primary-foreground">
                <Sparkles className="w-4 h-4" />
                Go to Dashboard
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            </Button>

            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Create a new inbox
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
