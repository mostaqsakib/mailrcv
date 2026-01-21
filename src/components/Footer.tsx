import { Mail, Github, Twitter } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="py-12 bg-card border-t border-border relative overflow-hidden">
      {/* Subtle glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-primary/5 blur-[100px]" />
      
      <div className="container px-4 relative z-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-neon-green">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-wider">MAILFLY</span>
          </div>
          
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground font-mono">
            <a href="#" className="hover:text-primary transition-colors">FEATURES</a>
            <a href="#" className="hover:text-primary transition-colors">PRICING</a>
            <a href="#" className="hover:text-primary transition-colors">API</a>
            <a href="#" className="hover:text-primary transition-colors">PRIVACY</a>
          </nav>

          <div className="flex items-center gap-4">
            <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
              <Github className="w-5 h-5" />
            </a>
            <a href="#" className="text-muted-foreground hover:text-accent transition-colors">
              <Twitter className="w-5 h-5" />
            </a>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted-foreground font-mono">
            © 2024 MAILFLY. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </footer>
  );
};
