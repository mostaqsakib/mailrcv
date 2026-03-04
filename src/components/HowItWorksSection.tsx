import { Mail, Inbox, Eye } from "lucide-react";
import { ScrollReveal } from "./ScrollReveal";

const steps = [
  {
    icon: Mail,
    step: "01",
    title: "Create Inbox",
    description: "Pick any name and get a disposable email instantly. No signup needed.",
    accent: "from-sky-400 to-blue-500",
  },
  {
    icon: Inbox,
    step: "02",
    title: "Receive Emails",
    description: "Use your temp email anywhere. All incoming mail appears in real-time.",
    accent: "from-emerald-400 to-teal-500",
  },
  {
    icon: Eye,
    step: "03",
    title: "Read Securely",
    description: "View your emails privately. No tracking, no logs, total anonymity.",
    accent: "from-violet-400 to-purple-500",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-12 sm:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-15" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/5 blur-[200px] rounded-full" />

      <div className="container relative z-10 px-4">
        <ScrollReveal>
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
              How It Works
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Three simple <span className="gradient-text">steps</span>
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Get started in seconds — no registration, no hassle.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2 pointer-events-none" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <ScrollReveal key={step.step} delay={index * 0.15}>
                <div className="group relative text-center p-8 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/50 hover:border-primary/30 transition-all duration-500">
                  {/* Step number */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-card border border-border/60 text-xs font-bold text-primary">
                    Step {step.step}
                  </div>

                  {/* Icon */}
                  <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500`}>
                    <Icon className="w-8 h-8 text-white" strokeWidth={1.5} />
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${step.accent} opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500`} />
                  </div>

                  <h3 className="text-xl font-bold mb-2 text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};
