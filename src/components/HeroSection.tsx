import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Shield, Zap, Globe, Terminal } from "lucide-react";

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
      {/* Grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-40" />
      
      {/* Scanline effect */}
      <div className="absolute inset-0 scanline pointer-events-none" />
      
      {/* Animated orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-neon-green/10 blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-neon-pink/10 blur-[100px] animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-neon-blue/5 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full neon-border bg-card/50 mb-8">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="text-sm font-mono text-primary">NO SIGNUP • INSTANT • ANONYMOUS</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 tracking-tight">
            INSTANT EMAIL
            <span className="block gradient-text">FORWARDING</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-xl mx-auto font-light">
            Create disposable email addresses in seconds. 
            No password. No traces. Just pure anonymity.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-lg mx-auto mb-12">
            <div className="flex flex-col sm:flex-row gap-3 p-2 rounded-2xl neon-border bg-card/80 backdrop-blur-sm">
              <div className="flex-1 flex items-center bg-background/50 rounded-xl px-4 gap-2 border border-border/50">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <Input
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-primary"
                />
                <span className="text-muted-foreground font-mono shrink-0">@{domain}</span>
              </div>
              <Button type="submit" variant="hero" size="lg" className="shrink-0">
                OPEN INBOX
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl neon-border bg-card/50 backdrop-blur-sm group hover:shadow-neon-green transition-all duration-300">
              <Shield className="w-8 h-8 text-primary group-hover:animate-pulse" />
              <span className="font-semibold text-foreground">PRIVATE</span>
              <span className="text-xs text-muted-foreground font-mono">Zero registration</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl neon-border bg-card/50 backdrop-blur-sm group hover:shadow-neon-pink transition-all duration-300">
              <Zap className="w-8 h-8 text-accent group-hover:animate-pulse" />
              <span className="font-semibold text-foreground">INSTANT</span>
              <span className="text-xs text-muted-foreground font-mono">Ready in 0.1s</span>
            </div>
            <div className="flex flex-col items-center gap-3 p-5 rounded-xl neon-border bg-card/50 backdrop-blur-sm group hover:shadow-neon-green transition-all duration-300">
              <Globe className="w-8 h-8 text-neon-blue group-hover:animate-pulse" />
              <span className="font-semibold text-foreground">CUSTOM</span>
              <span className="text-xs text-muted-foreground font-mono">Your domain</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
