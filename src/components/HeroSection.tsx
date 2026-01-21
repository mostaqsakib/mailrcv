import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight } from "lucide-react";

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
    <section className="relative min-h-[calc(100vh-80px)] sm:min-h-screen flex items-center justify-center hero-gradient overflow-hidden pt-16 sm:pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-50" />
      
      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 px-4 py-10 sm:py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass mb-6 sm:mb-10">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-foreground/80">No signup required • Instant forwarding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight">
            Instant Email
            <span className="block gradient-text">Forwarding</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
            Create disposable email addresses in seconds. 
            No password. No registration. Pure simplicity.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col gap-3 p-3 sm:p-4 rounded-2xl glass-strong glow">
              <div className="flex items-center bg-background/40 rounded-xl px-4 py-3 gap-2 border border-border/50">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <Input
                  type="text"
                  placeholder="your-name"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-foreground placeholder:text-muted-foreground min-w-0"
                />
                <span className="text-muted-foreground font-mono text-xs sm:text-sm shrink-0">@{domain}</span>
              </div>
              <Button type="submit" variant="hero" size="lg" className="w-full">
                Open Inbox
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </form>

        </div>
      </div>
    </section>
  );
};
