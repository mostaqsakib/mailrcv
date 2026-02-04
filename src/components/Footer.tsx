import { Mail, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="py-8 bg-background relative overflow-hidden">
      {/* Subtle gradient glow */}
      <div className="absolute top-0 right-1/4 w-[400px] h-32 bg-primary/5 blur-[100px] rounded-full" />
      
      <div className="container px-4 relative z-10">
        {/* Telegram CTA Card */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground">Join our Telegram</h4>
              <p className="text-sm text-muted-foreground">Get updates & announcements</p>
            </div>
          </div>
          <Button
            asChild
            className="gap-2 px-6 rounded-lg gradient-bg hover:opacity-90 transition-opacity"
          >
            <a href="https://t.me/MailRCV" target="_blank" rel="noopener noreferrer">
              <Send className="w-4 h-4" />
              <span>Join Now</span>
            </a>
          </Button>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            © 2026 MailRCV. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
