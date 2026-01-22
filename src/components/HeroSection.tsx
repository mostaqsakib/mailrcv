import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, Shuffle } from "lucide-react";

// Random word generator for fun email names
const adjectives = ["swift", "cosmic", "stellar", "pixel", "cyber", "neon", "turbo", "hyper", "ultra", "mega", "quantum", "ninja", "shadow", "thunder", "frost", "blaze", "storm", "vapor", "drift", "glitch"];
const nouns = ["fox", "wolf", "hawk", "tiger", "dragon", "phoenix", "raven", "falcon", "cobra", "viper", "panther", "lion", "eagle", "shark", "bear", "owl", "lynx", "puma", "jaguar", "leopard"];

const generateRandomName = () => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 99) + 1;
  return `${adj}${noun}${num}`;
};

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

  const handleRandomGenerate = () => {
    setUsername(generateRandomName());
  };

  return (
    <section className="relative sm:min-h-screen flex items-start sm:items-center justify-center hero-gradient overflow-hidden pt-14 sm:pt-20 pb-0 sm:py-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-50" />
      
      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
      </div>

      <div className="container relative z-10 px-4 py-4 sm:py-20">
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
            <div className="flex flex-col gap-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-b from-background/80 to-background/40 backdrop-blur-xl border border-primary/20 shadow-[0_0_40px_-10px] shadow-primary/30">
              {/* Input row with random button */}
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center bg-background/60 rounded-xl px-4 py-3.5 gap-3 border border-border/40 hover:border-primary/40 transition-colors focus-within:border-primary/60 focus-within:shadow-[0_0_20px_-5px] focus-within:shadow-primary/20">
                  <Mail className="w-5 h-5 text-primary shrink-0" />
                  <Input
                    type="text"
                    placeholder="enter-name"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-base text-foreground placeholder:text-muted-foreground/60 min-w-0"
                  />
                  <span className="text-muted-foreground/80 font-mono text-sm shrink-0 hidden sm:block">@{domain}</span>
                </div>
                
                {/* Random generate button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleRandomGenerate}
                  className="h-[52px] w-[52px] shrink-0 rounded-xl border-primary/30 bg-primary/5 hover:bg-primary/15 hover:border-primary/50 transition-all duration-300 group"
                  title="Generate random name"
                >
                  <Shuffle className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
                </Button>
              </div>

              {/* Domain display for mobile */}
              <div className="sm:hidden text-center">
                <span className="text-muted-foreground/70 font-mono text-sm">
                  {username || "your-name"}@{domain}
                </span>
              </div>

              {/* Submit button */}
              <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-12 text-base font-semibold">
                Open Inbox
                <ArrowRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </form>

          {/* Hint text */}
          <p className="mt-4 text-xs sm:text-sm text-muted-foreground/60">
            💡 Click the <Shuffle className="inline w-3.5 h-3.5 mx-0.5" /> button for a random name
          </p>
        </div>
      </div>
    </section>
  );
};
