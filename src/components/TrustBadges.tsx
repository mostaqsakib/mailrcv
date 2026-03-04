import { Shield, Clock, UserX, Zap, Eye, Server } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const badges = [
  { icon: UserX, label: "No Signup Needed", color: "text-sky-400" },
  { icon: Shield, label: "100% Private", color: "text-emerald-400" },
  { icon: Clock, label: "Open 24/7", color: "text-amber-400" },
  { icon: Zap, label: "Instant Delivery", color: "text-violet-400" },
  { icon: Eye, label: "Zero Tracking", color: "text-rose-400" },
  { icon: Server, label: "99.9% Uptime", color: "text-cyan-400" },
];

export const TrustBadges = () => {
  return (
    <section className="py-8 sm:py-12 bg-background relative overflow-hidden">
      <div className="container relative z-10 px-4">
        <ScrollReveal>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4 max-w-4xl mx-auto">
            {badges.map((badge, i) => {
              const Icon = badge.icon;
              return (
                <div
                  key={badge.label}
                  className="group flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-card/50 backdrop-blur-sm border border-border/40 hover:border-primary/30 hover:bg-card/80 transition-all duration-300 cursor-default"
                >
                  <Icon className={`w-4 h-4 ${badge.color} group-hover:scale-110 transition-transform duration-300`} />
                  <span className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    {badge.label}
                  </span>
                </div>
              );
            })}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
