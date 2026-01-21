import { Mail, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <nav className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl glass">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-semibold">MailRCV</span>
          </Link>

          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <Github className="w-4 h-4 mr-2" />
            GitHub
          </Button>
        </nav>
      </div>
    </header>
  );
};
