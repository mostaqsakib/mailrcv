import { Mail, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const Footer = () => {
  return (
    <footer className="py-14 bg-card/50 border-t border-border relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/5 blur-[100px]" />
      
      <div className="container px-4 relative z-10">
        <div className="flex flex-col items-center gap-6">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MailRCV</span>
          </Link>

          {/* Contact Button */}
          <Button
            asChild
            variant="outline"
            className="gap-2 px-5 py-2 rounded-full border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
          >
            <a href="https://t.me/DigitalizAdmin" target="_blank" rel="noopener noreferrer">
              <Send className="w-4 h-4 text-primary" />
              <span>Contact on Telegram</span>
            </a>
          </Button>
          
          <p className="text-sm text-muted-foreground">
            © 2026 MailRCV. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
