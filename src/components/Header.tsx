import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center shadow-neon-green group-hover:animate-glow transition-all">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-wider">MAILFLY</span>
          </Link>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="hidden sm:flex font-mono">
              <Github className="w-4 h-4 mr-2" />
              GITHUB
            </Button>
            <Button variant="neon" size="sm">
              GET STARTED
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};
