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
    title: "PRIVACY FIRST",
    description: "No registration, no passwords. Your identity stays protected while you receive emails.",
    glow: "group-hover:shadow-neon-green",
  },
  {
    icon: Zap,
    title: "INSTANT SETUP",
    description: "Create a new email address in seconds. Start receiving emails immediately.",
    glow: "group-hover:shadow-neon-pink",
  },
  {
    icon: Globe,
    title: "CUSTOM DOMAINS",
    description: "Use your own domain for professional-looking disposable addresses.",
    glow: "group-hover:shadow-neon-green",
  },
  {
    icon: Lock,
    title: "AUTO-EXPIRE",
    description: "Emails automatically expire after 24 hours, keeping your inbox clean.",
    glow: "group-hover:shadow-neon-pink",
  },
  {
    icon: RefreshCw,
    title: "FORWARD ANYWHERE",
    description: "Automatically forward incoming emails to your real inbox instantly.",
    glow: "group-hover:shadow-neon-green",
  },
  {
    icon: Bell,
    title: "REAL-TIME",
    description: "Get instant notifications when new emails arrive in your inbox.",
    glow: "group-hover:shadow-neon-pink",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Glow effects */}
      <div className="absolute top-1/2 left-0 w-96 h-96 rounded-full bg-neon-green/5 blur-[150px]" />
      <div className="absolute top-1/2 right-0 w-96 h-96 rounded-full bg-neon-pink/5 blur-[150px]" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            EVERYTHING FOR
            <span className="gradient-text"> DISPOSABLE EMAILS</span>
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            Protect your privacy while staying connected. Advanced features for the modern age.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group p-6 rounded-2xl neon-border bg-card/50 backdrop-blur-sm hover:bg-card transition-all duration-300 ${feature.glow} animate-slide-up`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-2 tracking-wide">{feature.title}</h3>
              <p className="text-muted-foreground text-sm font-light">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button variant="hero" size="lg">
            GET STARTED FREE
            <ArrowRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
