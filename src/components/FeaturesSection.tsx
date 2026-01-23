import { 
  Shield, 
  Zap, 
  RefreshCw, 
  Bell
} from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Privacy First",
    description: "No registration, no passwords. Your identity stays protected while you receive emails.",
  },
  {
    icon: Zap,
    title: "Instant Setup",
    description: "Create a new email address in seconds. Start receiving emails immediately.",
  },
  {
    icon: RefreshCw,
    title: "Forward Anywhere",
    description: "Automatically forward incoming emails to your real inbox instantly.",
  },
  {
    icon: Bell,
    title: "Real-time Updates",
    description: "Get instant notifications when new emails arrive in your inbox.",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="pt-10 pb-8 sm:pt-28 sm:pb-12 bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 blur-[150px] rounded-full" />
      
      <div className="container relative z-10 px-4">
        <div className="text-center max-w-2xl mx-auto mb-16 animate-fade-in">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6">
            Everything you need for
            <span className="gradient-text"> disposable emails</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Protect your privacy while staying connected. Our features make email forwarding simple and secure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-7 rounded-2xl glass hover:glow transition-all duration-300 animate-slide-up flex flex-col"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed flex-1">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
