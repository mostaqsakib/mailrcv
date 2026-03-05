import { useState, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = ({ showTelegram = false }: { showTelegram?: boolean }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <footer className="py-10 bg-background relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-40 bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container px-4 relative z-10">
        {showTelegram && (
          <div className="max-w-2xl mx-auto mb-10">
            <div
              ref={cardRef}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="group relative rounded-2xl p-[1px] transition-all duration-500"
            >
              <div
                className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.5), hsl(var(--accent) / 0.3), transparent 40%)`,
                }}
              />
              {isHovered && (
                <div
                  className="absolute inset-0 rounded-2xl opacity-50 pointer-events-none"
                  style={{
                    background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.08), transparent 60%)`,
                  }}
                />
              )}
              <div className="relative rounded-2xl p-5 sm:p-6 bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-500">
                    <Send className="w-5 h-5 text-white" />
                    <div className="absolute w-11 h-11 rounded-xl bg-gradient-to-br from-sky-400 to-blue-500 opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">Join our Telegram</h4>
                    <p className="text-sm text-muted-foreground">Get updates & announcements</p>
                  </div>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="relative gap-2 px-5 rounded-full overflow-hidden group/btn"
                  variant="hero"
                >
                  <a href="https://t.me/MailRCV" target="_blank" rel="noopener noreferrer">
                    <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)", animation: "shimmerSlide 2s infinite" }} />
                    <Send className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Join Now</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/30">
          <p className="text-sm text-muted-foreground">
            © 2026 MailRCV. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
              Privacy
            </Link>
            <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-300">
              Terms
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
