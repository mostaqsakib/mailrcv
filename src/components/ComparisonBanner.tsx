import { useRef, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, ArrowRight } from "lucide-react";

const comparisons = [
  { feature: "Inboxes", guest: "5", free: "10", paid: "Unlimited" },
  { feature: "Emails / inbox", guest: "10", free: "50", paid: "Unlimited" },
  { feature: "Retention", guest: "24h", free: "7 days", paid: "Forever" },
  { feature: "Password protection", guest: false, free: true, paid: true },
  { feature: "Custom domains", guest: false, free: false, paid: true },
  { feature: "Email forwarding", guest: false, free: true, paid: true },
  { feature: "Bulk generate", guest: false, free: false, paid: true },
  { feature: "Priority support", guest: false, free: false, paid: true },
];

const CellValue = ({ value }: { value: string | boolean }) => {
  if (typeof value === "boolean") {
    return value ? (
      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center mx-auto">
        <Check className="w-3.5 h-3.5 text-primary" />
      </div>
    ) : (
      <div className="w-6 h-6 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
        <X className="w-3.5 h-3.5 text-muted-foreground/30" />
      </div>
    );
  }
  return <span className="font-semibold text-foreground text-sm">{value}</span>;
};

export const ComparisonBanner = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <section className="py-12 sm:py-20 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/5 blur-[200px] rounded-full pointer-events-none" />

      <div className="container relative z-10 px-4 max-w-4xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
            <Crown className="w-3.5 h-3.5 text-amber-400" />
            Compare Plans
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-3">
            Why Go <span className="gradient-text">Pro</span>?
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See what you get with each plan — and why Pro is worth every penny
          </p>
        </div>

        {/* Comparison table card */}
        <div
          ref={sectionRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in"
          style={{ animationDelay: "0.15s" }}
        >
          {/* Dynamic border */}
          <div
            className="absolute inset-0 rounded-2xl opacity-30 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(43 90% 55% / 0.4), hsl(var(--primary) / 0.3), hsl(var(--accent) / 0.2), transparent 50%)`,
            }}
          />

          {/* Spotlight */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
              style={{
                background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, hsl(43 90% 55% / 0.06), transparent 60%)`,
              }}
            />
          )}

          <div className="relative rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500 overflow-hidden">
            {/* Table header */}
            <div className="grid grid-cols-4 gap-0 border-b border-border/30">
              <div className="p-4 sm:p-5" />
              <div className="p-4 sm:p-5 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Guest</p>
                <p className="text-lg font-bold text-foreground mt-0.5">Free</p>
              </div>
              <div className="p-4 sm:p-5 text-center">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Free</p>
                <p className="text-lg font-bold text-foreground mt-0.5">$0</p>
              </div>
              <div className="p-4 sm:p-5 text-center relative">
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.06] to-transparent pointer-events-none" />
                <p className="relative text-xs font-medium text-amber-400 uppercase tracking-wider">Pro</p>
                <p className="relative text-lg font-bold text-foreground mt-0.5">$1<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
              </div>
            </div>

            {/* Table rows */}
            {comparisons.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-4 gap-0 items-center transition-colors hover:bg-primary/[0.02] ${
                  i < comparisons.length - 1 ? "border-b border-border/20" : ""
                }`}
              >
                <div className="p-3 sm:p-4 text-sm text-muted-foreground font-medium">{row.feature}</div>
                <div className="p-3 sm:p-4 text-center"><CellValue value={row.guest} /></div>
                <div className="p-3 sm:p-4 text-center"><CellValue value={row.free} /></div>
                <div className="p-3 sm:p-4 text-center relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/[0.03] to-transparent pointer-events-none" />
                  <span className="relative"><CellValue value={row.paid} /></span>
                </div>
              </div>
            ))}

            {/* CTA row */}
            <div className="grid grid-cols-4 gap-0 items-center border-t border-border/30 bg-gradient-to-r from-transparent via-amber-500/[0.03] to-transparent">
              <div className="p-4 sm:p-5 col-span-2 sm:col-span-3">
                <p className="text-sm font-medium text-foreground">Unlock everything for just <span className="text-amber-400 font-bold">$1/month</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">or $10 for lifetime access</p>
              </div>
              <div className="p-4 sm:p-5 col-span-2 sm:col-span-1 flex justify-end">
                <Button
                  asChild
                  size="sm"
                  className="relative overflow-hidden rounded-full px-5 group/btn"
                >
                  <Link to="/pricing">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500" />
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{
                      background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.2), transparent)",
                      animation: "shimmerSlide 2s infinite",
                    }} />
                    <span className="relative z-10 text-white font-semibold flex items-center gap-1.5">
                      Go Pro <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
