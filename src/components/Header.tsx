import { useState, useRef, useCallback } from "react";
import { Mail, User, LogOut, Crown, ChevronDown, LayoutDashboard, Sparkles } from "lucide-react";
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
  const navRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <header className="absolute top-0 left-0 right-0 z-50 pt-safe">
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <nav
          ref={navRef}
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative rounded-xl sm:rounded-2xl p-[1px] transition-all duration-500"
        >
          {/* Animated gradient border */}
          <div
            className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{
              background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), transparent 40%)`,
            }}
          />

          {/* Spotlight effect */}
          {isHovered && (
            <div
              className="absolute inset-0 rounded-xl sm:rounded-2xl opacity-50 pointer-events-none"
              style={{
                background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.06), transparent 60%)`,
              }}
            />
          )}

          {/* Nav content */}
          <div className="relative flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 group-hover:border-transparent transition-all duration-500">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 sm:gap-3 group/logo">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl gradient-bg flex items-center justify-center group-hover/logo:scale-110 transition-all duration-300">
                <Mail className="w-4 h-4 text-primary-foreground" />
                <div className="absolute inset-0 rounded-lg sm:rounded-xl gradient-bg opacity-0 group-hover/logo:opacity-40 blur-xl transition-opacity duration-500" />
              </div>
              <span className="text-base sm:text-lg font-semibold tracking-tight">MailRCV</span>
            </Link>

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Pricing link */}
              <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground text-sm font-medium">
                <Link to="/pricing">Pricing</Link>
              </Button>

              {/* Bulk Generate - paid only */}
              {plan === 'paid' && (
                <Button variant="ghost" size="sm" asChild className="text-sm font-medium gap-1.5 text-muted-foreground hover:text-foreground">
                  <Link to="/bulk">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="hidden sm:inline">Bulk</span>
                  </Link>
                </Button>
              )}

              {/* Divider */}
              <div className="w-px h-5 bg-border/50 mx-1 hidden sm:block" />

              {!loading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 hover:bg-primary/5">
                        <div className="relative w-7 h-7 rounded-full gradient-bg flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="hidden sm:inline text-sm font-medium truncate max-w-[100px]">
                          {profile?.display_name || user.email?.split('@')[0]}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          plan === 'paid'
                            ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}>
                          {PLAN_LIMITS[plan].label}
                        </span>
                        <ChevronDown className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52 bg-popover/95 backdrop-blur-xl border border-border/60 shadow-xl rounded-xl p-1">
                      <div className="px-3 py-2">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        <p className="text-xs text-muted-foreground">{PLAN_LIMITS[plan].label} Plan</p>
                      </div>
                      <DropdownMenuSeparator className="bg-border/40" />
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link to="/dashboard" className="gap-2 cursor-pointer">
                          <LayoutDashboard className="w-4 h-4" /> My Inboxes
                        </Link>
                      </DropdownMenuItem>
                      {plan !== 'paid' && (
                        <DropdownMenuItem asChild className="rounded-lg">
                          <Link to="/pricing" className="gap-2 cursor-pointer">
                            <Crown className="w-4 h-4 text-amber-400" /> Upgrade
                          </Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator className="bg-border/40" />
                      <DropdownMenuItem onClick={() => signOut()} className="gap-2 text-destructive cursor-pointer rounded-lg">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button size="sm" asChild className="relative overflow-hidden group/signin rounded-full px-5">
                    <Link to="/auth">
                      <div className="absolute inset-0 gradient-bg" />
                      <div className="absolute inset-0 opacity-0 group-hover/signin:opacity-100 transition-opacity duration-500" style={{ background: "linear-gradient(90deg, transparent, hsl(0 0% 100% / 0.15), transparent)", animation: "shimmerSlide 2s infinite" }} />
                      <span className="relative z-10 text-primary-foreground font-semibold">Sign In</span>
                    </Link>
                  </Button>
                )
              )}

              <ThemeToggle />
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
