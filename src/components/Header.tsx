import { Mail, User, LogOut, Crown, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const Header = () => {
  const { user, profile, plan, signOut, loading } = useAuth();

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
            <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-semibold shadow-sm hidden sm:inline-flex">
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="border-primary/50 text-primary hover:bg-primary/10 hover:border-primary font-semibold shadow-sm">
              <Link to="/bulk">Bulk Generate</Link>
            </Button>

            {!loading && (
              user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 px-3">
                      <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                      <span className="hidden sm:inline text-sm font-medium truncate max-w-[120px]">
                        {profile?.display_name || user.email?.split('@')[0]}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        plan === 'paid' 
                          ? 'bg-yellow-500/20 text-yellow-500' 
                          : 'bg-primary/20 text-primary'
                      }`}>
                        {PLAN_LIMITS[plan].label}
                      </span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{PLAN_LIMITS[plan].label} Plan</p>
                    </div>
                    <DropdownMenuSeparator />
                    {plan !== 'paid' && (
                      <DropdownMenuItem asChild>
                        <Link to="/pricing" className="gap-2 cursor-pointer">
                          <Crown className="w-4 h-4 text-yellow-500" /> Upgrade
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4" /> Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button size="sm" asChild className="gradient-bg text-primary-foreground font-semibold">
                  <Link to="/auth">Sign In</Link>
                </Button>
              )
            )}

            <ThemeToggle />
          </div>
        </nav>
      </div>
    </header>
  );
};
