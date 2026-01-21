import { Mail, Github, Twitter } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="py-14 bg-card/50 border-t border-border relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-40 bg-primary/5 blur-[100px]" />
      
      <div className="container px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">MailFly</span>
          </Link>
          
          <nav className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">Features</a>
            <a href="#" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#" className="hover:text-primary transition-colors">API</a>
            <a href="#" className="hover:text-primary transition-colors">Privacy</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover:glow transition-all">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="w-10 h-10 rounded-xl glass flex items-center justify-center text-muted-foreground hover:text-primary hover:glow transition-all">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-10 pt-8 border-t border-border/50 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 MailFly. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
