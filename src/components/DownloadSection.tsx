import { useState, useRef, useCallback } from "react";
import { Smartphone, Download, Bell, Zap, Shield } from "lucide-react";

export const DownloadSection = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 blur-[180px] rounded-full" />

      <div className="container px-4 relative z-10">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 bg-card/50 backdrop-blur-sm text-xs font-medium text-muted-foreground mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
            Mobile App
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            Get the <span className="gradient-text">Mobile App</span>
          </h2>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Main card with interactive border */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative rounded-3xl p-[1px] transition-all duration-500"
          >
            {/* Animated gradient border */}
            <div
              className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent 40%)`,
              }}
            />

            {/* Spotlight */}
            {isHovered && (
              <div
                className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none"
                style={{
                  background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)`,
                }}
              />
            )}

            <div className="relative rounded-3xl p-8 sm:p-12 bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500 overflow-hidden">
              {/* Inner glows */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/10 blur-[80px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                {/* Left: Content */}
                <div className="flex-1 text-center lg:text-left">
                  <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto lg:mx-0">
                    Never miss an email. Get instant push notifications directly on your phone.
                  </p>

                  {/* Feature pills */}
                  <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                    {[
                      { icon: Bell, label: "Push Notifications" },
                      { icon: Zap, label: "Instant Alerts" },
                      { icon: Shield, label: "Secure & Private" },
                    ].map((f) => (
                      <div key={f.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/60 border border-border/50 text-sm text-muted-foreground">
                        <f.icon className="w-3.5 h-3.5 text-primary" />
                        <span>{f.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Download button */}
                  <a
                    href="/download"
                    className="relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl font-semibold text-lg text-primary-foreground overflow-hidden group/btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 gradient-bg" />
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)", animation: "shimmerSlide 2s infinite" }} />
                    <Download className="w-5 h-5 relative z-10 group-hover/btn:translate-y-0.5 transition-transform" />
                    <span className="relative z-10">Download APK</span>
                  </a>

                  <p className="mt-4 text-xs text-muted-foreground/60">
                    Free • No account required • 5MB
                  </p>
                </div>

                {/* Right: Phone mockup */}
                <div className="relative shrink-0">
                  <div className="w-48 h-80 sm:w-56 sm:h-96 rounded-[2.5rem] bg-gradient-to-b from-muted to-muted/50 border-2 border-border/60 shadow-2xl relative overflow-hidden group-hover:shadow-primary/10 transition-shadow duration-500">
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-background rounded-full" />
                    <div className="absolute inset-4 top-10 rounded-2xl bg-background overflow-hidden">
                      <div className="p-3 space-y-2">
                        <div className="text-[10px] text-muted-foreground text-center mb-3">MailRCV</div>
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 animate-pulse-slow">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">New Email!</div>
                              <div className="text-[10px] text-muted-foreground truncate">From: noreply@example.com</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                              <Bell className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-foreground truncate">Verification Code</div>
                              <div className="text-[10px] text-muted-foreground truncate">Your code: 847291</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full gradient-bg text-primary-foreground text-xs font-bold shadow-lg animate-bounce">
                    FREE
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
