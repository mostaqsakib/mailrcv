import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Mail, 
  Copy, 
  Check, 
  RefreshCw, 
  Forward, 
  Trash2, 
  Clock,
  Inbox,
  ArrowLeft,
  Share2,
  Bell,
  BellOff,
  Lock,
  Eye,
  EyeOff,
  KeyRound,
  LogOut
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  getOrCreateDomainByName, 
  getOrCreateAlias,
  getEmailsForAlias,
  markEmailAsRead,
  deleteEmail,
  updateAliasForwarding,
  type ReceivedEmail,
  type EmailAlias
} from "@/lib/email-service";
import EmailDetailDialog from "@/components/EmailDetailDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { usePushNotifications } from "@/hooks/use-push-notifications";

// Skeleton component for email items
const EmailItemSkeleton = memo(() => (
  <div className="p-5 rounded-xl glass">
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="w-2 h-2 rounded-full" />
          <Skeleton className="h-4 w-40" />
        </div>
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      <Skeleton className="h-4 w-16" />
    </div>
  </div>
));
EmailItemSkeleton.displayName = "EmailItemSkeleton";

// Memoized email item component for better performance
const EmailItem = memo(({ 
  mail, 
  onRead, 
  onDelete, 
  onSelect,
  username
}: { 
  mail: ReceivedEmail; 
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (mail: ReceivedEmail) => void;
  username: string;
}) => {
  const navigate = useNavigate();
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const handleClick = useCallback(() => {
    onRead(mail.id);
    // Navigate to email detail page
    navigate(`/inbox/${username}/email/${mail.id}`);
  }, [mail, onRead, navigate, username]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(mail.id);
  }, [mail.id, onDelete]);

  return (
    <div
      className={`group p-5 rounded-xl transition-all duration-300 cursor-pointer ${
        mail.is_read 
          ? "glass hover:bg-white/5" 
          : "glass glow hover:bg-white/5"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            {!mail.is_read && (
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            )}
            <span className={`font-mono text-sm truncate ${!mail.is_read ? "text-primary" : "text-muted-foreground"}`}>
              {mail.from_email}
            </span>
          </div>
          <h4 className={`font-semibold text-lg mb-1 ${!mail.is_read ? "text-foreground" : "text-foreground/80"}`}>
            {mail.subject || "(No subject)"}
          </h4>
          <p className="text-muted-foreground line-clamp-1">
            {mail.body_text?.substring(0, 150) || "(No content)"}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
            <Clock className="w-3 h-3" />
            {formatTime(mail.received_at)}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
});

EmailItem.displayName = "EmailItem";

const DEFAULT_DOMAIN = "mailrcv.site";

const InboxPage = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();
  const { playSound } = useNotificationSound();
  const { isNative, registerPush, isRegistered } = usePushNotifications();
  const [alias, setAlias] = useState<EmailAlias | null>(null);
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [copied, setCopied] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [showForward, setShowForward] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [emailsLoading, setEmailsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  // Get domain from query params or default
  const domainName = useMemo(() => {
    return searchParams.get('domain') || DEFAULT_DOMAIN;
  }, [searchParams]);
  
  const email = useMemo(() => `${username}@${domainName}`, [username, domainName]);

  const initializeInbox = useCallback(async () => {
    setLoading(true);
    setEmailsLoading(true);
    try {
      // Get or create the domain based on URL param
      const domain = await getOrCreateDomainByName(domainName);
      if (!domain) {
        toast.error("Failed to initialize inbox");
        return;
      }

      // Get or create alias for this domain
      const aliasData = await getOrCreateAlias(username!, domain.id);
      if (!aliasData) {
        toast.error("Failed to create inbox");
        return;
      }
      
      // Set alias immediately so UI can render, then fetch emails
      setAlias(aliasData);
      setForwardEmail(aliasData.forward_to_email || "");
      setLoading(false);

      // Fetch emails in background (non-blocking for UI)
      getEmailsForAlias(aliasData.id).then((data) => {
        setEmails(data);
        setEmailsLoading(false);
      });
    } catch (error) {
      console.error("Error initializing inbox:", error);
      toast.error("Failed to load inbox");
      setLoading(false);
      setEmailsLoading(false);
    }
  }, [username, domainName]);

  useEffect(() => {
    const checkAuthAndInit = async () => {
      if (!username) return;
      
      setAlias(null);
      setEmails([]);
      setSelectedEmail(null);
      setDetailOpen(false);
      setNeedsAuth(false);
      
      // Check for saved session with password
      const sessionKey = `mailrcv_session_${username}`;
      const sessionData = localStorage.getItem(sessionKey);
      
      // First check if inbox is password protected
      try {
        const { data, error } = await supabase.functions.invoke('inbox-auth', {
          body: { action: 'check', username: username.toLowerCase(), domain: domainName }
        });
        
        if (error) throw error;
        
        if (data.exists && data.is_password_protected) {
          setIsPasswordProtected(true);
          
          // Check if we have a valid session
          if (sessionData) {
            try {
              const session = JSON.parse(sessionData);
              if (session.password) {
                // Verify the session is still valid
                const { data: loginData, error: loginError } = await supabase.functions.invoke('inbox-auth', {
                  body: { action: 'login', username: username.toLowerCase(), domain: domainName, password: session.password }
                });
                
                if (loginError || loginData.error) {
                  // Session invalid, need to re-auth
                  localStorage.removeItem(sessionKey);
                  setNeedsAuth(true);
                  setLoading(false);
                  return;
                }
                
                // Session valid
                setSavedPassword(session.password);
                initializeInbox();
                return;
              }
            } catch {
              // Parse error, need to re-auth
              setNeedsAuth(true);
              setLoading(false);
              return;
            }
          }
          
          // No session, need auth
          setNeedsAuth(true);
          setLoading(false);
          return;
        }
        
        // Public inbox or new inbox
        initializeInbox();
      } catch (error) {
        console.error('Auth check error:', error);
        // Fall back to regular init
        initializeInbox();
      }
    };
    
    checkAuthAndInit();
  }, [username, initializeInbox]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginPassword) {
      toast.error("Please enter password");
      return;
    }
    
    setIsLoggingIn(true);
    try {
      const { data, error } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'login', username: username?.toLowerCase(), domain: domainName, password: loginPassword }
      });
      
      if (error) throw error;
      
      if (data.error) {
        toast.error(data.error);
        return;
      }
      
      // Save session
      localStorage.setItem(`mailrcv_session_${username}`, JSON.stringify({
        alias_id: data.alias_id,
        token: data.session_token,
        password: loginPassword,
        created_at: Date.now()
      }));
      
      setSavedPassword(loginPassword);
      setNeedsAuth(false);
      toast.success("Login successful!");
      initializeInbox();
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed");
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Register for push notifications when alias is ready
  useEffect(() => {
    if (isNative && alias?.id && !isRegistered) {
      registerPush(alias.id);
    }
  }, [isNative, alias?.id, isRegistered, registerPush]);

  // Set up realtime subscription for new emails
  useEffect(() => {
    if (!alias?.id) return;

    const channelName = `inbox-emails-${alias.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'received_emails',
          filter: `alias_id=eq.${alias.id}`,
        },
        (payload) => {
          const newEmail = payload.new as ReceivedEmail;
          setEmails((prev) => [newEmail, ...prev]);
          toast.info("New email received!");
          
          // Play subtle notification sound
          playSound();
          
          // Show browser notification
          showNotification("📧 New Email", {
            body: `From: ${newEmail.from_email}\n${newEmail.subject || "(No subject)"}`,
            tag: newEmail.id,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alias?.id, showNotification, playSound]);

  const copyToClipboard = useCallback(async () => {
    const productionEmail = `${username}@${domainName}`;
    await navigator.clipboard.writeText(productionEmail);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [username, domainName]);

  const copyInboxUrl = useCallback(async () => {
    const domainParam = domainName !== DEFAULT_DOMAIN ? `?domain=${encodeURIComponent(domainName)}` : '';
    const cleanUrl = `https://mailrcv.site/inbox/${username}${domainParam}`;
    await navigator.clipboard.writeText(cleanUrl);
    toast.success("Inbox URL copied!");
  }, [username, domainName]);

  const copyPassword = useCallback(async () => {
    if (savedPassword) {
      await navigator.clipboard.writeText(savedPassword);
      setCopiedPassword(true);
      toast.success("Password copied!");
      setTimeout(() => setCopiedPassword(false), 2000);
    }
  }, [savedPassword]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    if (alias) {
      const emailsData = await getEmailsForAlias(alias.id);
      setEmails(emailsData);
    }
    setIsRefreshing(false);
    toast.info("Inbox refreshed");
  }, [alias]);

  const handleSaveForward = useCallback(async () => {
    if (!alias) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (forwardEmail && !emailRegex.test(forwardEmail)) {
      toast.error("Invalid email format");
      return;
    }

    await updateAliasForwarding(alias.id, forwardEmail);
    setShowForward(false);
    toast.success("Forwarding settings saved!");
  }, [alias, forwardEmail]);

  const handleDeleteEmail = useCallback(async (emailId: string) => {
    await deleteEmail(emailId);
    setEmails(prev => prev.filter(e => e.id !== emailId));
    toast.success("Email deleted");
  }, []);

  const handleMarkAsRead = useCallback(async (emailId: string) => {
    await markEmailAsRead(emailId);
    setEmails(prev => prev.map(e => e.id === emailId ? { ...e, is_read: true } : e));
  }, []);

  const handleSelectEmail = useCallback((mail: ReceivedEmail) => {
    setSelectedEmail(mail);
    setDetailOpen(true);
  }, []);

  const toggleForward = useCallback(() => {
    setShowForward(prev => !prev);
  }, []);

  const handleNotificationToggle = useCallback(async () => {
    if (permission === "granted") {
      toast.info("Notifications already enabled!");
    } else if (permission === "denied") {
      toast.error("Notifications blocked. Please enable in browser settings.");
    } else {
      const granted = await requestPermission();
      if (granted) {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notification permission denied");
      }
    }
  }, [permission, requestPermission]);

  const goBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  const handleLogout = useCallback(() => {
    // Remove session from localStorage
    localStorage.removeItem(`mailrcv_session_${username}`);
    setSavedPassword(null);
    setIsPasswordProtected(false);
    toast.success("Logged out successfully");
    navigate("/");
  }, [username, navigate]);

  // Login screen for password protected inbox
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center pt-safe pb-safe">
        {/* Background effects */}
        <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
        
        <div className="w-full max-w-md px-4">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl gradient-bg flex items-center justify-center shadow-blue-strong">
              <Lock className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">Protected Inbox</h1>
            <p className="text-muted-foreground font-mono text-lg">{username}@{domainName}</p>
          </div>
          
          <form onSubmit={handleLoginSubmit} className="glass rounded-2xl p-6 space-y-4">
            <div className="relative">
              <div className="relative flex items-center bg-background dark:bg-background/70 rounded-xl px-4 py-4 gap-3 border border-border/50 dark:border-primary/20 focus-within:border-primary transition-all duration-300">
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5 text-primary" />
                </div>
                <Input
                  type={showLoginPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-lg text-foreground placeholder:text-muted-foreground/50 min-w-0 h-auto py-0"
                  autoFocus
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold"
              disabled={isLoggingIn}
            >
              {isLoggingIn ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Unlock Inbox
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-safe pb-safe">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative pt-safe pb-safe">
      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div className="glass-strong border-b border-border/50">
          <div className="container mx-auto px-4 py-5">
            {/* Top row - Logo and actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goBack}
                  className="gap-2 px-3 sm:px-4 rounded-full border-primary/30 hover:border-primary hover:bg-primary/10 transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
                <Link to="/" className="flex items-center gap-2 sm:gap-3 group">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl gradient-bg flex items-center justify-center shadow-blue group-hover:shadow-blue-strong transition-all">
                    <Mail className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="text-base sm:text-lg font-semibold hidden sm:block">MailRCV</span>
                </Link>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="h-9 w-9"
                  title="Refresh inbox"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                {isSupported && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNotificationToggle}
                    className={`h-9 w-9 ${permission === "granted" ? "text-primary" : ""}`}
                    title={permission === "granted" ? "Notifications enabled" : "Enable notifications"}
                  >
                    {permission === "granted" ? (
                      <Bell className="w-4 h-4" />
                    ) : (
                      <BellOff className="w-4 h-4" />
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleForward}
                  className={`h-9 w-9 ${showForward ? "bg-primary/10 text-primary" : ""}`}
                  title="Forward settings"
                >
                  <Forward className="w-4 h-4" />
                </Button>
                {isPasswordProtected && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleLogout}
                    className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                )}
                <ThemeToggle />
              </div>
            </div>

            {/* Email address card */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted-foreground">Your temporary inbox</p>
                    {isPasswordProtected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                        <Lock className="w-3 h-3" />
                        Protected
                      </span>
                    )}
                  </div>
                  <p className="font-mono font-medium text-primary text-lg truncate">{email}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-primary" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={copyInboxUrl}
                    title="Share inbox URL"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Password section for protected inboxes */}
              {isPasswordProtected && savedPassword && (
                <div className="mt-3 pt-3 border-t border-border/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground mb-1">Password</p>
                        <p className="font-mono font-medium text-sm truncate">
                          {showPassword ? savedPassword : '••••••••••••'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        onClick={copyPassword}
                        title="Copy password"
                      >
                        {copiedPassword ? (
                          <Check className="w-4 h-4 text-primary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Forward setup - collapsible */}
            {showForward && (
              <div className="mt-4 p-4 rounded-xl glass animate-slide-up">
                <p className="text-sm font-medium mb-3">Forward emails to:</p>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your-real@email.com"
                    value={forwardEmail}
                    onChange={(e) => setForwardEmail(e.target.value)}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button size="sm" onClick={handleSaveForward}>
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Email list */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        {emailsLoading ? (
          // Skeleton placeholders while emails are loading
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <EmailItemSkeleton key={i} />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl glass flex items-center justify-center">
              <Inbox className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">Inbox is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Emails sent to <strong className="text-primary font-mono">{email}</strong> will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((mail) => (
              <EmailItem
                key={mail.id}
                mail={mail}
                onRead={handleMarkAsRead}
                onDelete={handleDeleteEmail}
                onSelect={handleSelectEmail}
                username={username!}
              />
            ))}
          </div>
        )}

        {/* Email Detail Dialog */}
        <EmailDetailDialog
          email={selectedEmail}
          open={detailOpen}
          onOpenChange={setDetailOpen}
          onDelete={handleDeleteEmail}
        />
      </main>
    </div>
  );
};

export default InboxPage;
