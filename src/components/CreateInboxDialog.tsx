import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Shuffle, Copy, Check, Lock, Eye, EyeOff, Wand2, ChevronDown, ChevronUp, Crown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useDomains } from "@/hooks/use-domains";
import { useAuth } from "@/contexts/AuthContext";
import { canUsePasswordProtection, canCreateInbox, getGuestInboxes, addGuestInbox } from "@/lib/plan-limits";
import { generateRandomName, generateStrongPassword } from "@/lib/name-generator";

const SESSION_KEY_PREFIX = "mailrcv_session_";
const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];

interface CreateInboxDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export const CreateInboxDialog = ({ open, onOpenChange, onCreated }: CreateInboxDialogProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { domains } = useDomains();
  const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAINS[0]);
  const navigate = useNavigate();
  const { plan, user } = useAuth();
  const canUsePassword = canUsePasswordProtection(plan);

  const resetForm = useCallback(() => {
    setUsername("");
    setPassword("");
    setShowPassword(false);
    setShowPasswordField(false);
    setCopied(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    if (plan === "guest") {
      const guestInboxes = getGuestInboxes();
      const inboxKey = `${cleanUsername}@${selectedDomain}`;
      if (!guestInboxes.includes(inboxKey) && !canCreateInbox(plan, guestInboxes.length)) {
        toast("Guest limit reached! Max 5 inboxes.", {
          description: "Sign up for free to get 10 inboxes and more features.",
          action: { label: "Sign Up", onClick: () => navigate("/auth") },
        });
        return;
      }
    }

    if (!password) {
      if (plan === "guest") addGuestInbox(`${cleanUsername}@${selectedDomain}`);
      const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
      onOpenChange(false);
      resetForm();
      onCreated?.();
      navigate(`/inbox/${urlParam}`);
      return;
    }

    setIsLoading(true);
    try {
      const { data: checkData, error: checkError } = await supabase.functions.invoke("inbox-auth", {
        body: { action: "check", username: cleanUsername, domain: selectedDomain },
      });
      if (checkError) throw checkError;

      if (checkData.exists) {
        if (!checkData.is_password_protected) {
          toast.error("This is a public inbox, remove password to access");
          setIsLoading(false);
          return;
        }
        const { data: loginData, error: loginError } = await supabase.functions.invoke("inbox-auth", {
          body: { action: "login", username: cleanUsername, domain: selectedDomain, password },
        });
        if (loginError) throw loginError;
        if (loginData.error) { toast.error(loginData.error); setIsLoading(false); return; }
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: loginData.alias_id, token: loginData.session_token, password, domain: selectedDomain, created_at: Date.now(),
        }));
        toast.success("Login successful!");
        const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
        onOpenChange(false);
        resetForm();
        navigate(`/inbox/${urlParam}`);
      } else {
        if (password.length < 6) { toast.error("Password must be at least 6 characters"); setIsLoading(false); return; }
        const { data: registerData, error: registerError } = await supabase.functions.invoke("inbox-auth", {
          body: { action: "register", username: cleanUsername, domain: selectedDomain, password },
        });
        if (registerError) throw registerError;
        if (registerData.error) { toast.error(registerData.error); setIsLoading(false); return; }
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: registerData.alias_id, token: registerData.session_token, password, domain: selectedDomain, created_at: Date.now(),
        }));
        toast.success("Secure inbox created!");
        const urlParam = selectedDomain !== DEFAULT_DOMAINS[0] ? `${cleanUsername}@${selectedDomain}` : cleanUsername;
        onOpenChange(false);
        resetForm();
        onCreated?.();
        navigate(`/inbox/${urlParam}`);
      }
    } catch (error) {
      console.error("Auth error:", error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomGenerate = () => setUsername(generateRandomName());

  const handleGeneratePassword = async () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setShowPassword(true);
    await navigator.clipboard.writeText(newPassword);
    toast.success("Strong password generated & copied!");
  };

  const handleCopyEmail = async () => {
    if (!username.trim()) { toast.error("Please enter a name first"); return; }
    const fullEmail = `${username.trim().toLowerCase()}@${selectedDomain}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetForm(); }}>
      <DialogContent className="sm:max-w-lg border-0 bg-background/80 backdrop-blur-2xl shadow-2xl rounded-2xl overflow-hidden p-0">
        {/* Ambient glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative p-6">
          <DialogHeader className="mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-accent/10 border border-primary/20 flex items-center justify-center">
                <Mail className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-semibold">Create New Inbox</DialogTitle>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username input */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative group">
                <div className="relative flex items-center bg-background/80 dark:bg-background/50 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 group-hover:border-primary/30 transition-all duration-300 group-focus-within:border-primary/60 group-focus-within:shadow-[0_0_25px_-5px] group-focus-within:shadow-primary/30">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary/15 to-accent/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>
                  <Input
                    type="text"
                    placeholder="enter-name"
                    value={username}
                    onChange={(e) => {
                      let value = e.target.value;
                      if (value.includes("@")) {
                        const emailMatch = value.match(/^([a-zA-Z0-9._-]+)@mailrcv\.site$/i);
                        if (emailMatch) { value = emailMatch[1]; } else { value = value.split("@")[0]; }
                      }
                      setUsername(value.replace(/[^a-zA-Z0-9._-]/g, ""));
                    }}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-2 font-mono text-lg font-medium text-foreground placeholder:text-muted-foreground/40 min-w-0 h-auto py-1"
                    autoFocus
                  />
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRandomGenerate}
                className="h-14 w-14 shrink-0 rounded-xl border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5 hover:from-primary/15 hover:to-accent/15 hover:border-primary/40 transition-all duration-300 group/btn hover:scale-105 active:scale-95"
                title="Generate random name"
              >
                <Shuffle className="w-5 h-5 text-primary group-hover/btn:rotate-180 transition-transform duration-500" />
              </Button>
            </div>

            {/* Email preview */}
            <div className="flex items-center justify-between gap-2 py-3 px-4 rounded-xl bg-primary/[0.03] dark:bg-primary/[0.06] border border-primary/10 dark:border-primary/15 group/preview hover:border-primary/25 transition-all duration-300">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <span className="font-mono text-base font-semibold text-foreground truncate">
                  {username || <span className="text-muted-foreground/40">your-name</span>}
                </span>
                <span className="font-mono text-base font-semibold text-primary shrink-0">@</span>
                <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                  <SelectTrigger className="h-auto px-2 py-1 border border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/40 rounded-lg font-mono text-base font-semibold text-primary focus:ring-1 focus:ring-primary/40 focus:ring-offset-0 w-auto gap-1.5 transition-all duration-200 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-primary">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover/95 backdrop-blur-xl border border-primary/15 shadow-xl shadow-primary/5 rounded-xl overflow-hidden">
                    {domains.map((d) => (
                      <SelectItem key={d} value={d} className="font-mono text-sm cursor-pointer py-2.5 pl-8 pr-4 focus:bg-primary/10 focus:text-primary transition-colors">
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={handleCopyEmail} className="h-8 w-8 shrink-0 opacity-40 group-hover/preview:opacity-100 transition-all duration-300" title="Copy email address">
                {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {/* Password toggle */}
            <button
              type="button"
              onClick={() => {
                if (!canUsePassword) {
                  toast("Password protection requires a Free account or higher", {
                    action: { label: "Sign Up", onClick: () => navigate("/auth") },
                  });
                  return;
                }
                setShowPasswordField(!showPasswordField);
                if (showPasswordField) setPassword("");
              }}
              className="flex items-center justify-center gap-2 py-2 w-full text-sm text-muted-foreground hover:text-foreground transition-colors group/lock"
            >
              <Lock className="w-4 h-4 group-hover/lock:text-primary transition-colors" />
              <span>{showPasswordField ? "Remove password protection" : "Add password protection"}</span>
              {!canUsePassword && <Crown className="w-3.5 h-3.5 text-yellow-500" />}
              {canUsePassword && (showPasswordField ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
            </button>

            {/* Password input */}
            {showPasswordField && (
              <div className="animate-slide-up">
                <div className="relative flex items-center bg-background/80 dark:bg-background/50 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/40 transition-all duration-300">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Lock className="w-4 h-4 text-primary" />
                  </div>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password (min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-base text-foreground placeholder:text-muted-foreground/40 min-w-0 h-auto py-0"
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleGeneratePassword} title="Generate strong password">
                    <Wand2 className="w-4 h-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground/50 mt-2 text-center">
                  With password: creates secure inbox or logs in to existing one
                </p>
              </div>
            )}

            {/* Submit button */}
            <Button
              type="submit"
              variant="hero"
              size="lg"
              className="w-full rounded-xl h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group/submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="relative flex items-center gap-2">
                  {password ? "Open Secure Inbox" : "Create & Open Inbox"}
                  <ArrowRight className="w-5 h-5 group-hover/submit:translate-x-1 transition-transform duration-300" />
                </span>
              )}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
