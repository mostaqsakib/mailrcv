import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Shield, Zap, Globe } from "lucide-react";

export const HeroSection = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const domain = "mailrcv.site";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/inbox/${username.trim().toLowerCase()}`);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center hero-gradient overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-50" />
      
      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass mb-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-foreground/80">No signup required • Instant forwarding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight leading-tight">
            Instant Email
            <span className="block gradient-text">Forwarding</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-12 max-w-xl mx-auto leading-relaxed">
            Create disposable email addresses in seconds. 
            No password. No registration. Pure simplicity.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-16">
            <div className="flex flex-col sm:flex-row gap-3 p-3 rounded-2xl glass-strong glow">
              <div className="flex-1 flex items-center bg-background/40 rounded-xl px-4 gap-3 border border-border/50">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <Input
                  type="text"
                  placeholder="your-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-foreground placeholder:text-muted-foreground"
                />
                <span className="text-muted-foreground font-mono text-sm shrink-0">@{domain}</span>
              </div>
              <Button type="submit" variant="hero" size="lg" className="shrink-0">
                Open Inbox
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
            {[
              { icon: Shield, title: "Private", desc: "No signup needed" },
              { icon: Zap, title: "Instant", desc: "Ready in seconds" },
              { icon: Globe, title: "Custom Domain", desc: "Use your own" },
            ].map((feature, i) => (
              <div 
                key={feature.title}
                className="flex flex-col items-center gap-3 p-6 rounded-2xl glass group hover:glow transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <span className="font-semibold text-foreground">{feature.title}</span>
                <span className="text-sm text-muted-foreground">{feature.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
