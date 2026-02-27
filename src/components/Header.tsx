import { Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";

export const Header = () => {
  return (
    <header className="absolute top-0 left-0 right-0 z-50 pt-safe">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <nav className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl glass">
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
              <Mail className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-base sm:text-lg font-semibold">MailRCV</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/bulk" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-secondary/60">
              Bulk Generate
            </Link>
            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
};
