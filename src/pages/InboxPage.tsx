import { useState, useEffect, useCallback, useMemo, memo, useRef } from "react";
import { cleanSenderEmail } from "@/lib/clean-sender";
import { useAuth } from "@/contexts/AuthContext";
import { addGuestInbox, getGuestInboxes, canCreateInbox } from "@/lib/plan-limits";
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
  LogOut,
  Volume2,
  VolumeX,
  CheckSquare,
  X,
  MailOpen,
  Search
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
  deleteAlias,
  type ReceivedEmail,
  type EmailAlias
} from "@/lib/email-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import EmailDetailDialog from "@/components/EmailDetailDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/hooks/use-notifications";
import { useNotificationSound } from "@/hooks/use-notification-sound";
import { usePushNotifications } from "@/hooks/use-push-notifications";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";

// Skeleton component for email items
const EmailItemSkeleton = memo(() => (
  <div className="p-4 sm:p-5 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30">
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-3.5 w-full" />
        </div>
      </div>
      <Skeleton className="h-4 w-14 shrink-0" />
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
  username,
  selectionMode,
  isSelected,
  onToggleSelect
}: { 
  mail: ReceivedEmail; 
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (mail: ReceivedEmail) => void;
  username: string;
  selectionMode: boolean;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
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
    if (selectionMode) {
      onToggleSelect(mail.id);
      return;
    }
    onRead(mail.id);
    navigate(`/inbox/${username}/email/${mail.id}`, { state: { domain: mail.id } });
  }, [mail, onRead, navigate, username, selectionMode, onToggleSelect]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(mail.id);
  }, [mail.id, onDelete]);

  return (
    <div
      className={`group relative p-4 sm:p-5 rounded-2xl transition-all duration-300 cursor-pointer border ${
        isSelected
          ? "bg-primary/5 border-primary/40 shadow-[0_0_20px_-5px] shadow-primary/20"
          : mail.is_read 
            ? "bg-card/40 backdrop-blur-xl border-border/20 hover:border-border/40 hover:bg-card/60" 
            : "bg-card/60 backdrop-blur-xl border-primary/15 hover:border-primary/30 hover:shadow-[0_0_25px_-8px] hover:shadow-primary/15"
      }`}
      onClick={handleClick}
    >
      {/* Unread indicator line */}
      {!mail.is_read && (
        <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-gradient-to-b from-primary to-accent" />
      )}

      <div className="flex items-start gap-3 sm:gap-4">
        {selectionMode && (
          <div className="flex items-center pt-1.5 shrink-0">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
              isSelected ? "bg-primary border-primary scale-110" : "border-muted-foreground/30 hover:border-primary/50"
            }`}>
              {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
            </div>
          </div>
        )}

        {/* Avatar */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-300 ${
          !mail.is_read 
            ? "bg-gradient-to-br from-primary/20 to-accent/15 text-primary group-hover:scale-105" 
            : "bg-muted/20 text-muted-foreground"
        }`}>
          {cleanSenderEmail(mail.from_email).charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className={`font-medium text-sm truncate ${!mail.is_read ? "text-foreground" : "text-muted-foreground"}`}>
              {cleanSenderEmail(mail.from_email)}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground/60 font-mono shrink-0">
              <Clock className="w-3 h-3" />
              {formatTime(mail.received_at)}
            </div>
          </div>
          <h4 className={`font-semibold text-base sm:text-lg mb-0.5 truncate ${!mail.is_read ? "text-foreground" : "text-foreground/70"}`}>
            {mail.subject || "(No subject)"}
          </h4>
          <p className="text-sm text-muted-foreground/70 line-clamp-1">
            {mail.body_text?.substring(0, 120) || "(No content)"}
          </p>
        </div>
        
        <div className="flex items-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pt-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10 rounded-lg"
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
});

EmailItem.displayName = "EmailItem";

const DEFAULT_DOMAIN = "mailrcv.site";

// Parse username param: supports "user@domain" or just "user" (defaults to mailrcv.site)
function parseUsernameParam(param: string | undefined): { user: string; domain: string } {
  if (!param) return { user: '', domain: DEFAULT_DOMAIN };
  const atIndex = param.indexOf('@');
  if (atIndex > 0) {
    return { user: param.substring(0, atIndex), domain: param.substring(atIndex + 1) };
  }
  return { user: param, domain: DEFAULT_DOMAIN };
}

