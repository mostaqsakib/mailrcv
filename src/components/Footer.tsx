import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="py-10 bg-background relative overflow-hidden">
      {/* Ambient glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-40 bg-primary/8 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="container px-4 relative z-10">
        {/* Telegram CTA Card - Centered with max-width */}
        <div className="max-w-2xl mx-auto mb-10">
          <div className="bg-card/80 backdrop-blur-sm border border-primary/20 rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
              {/* Left side with icon and text */}
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0">
                  <Send className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Join our Telegram</h4>
                  <p className="text-sm text-muted-foreground">Get updates & announcements</p>
                </div>
              </div>
              
              {/* Join button */}
              <Button
                asChild
                size="sm"
                className="gap-2 px-5 rounded-full gradient-bg hover:opacity-90 transition-all hover:scale-105 shadow-blue"
              >
                <a href="https://t.me/MailRCV" target="_blank" rel="noopener noreferrer">
                  <Send className="w-4 h-4" />
                  <span>Join Now</span>
                </a>
              </Button>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            © 2026 MailRCV. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
