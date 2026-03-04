import { useState, useRef, useCallback } from "react";
import { 
  Shield, 
  Zap, 
  Lock, 
  Globe,
  Bell,
  Layers,
  type LucideIcon
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Inbox",
    description: "Create a disposable email in seconds. No signup needed — just pick a name and start receiving.",
    accent: "from-amber-400 to-orange-500",
    glowColor: "amber",
  },
  {
    icon: Lock,
    title: "Password Protected",
    description: "Secure your inbox with a password so only you can access it. Available on Free & Pro plans.",
    accent: "from-emerald-400 to-teal-500",
    glowColor: "emerald",
  },
  {
    icon: Shield,
    title: "Privacy First",
    description: "No personal data collected. Your temporary inbox auto-expires based on your plan.",
    accent: "from-sky-400 to-blue-500",
    glowColor: "sky",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Use your own domain for professional disposable emails. Exclusive to Pro plan users.",
    accent: "from-violet-400 to-purple-500",
    glowColor: "violet",
  },
  {
    icon: Layers,
    title: "Bulk Generate",
    description: "Generate up to 500 disposable emails at once with export to CSV. Pro plan exclusive.",
    accent: "from-rose-400 to-pink-500",
    glowColor: "rose",
  },
  {
    icon: Bell,
    title: "Real-time Updates",
    description: "Get instant push notifications when new emails arrive. Never miss an important message.",
    accent: "from-cyan-400 to-teal-500",
    glowColor: "cyan",
  },
];

interface FeatureCardProps {
  feature: typeof features[0];
  index: number;
}

const FeatureCard = ({ feature, index }: FeatureCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const Icon = feature.icon;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-slide-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      {/* Animated gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from ${isHovered ? mousePos.x : 0}deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.6), hsl(var(--accent) / 0.4), transparent 40%)`,
        }}
      />

      {/* Spotlight effect */}
      {isHovered && (
        <div
          className="absolute inset-0 rounded-2xl opacity-60 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)`,
          }}
        />
      )}

      {/* Card content */}
      <div className="relative rounded-2xl p-7 h-full flex flex-col bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500">
        {/* Icon with gradient bg */}
        <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${feature.accent} flex items-center justify-center mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}>
          <Icon className="w-6 h-6 text-white" strokeWidth={2} />
          {/* Icon glow */}
          <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${feature.accent} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
        </div>

        <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-foreground transition-colors">
          {feature.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed flex-1">
          {feature.description}
        </p>

        {/* Bottom shine line */}
        <div className="mt-5 h-[1px] w-full overflow-hidden rounded-full">
          <div
            className="h-full w-1/2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-700 group-hover:translate-x-full"
            style={{
              background: `linear-gradient(90deg, transparent, hsl(var(--primary) / 0.6), transparent)`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export const FeaturesSection = () => {
  return (
    <section className="pt-10 pb-8 sm:pt-28 sm:pb-12 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[200px] rounded-full" />

      <div className="container relative z-10 px-4">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Core Features
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            Everything you need for
            <span className="gradient-text"> disposable emails</span>
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Protect your privacy while staying connected. Our features make email forwarding simple and secure.
          </p>
        </div>

        {/* Bento-style grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};