const InboxPage = () => {
  const { user, plan } = useAuth();
  const navRef = useRef<HTMLDivElement>(null);
  const [navMousePos, setNavMousePos] = useState({ x: 0, y: 0 });
  const [navHovered, setNavHovered] = useState(false);
  const handleNavMouseMove = useCallback((e: React.MouseEvent) => {
    if (!navRef.current) return;
    const rect = navRef.current.getBoundingClientRect();
    setNavMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  const { username: rawUsername } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { permission, requestPermission, showNotification, isSupported } = useNotifications();
  const { playSound, soundEnabled, toggleSound } = useNotificationSound();
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
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [savedPassword, setSavedPassword] = useState<string | null>(null);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  
  // Parse username@domain from URL param, with legacy ?domain= query param support
  const { user: username, domain: parsedDomain } = useMemo(() => parseUsernameParam(rawUsername), [rawUsername]);
  const domainName = useMemo(() => {
    // Legacy support: ?domain= query param takes priority if present
    return searchParams.get('domain') || parsedDomain;
  }, [searchParams, parsedDomain]);
  
  // Build the canonical URL param (user@domain or just user for default)
  const urlUsername = useMemo(() => {
    return domainName !== DEFAULT_DOMAIN ? `${username}@${domainName}` : username;
  }, [username, domainName]);
  
  const email = useMemo(() => `${username}@${domainName}`, [username, domainName]);

  // Fast initialization: use alias_id directly if available (skips domain+alias queries)
  const initializeWithAliasId = useCallback(async (aliasId: string) => {
    setLoading(false);
    setEmailsLoading(true);
    
    // Fetch alias details and emails in parallel
    const [aliasRes, emailsData] = await Promise.all([
      supabase
        .from("email_aliases")
        .select("*")
        .eq("id", aliasId)
        .maybeSingle(),
      getEmailsForAlias(aliasId),
    ]);

    if (aliasRes.data) {
      const aliasData = aliasRes.data;
      // Check ownership: if alias belongs to another user, deny access
      if (aliasData.user_id && user?.id && aliasData.user_id !== user.id) {
        toast.error("This inbox is private and belongs to another user.");
        navigate("/");
        return;
      }
      if (aliasData.user_id && !user) {
        toast.error("This inbox is private. Please sign in to access it.");
        navigate("/auth");
        return;
      }
      setAlias(aliasData as EmailAlias);
      setForwardEmail(aliasData.forward_to_email || "");
    }
    setEmails(emailsData);
    setEmailsLoading(false);
  }, [user, navigate]);

  // Fallback: full initialization when alias_id is not available (new inbox)
  const initializeInbox = useCallback(async () => {
    setLoading(true);
    setEmailsLoading(true);
    try {
      // Check limits before creating a NEW inbox
      if (!user) {
        const guestInboxes = getGuestInboxes();
        if (!canCreateInbox('guest', guestInboxes.length)) {
          toast.error("Guest limit reached (5 inboxes). Sign up for more!");
          navigate("/auth");
          return;
        }
      } else {
        const { count, error: countError } = await supabase
          .from("email_aliases")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);
        
        if (!countError && count !== null && !canCreateInbox(plan, count)) {
          const { PLAN_LIMITS } = await import("@/lib/plan-limits");
          const limit = PLAN_LIMITS[plan];
          toast.error(`${limit.label} plan limit reached (${limit.maxInboxes} inboxes). Upgrade for more!`);
          navigate("/pricing");
          return;
        }
      }

      const domain = await getOrCreateDomainByName(domainName);
      if (!domain) {
        toast.error("Failed to initialize inbox");
        return;
      }

      const aliasData = await getOrCreateAlias(username!, domain.id, user?.id);
      if (!aliasData) {
        toast.error("Failed to create inbox");
        return;
      }

      // Track guest inbox in localStorage
      if (!user) {
        addGuestInbox(aliasData.id);
      }
      
      setAlias(aliasData);
      setForwardEmail(aliasData.forward_to_email || "");
      setLoading(false);

      const data = await getEmailsForAlias(aliasData.id);
      setEmails(data);
      setEmailsLoading(false);
    } catch (error: any) {
      console.error("Error initializing inbox:", error);
      if (error?.message === "INBOX_OWNED_BY_OTHER_USER") {
        toast.error("This inbox is private and belongs to another user.");
        navigate("/");
        return;
      }
      toast.error("Failed to load inbox");
      setLoading(false);
      setEmailsLoading(false);
    }
  }, [username, domainName, user, plan]);

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
                const { data: loginData, error: loginError } = await supabase.functions.invoke('inbox-auth', {
                  body: { action: 'login', username: username.toLowerCase(), domain: domainName, password: session.password }
                });
                
                if (loginError || loginData.error) {
                  localStorage.removeItem(sessionKey);
                  setNeedsAuth(true);
                  setLoading(false);
                  return;
                }
                
                setSavedPassword(session.password);
                // Fast path: use alias_id from auth response
                if (data.alias_id) {
                  initializeWithAliasId(data.alias_id);
                } else {
                  initializeInbox();
                }
                return;
              }
            } catch {
              setNeedsAuth(true);
              setLoading(false);
              return;
            }
          }
          
          setNeedsAuth(true);
          setLoading(false);
          return;
        }
        
        // Public inbox — fast path: use alias_id if inbox exists
        if (data.exists && data.alias_id) {
          initializeWithAliasId(data.alias_id);
        } else {
          // New inbox, need full initialization
          initializeInbox();
        }
      } catch (error) {
        console.error('Auth check error:', error);
        initializeInbox();
      }
    };
    
    checkAuthAndInit();
  }, [username, initializeInbox, initializeWithAliasId]);

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
      if (data.alias_id) {
        initializeWithAliasId(data.alias_id);
      } else {
        initializeInbox();
      }
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
          
          // Rich in-app popup notification
          toast(
            <div className="flex items-start gap-3 w-full">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground">New email from</p>
                <p className="text-sm font-semibold truncate">{cleanSenderEmail(newEmail.from_email)}</p>
                <p className="text-sm text-muted-foreground truncate mt-0.5">
                  {newEmail.subject || "(No subject)"}
                </p>
              </div>
            </div>,
            {
              duration: 5000,
              position: "top-right",
              className: "!bg-card !border-border !shadow-xl",
            }
          );
          
          // Play subtle notification sound
          playSound();
          
          // Show browser notification
          showNotification("📧 New Email", {
            body: `From: ${cleanSenderEmail(newEmail.from_email)}\n${newEmail.subject || "(No subject)"}`,
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
    const cleanUrl = `https://mailrcv.site/inbox/${urlUsername}`;
    await navigator.clipboard.writeText(cleanUrl);
    toast.success("Inbox URL copied!");
  }, [urlUsername]);

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

  // Pull to refresh
  const { pullDistance, isRefreshing: isPullRefreshing } = usePullToRefresh({
    onRefresh: handleRefresh,
  });

  // Filtered emails based on search query
  const filteredEmails = useMemo(() => {
    if (!searchQuery.trim()) return emails;
    const q = searchQuery.toLowerCase();
    return emails.filter(
      (e) =>
        (e.subject && e.subject.toLowerCase().includes(q)) ||
        e.from_email.toLowerCase().includes(q)
    );
  }, [emails, searchQuery]);

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

  // Bulk action handlers
  const toggleSelectionMode = useCallback(() => {
    setSelectionMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const handleToggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === emails.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(emails.map(e => e.id)));
    }
  }, [emails, selectedIds.size]);

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => deleteEmail(id)));
    setEmails(prev => prev.filter(e => !selectedIds.has(e.id)));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${ids.length} emails deleted`);
  }, [selectedIds]);

  const handleBulkMarkRead = useCallback(async () => {
    const ids = Array.from(selectedIds);
    await Promise.all(ids.map(id => markEmailAsRead(id)));
    setEmails(prev => prev.map(e => selectedIds.has(e.id) ? { ...e, is_read: true } : e));
    setSelectedIds(new Set());
    setSelectionMode(false);
    toast.success(`${ids.length} emails marked as read`);
  }, [selectedIds]);

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
    navigate(-1);
  }, [navigate]);

  const handleLogout = useCallback(() => {
    // Remove session from localStorage
    localStorage.removeItem(`mailrcv_session_${username}`);
    setSavedPassword(null);
    setIsPasswordProtected(false);
    toast.success("Logged out successfully");
    navigate("/");
  }, [username, navigate]);

  const handleDeleteInbox = useCallback(async () => {
    if (!alias) return;
    
    setIsDeleting(true);
    try {
      const success = await deleteAlias(alias.id);
      if (success) {
        // Also clear any session data
        localStorage.removeItem(`mailrcv_session_${username}`);
        toast.success("Inbox deleted successfully");
        navigate("/");
      } else {
        toast.error("Failed to delete inbox");
      }
    } catch (error) {
      console.error("Error deleting inbox:", error);
      toast.error("Failed to delete inbox");
    } finally {
      setIsDeleting(false);
    }
  }, [alias, username, navigate]);

  // Login screen for password protected inbox
  if (needsAuth) {
    return (
      <div className="min-h-screen hero-gradient relative flex items-center justify-center pt-safe pb-safe overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-20 pointer-events-none" />
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[20%] left-[15%] w-[500px] h-[500px] rounded-full bg-primary/8 dark:bg-primary/15 blur-[150px] animate-float" />
          <div className="absolute bottom-[15%] right-[10%] w-[400px] h-[400px] rounded-full bg-accent/6 dark:bg-accent/12 blur-[130px] animate-float" style={{ animationDelay: "-3s" }} />
        </div>
        <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent pointer-events-none" />
        
        <div className="w-full max-w-md px-4 relative z-10">
          <div className="text-center mb-8 animate-fade-in">
            <div className="relative w-20 h-20 mx-auto mb-6 rounded-2xl gradient-bg flex items-center justify-center group">
              <Lock className="w-10 h-10 text-primary-foreground" />
              <div className="absolute inset-0 rounded-2xl gradient-bg opacity-0 group-hover:opacity-40 blur-xl transition-opacity duration-500" />
            </div>
            <h1 className="text-2xl font-bold mb-2 tracking-tight">Protected Inbox</h1>
            <p className="text-muted-foreground font-mono text-lg">{username}@{domainName}</p>
          </div>
          
          <div className="group relative rounded-2xl p-[1px] transition-all duration-500 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            <div className="absolute inset-0 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity duration-500" style={{
              background: "conic-gradient(from 180deg, hsl(var(--primary) / 0.4), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.1), hsl(var(--accent) / 0.2), hsl(var(--primary) / 0.4))",
              animation: "borderSpin 8s linear infinite",
            }} />

            <form onSubmit={handleLoginSubmit} className="relative rounded-2xl p-6 space-y-4 bg-card/90 backdrop-blur-2xl border border-transparent">
              <div className="relative">
                <div className="relative flex items-center bg-background/60 dark:bg-background/40 rounded-xl px-4 py-4 gap-3 border border-border/50 dark:border-primary/15 focus-within:border-primary/50 transition-all duration-300 focus-within:shadow-[0_0_25px_-5px] focus-within:shadow-primary/20">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400/15 to-orange-500/15 flex items-center justify-center shrink-0">
                    <KeyRound className="w-5 h-5 text-amber-400" />
                  </div>
                  <Input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="Enter password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-lg text-foreground placeholder:text-muted-foreground/40 min-w-0 h-auto py-0"
                    autoFocus
                  />
                  <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => setShowLoginPassword(!showLoginPassword)}>
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              
              <Button type="submit" className="relative w-full h-12 rounded-xl text-base font-semibold overflow-hidden group/submit" disabled={isLoggingIn}>
                <div className="absolute inset-0 gradient-bg" />
                <div className="absolute inset-0 opacity-0 group-hover/submit:opacity-100 transition-opacity duration-500" style={{
                  background: "linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.12) 50%, transparent 100%)",
                  animation: "shimmerSlide 2s ease-in-out infinite",
                }} />
                {isLoggingIn ? (
                  <div className="relative z-10 w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="relative z-10 flex items-center gap-2 text-primary-foreground">
                    <Lock className="w-4 h-4" />
                    Unlock Inbox
                  </span>
                )}
              </Button>
            </form>
          </div>
          
          <div className="mt-6 text-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
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
      {/* Pull to refresh indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center transition-transform"
          style={{ transform: `translateY(${pullDistance - 40}px)` }}
        >
          <div className={`w-8 h-8 border-2 border-primary border-t-transparent rounded-full ${isPullRefreshing ? 'animate-spin' : ''}`}
            style={{ opacity: Math.min(pullDistance / 80, 1) }}
          />
        </div>
      )}

      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40">
        <div
          ref={navRef}
          onMouseMove={handleNavMouseMove}
          onMouseEnter={() => setNavHovered(true)}
          onMouseLeave={() => setNavHovered(false)}
          className="group/nav relative"
        >
          {navHovered && (
            <div
              className="absolute inset-0 opacity-40 pointer-events-none z-0"
              style={{
                background: `radial-gradient(400px circle at ${navMousePos.x}px ${navMousePos.y}px, hsl(var(--primary) / 0.06), transparent 60%)`,
              }}
            />
          )}
          <div className="relative bg-card/80 backdrop-blur-2xl border-b border-border/30 group-hover/nav:border-primary/10 transition-all duration-500">
            <div className="container mx-auto px-4 py-4">
              {/* Top row */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={goBack}
                    className="gap-1.5 px-2.5 rounded-xl hover:bg-primary/5 text-muted-foreground hover:text-foreground transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline text-sm">Back</span>
                  </Button>
                  <div className="h-5 w-px bg-border/40 hidden sm:block" />
                  <Link to="/" className="flex items-center gap-2 group/logo">
                    <div className="relative w-8 h-8 rounded-lg gradient-bg flex items-center justify-center group-hover/logo:scale-110 transition-all duration-300">
                      <Mail className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <span className="text-sm font-semibold hidden sm:block tracking-tight">Inbox</span>
                  </Link>
                  {!emailsLoading && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold tabular-nums">
                      {emails.filter(e => !e.is_read).length > 0
                        ? `${emails.filter(e => !e.is_read).length} new`
                        : `${emails.length} emails`}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-0.5 sm:gap-1">
                  {/* Grouped action buttons */}
                  <div className="flex items-center rounded-xl bg-secondary/30 p-0.5">
                    {emails.length > 0 && (
                      <Button variant="ghost" size="icon" onClick={() => { setShowSearch(prev => !prev); if (showSearch) setSearchQuery(""); }}
                        className={`h-8 w-8 rounded-lg ${showSearch ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Search">
                        <Search className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    {emails.length > 0 && (
                      <Button variant="ghost" size="icon" onClick={toggleSelectionMode}
                        className={`h-8 w-8 rounded-lg ${selectionMode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Select">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}
                      className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground" title="Refresh">
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>

                  <div className="h-5 w-px bg-border/30 mx-0.5 hidden sm:block" />

                  <div className="flex items-center rounded-xl bg-secondary/30 p-0.5">
                    {isSupported && (
                      <Button variant="ghost" size="icon" onClick={handleNotificationToggle}
                        className={`h-8 w-8 rounded-lg ${permission === "granted" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Notifications">
                        {permission === "granted" ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={toggleSound}
                      className={`h-8 w-8 rounded-lg ${soundEnabled ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Sound">
                      {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={toggleForward}
                      className={`h-8 w-8 rounded-lg ${showForward ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`} title="Forward">
                      <Forward className="w-3.5 h-3.5" />
                    </Button>
                  </div>

                  <div className="h-5 w-px bg-border/30 mx-0.5 hidden sm:block" />

                  <div className="flex items-center gap-0.5">
                    {/* Delete inbox */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10" title="Delete inbox" disabled={isDeleting}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-card/95 backdrop-blur-2xl border border-border/60 rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this inbox?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong className="text-primary">{email}</strong> and all {emails.length} emails in it. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteInbox} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl" disabled={isDeleting}>
                            {isDeleting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Delete Inbox
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    {isPasswordProtected && (
                      <Button variant="ghost" size="icon" onClick={handleLogout}
                        className="h-8 w-8 rounded-lg text-destructive/50 hover:text-destructive hover:bg-destructive/10" title="Logout">
                        <LogOut className="w-3.5 h-3.5" />
                      </Button>
                    )}
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              {/* Email address card */}
              <div className="rounded-2xl p-4 bg-gradient-to-r from-primary/[0.04] to-accent/[0.03] border border-primary/10 hover:border-primary/20 transition-all duration-300">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground/60 font-medium">Your inbox</p>
                      {isPasswordProtected && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/15">
                          <Lock className="w-2.5 h-2.5" /> Protected
                        </span>
                      )}
                    </div>
                    <p className="font-mono font-semibold text-primary text-lg sm:text-xl truncate">{email}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10" onClick={copyToClipboard} title="Copy email">
                      {copied ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0 rounded-xl hover:bg-primary/10" onClick={copyInboxUrl} title="Share inbox URL">
                      <Share2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                {/* Password section */}
                {isPasswordProtected && savedPassword && (
                  <div className="mt-3 pt-3 border-t border-primary/10">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/50 font-medium">Password</p>
                          <p className="font-mono font-medium text-sm truncate">
                            {showPassword ? savedPassword : '••••••••••••'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-lg" onClick={copyPassword}>
                          {copiedPassword ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Forward setup */}
              {showForward && (
                <div className="mt-3 p-4 rounded-2xl bg-card/60 backdrop-blur-xl border border-border/30 animate-slide-up">
                  <p className="text-sm font-medium mb-3 text-foreground/80">Forward emails to:</p>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="your-real@email.com"
                      value={forwardEmail}
                      onChange={(e) => setForwardEmail(e.target.value)}
                      className="flex-1 font-mono text-sm rounded-xl"
                    />
                    <Button size="sm" onClick={handleSaveForward} className="rounded-xl px-4">
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Search bar */}
              {showSearch && (
                <div className="mt-3 animate-slide-up">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                    <Input
                      type="text"
                      placeholder="Search by subject or sender..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 font-mono text-sm rounded-xl bg-background/50 border-border/30 focus:border-primary/40"
                      autoFocus
                    />
                    {searchQuery && (
                      <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-lg" onClick={() => setSearchQuery("")}>
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Bulk action bar */}
      {selectionMode && emails.length > 0 && (
        <div className="sticky top-[160px] z-30 container mx-auto px-4 mt-3">
          <div className="rounded-2xl p-3 flex items-center justify-between gap-3 bg-card/80 backdrop-blur-2xl border border-primary/20 shadow-lg shadow-primary/5 animate-slide-up">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={handleSelectAll} className="gap-2 rounded-lg">
                <CheckSquare className="w-4 h-4" />
                {selectedIds.size === emails.length ? "Deselect All" : "Select All"}
              </Button>
              <span className="text-xs text-muted-foreground font-medium tabular-nums">
                {selectedIds.size} selected
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" onClick={handleBulkMarkRead} disabled={selectedIds.size === 0} className="gap-1.5 rounded-lg">
                <MailOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Read</span>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleBulkDelete} disabled={selectedIds.size === 0}
                className="gap-1.5 rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={toggleSelectionMode}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Email list */}
      <main className="container mx-auto px-4 py-6 relative z-10">
        {emailsLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => (
              <EmailItemSkeleton key={i} />
            ))}
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-20 sm:py-28 animate-fade-in">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/5 border border-primary/10 flex items-center justify-center group">
              <Inbox className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground/40 group-hover:text-primary/60 transition-colors duration-500" />
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-2 tracking-tight">No emails yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Send an email to <span className="text-primary font-mono font-medium">{email}</span> and it will appear here instantly.
            </p>
          </div>
        ) : filteredEmails.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-muted/10 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No results</h3>
            <p className="text-sm text-muted-foreground">No emails match "{searchQuery}"</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredEmails.map((mail, index) => (
              <div key={mail.id} className="animate-fade-in" style={{ animationDelay: `${Math.min(index * 0.03, 0.3)}s` }}>
                <EmailItem
                  mail={mail}
                  onRead={handleMarkAsRead}
                  onDelete={handleDeleteEmail}
                  onSelect={handleSelectEmail}
                  username={urlUsername}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(mail.id)}
                  onToggleSelect={handleToggleSelect}
                />
              </div>
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
