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
      <div className="absolute inset-0 grid-dots opacity-50 dark:opacity-50" />
      
      {/* Glowing orbs - different for light/dark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        {/* Light mode extra gradient */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent dark:from-transparent pointer-events-none" />
      </div>

      <div className="container relative z-10 px-4 py-4 sm:py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass mb-6 sm:mb-10 shadow-sm dark:shadow-none">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-foreground/80">No signup required • Instant forwarding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight">
            Instant Email
            <span className="block gradient-text drop-shadow-sm">Forwarding</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
            Create disposable email addresses in seconds. 
            No password. No registration. Pure simplicity.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-card/90 dark:bg-gradient-to-b dark:from-background/80 dark:to-background/40 backdrop-blur-xl border border-border/40 dark:border-primary/20 shadow-2xl dark:shadow-[0_0_50px_-10px] dark:shadow-primary/40">
              {/* Input row with random button */}
              <div className="flex items-center gap-3">
                {/* Main input container */}
                <div className="flex-1 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-0 group-hover:opacity-30 group-focus-within:opacity-50 transition-opacity duration-300" />
                  <div className="relative flex items-center bg-background dark:bg-background/70 rounded-xl px-4 py-4 gap-3 border border-border/50 dark:border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-focus-within:border-primary group-focus-within:shadow-lg dark:group-focus-within:shadow-primary/30">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <Input
                      type="text"
                      placeholder="enter-name"
                      value={username}
                      onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ""))}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-lg font-medium text-foreground placeholder:text-muted-foreground/50 min-w-0 h-auto py-0"
                    />
                  </div>
                </div>
                
                {/* Random generate button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleRandomGenerate}
                  className="h-14 w-14 shrink-0 rounded-xl border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 transition-all duration-300 group hover:scale-105 active:scale-95"
                  title="Generate random name"
                >
                  <Shuffle className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
                </Button>
              </div>

              {/* Email preview */}
              <div className="flex items-center justify-center gap-1 py-3 px-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20">
                <span className="font-mono text-base sm:text-lg font-semibold text-foreground truncate">
                  {username || <span className="text-muted-foreground/50">your-name</span>}
                </span>
                <span className="font-mono text-base sm:text-lg font-semibold text-primary">@{domain}</span>
              </div>

              {/* Submit button */}
              <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl h-14 text-base font-semibold shadow-lg hover:shadow-xl dark:shadow-primary/20 dark:hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
                Open Inbox
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
