import { Mail, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between px-5 py-3 rounded-2xl glass">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">MailFly</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/domains">
              <Button variant="ghost" size="sm">
                <Globe className="w-4 h-4 mr-2" />
                Domains
              </Button>
            </Link>
            <Button variant="ghost" size="sm" className="hidden sm:flex">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
            <Button variant="default" size="sm">
              Get Started
            </Button>
          </div>
        </nav>
      </div>
    </header>
  );
};
