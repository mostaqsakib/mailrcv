import { 
  Shield, 
  Zap, 
  Globe, 
  Lock, 
  RefreshCw, 
  Bell,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "No registration, no passwords. Your identity stays protected while you receive emails.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Create a new email address in seconds. Start receiving emails immediately.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: Globe,
    title: "Custom Domains",
    description: "Use your own domain for professional-looking disposable addresses.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Lock,
    title: "Auto-Expire",
    description: "Emails automatically expire after 24 hours, keeping your inbox clean.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
  {
    icon: RefreshCw,
    title: "Forward Anywhere",
    description: "Automatically forward incoming emails to your real inbox instantly.",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: Bell,
    title: "Real-time Updates",
    description: "Get instant notifications when new emails arrive in your inbox.",
    color: "text-accent",
    bg: "bg-accent/10",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-30" style={{ background: "var(--gradient-glow)" }} />
      
      <div className="container relative z-10 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Everything you need for
            <span className="gradient-text"> disposable emails</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Protect your privacy while staying connected. Our features make email forwarding simple and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-card animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
