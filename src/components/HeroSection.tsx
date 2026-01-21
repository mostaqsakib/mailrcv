import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Shield, Zap, Globe } from "lucide-react";

export const HeroSection = () => {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const domain = "mailfly.io";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      navigate(`/inbox/${username.trim().toLowerCase()}`);
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center hero-gradient overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-accent/10 blur-3xl animate-pulse-slow" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-30" style={{ background: "var(--gradient-glow)" }} />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-effect mb-8">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-sm font-medium text-primary-foreground/90">No signup required • Instant forwarding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 tracking-tight">
            Instant Email
            <span className="block gradient-text">Forwarding</span>
          </h1>

          <p className="text-lg sm:text-xl text-primary-foreground/70 mb-10 max-w-xl mx-auto">
            Create disposable email addresses instantly. No password needed. 
            Forward to your real inbox with one click.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl glass-effect shadow-elevated">
              <div className="flex-1 flex items-center bg-card/50 rounded-xl px-4 gap-2">
                <Mail className="w-5 h-5 text-muted-foreground shrink-0" />
                <Input
                  type="text"
                  placeholder="your-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono"
                />
                <span className="text-muted-foreground font-mono shrink-0">@{domain}</span>
              </div>
              <Button type="submit" variant="hero" size="lg" className="shrink-0">
                Open Inbox
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl glass-effect">
              <Shield className="w-8 h-8 text-primary" />
              <span className="font-semibold text-primary-foreground">Private</span>
              <span className="text-sm text-primary-foreground/60">No signup required</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl glass-effect">
              <Zap className="w-8 h-8 text-accent" />
              <span className="font-semibold text-primary-foreground">Instant</span>
              <span className="text-sm text-primary-foreground/60">Ready in seconds</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-4 rounded-xl glass-effect">
              <Globe className="w-8 h-8 text-primary" />
              <span className="font-semibold text-primary-foreground">Custom Domain</span>
              <span className="text-sm text-primary-foreground/60">Use your own domain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
