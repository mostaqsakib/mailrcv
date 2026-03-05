import { useState, useRef, useCallback, forwardRef } from "react";
import { Mail, User, LogOut, Crown, ChevronDown, LayoutDashboard, Sparkles, Menu, X, CreditCard, Download, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { PLAN_LIMITS } from "@/lib/plan-limits";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "./ui/sheet";

const NavItem = forwardRef<HTMLAnchorElement, { to: string; children: React.ReactNode; active?: boolean }>(
  ({ to, children, active }, ref) => (
    <Link
      ref={ref}
      to={to}
      className={`relative text-sm font-medium transition-colors duration-300 px-3 py-1.5 rounded-lg ${
        active
          ? "text-foreground bg-primary/10"
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
      }`}
    >
      {children}
      {active && (
        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-primary" />
      )}
    </Link>
  )
);
NavItem.displayName = "NavItem";

export const Header = () => {
  const { user, profile, plan, signOut, loading } = useAuth();
  const navRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const location = useLocation();

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const MobileNavContent = () => (
    <div className="flex flex-col gap-1 pt-2">
      {user && (
        <>
          {/* My Inboxes & Profile first */}
          <SheetClose asChild>
            <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <LayoutDashboard className="w-4 h-4" />
              My Inboxes
            </Link>
          </SheetClose>
          <SheetClose asChild>
            <Link to="/profile" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
              <Settings className="w-4 h-4" />
              Profile
            </Link>
          </SheetClose>

          {plan === 'paid' && (
            <SheetClose asChild>
              <Link to="/bulk" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
                <Sparkles className="w-4 h-4 text-primary" />
                Bulk Generate
              </Link>
            </SheetClose>
          )}

          <div className="h-px bg-border/40 my-2 mx-4" />

          {/* User info */}
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{profile?.display_name || user.email?.split('@')[0]}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <span className={`ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
              plan === 'paid'
                ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {PLAN_LIMITS[plan].label}
            </span>
          </div>

          {plan !== 'paid' && (
            <SheetClose asChild>
              <Link to="/pricing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-400 hover:bg-amber-500/10 transition-colors">
                <Crown className="w-4 h-4" />
                Upgrade to Pro
              </Link>
            </SheetClose>
          )}

          <div className="h-px bg-border/40 my-2 mx-4" />
        </>
      )}

      {/* Download & Pricing (only if no Upgrade to Pro shown) */}
      <SheetClose asChild>
        <Link to="/download" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
          <Download className="w-4 h-4" />
          Download
        </Link>
      </SheetClose>
      {!user && (
        <SheetClose asChild>
          <Link to="/pricing" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors">
            <CreditCard className="w-4 h-4" />
            Pricing
          </Link>
        </SheetClose>
      )}

      {user && (
        <>
          <div className="h-px bg-border/40 my-2 mx-4" />
          <SheetClose asChild>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </SheetClose>
        </>
      )}

      {!user && !loading && (
        <>
          <div className="h-px bg-border/40 my-2 mx-4" />
          <div className="px-4 pt-2">
            <SheetClose asChild>
              <Button asChild className="w-full relative overflow-hidden group/signin rounded-full">
                <Link to="/auth">
                  <div className="absolute inset-0 gradient-bg" />
                  <span className="relative z-10 text-primary-foreground font-semibold">Sign In</span>
                </Link>
              </Button>
            </SheetClose>
          </div>
        </>
      )}
    </div>
  );

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

            {/* Center nav links - desktop only */}
            {!isMobile && (
              <div className="flex items-center gap-1">
                {plan === 'paid' && (
                  <NavItem to="/bulk" active={isActive('/bulk')}>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Bulk
                    </span>
                  </NavItem>
                )}
              </div>
            )}

            {/* Right side */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Pricing & Download - desktop only */}
              {!isMobile && (
                <>
                  <NavItem to="/pricing" active={isActive('/pricing')}>Pricing</NavItem>
                  <NavItem to="/download" active={isActive('/download')}>Download</NavItem>
                </>
              )}
              {!isMobile && !loading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="gap-1.5 px-2.5 hover:bg-primary/5">
                        <div className="relative w-7 h-7 rounded-full gradient-bg flex items-center justify-center">
                          <User className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-medium truncate max-w-[100px]">
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
                      <DropdownMenuItem asChild className="rounded-lg">
                        <Link to="/profile" className="gap-2 cursor-pointer">
                          <Settings className="w-4 h-4" /> Profile
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

              {/* Mobile hamburger */}
              {isMobile && (
                <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-9 h-9">
                      <Menu className="w-5 h-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-[280px] bg-card/95 backdrop-blur-2xl border-border/40 p-4">
                    <SheetHeader className="pb-4 border-b border-border/40">
                      <SheetTitle className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold">MailRCV</span>
                      </SheetTitle>
                    </SheetHeader>
                    <MobileNavContent />
                  </SheetContent>
                </Sheet>
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
