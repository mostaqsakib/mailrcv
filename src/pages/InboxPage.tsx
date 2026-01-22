import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  Share2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  getOrCreateDefaultDomain, 
  getOrCreateAlias,
  getEmailsForAlias,
  markEmailAsRead,
  deleteEmail,
  updateAliasForwarding,
  type ReceivedEmail,
  type EmailAlias
} from "@/lib/email-service";
import EmailDetailDialog from "@/components/EmailDetailDialog";

// Memoized email item component for better performance
const EmailItem = memo(({ 
  mail, 
  onRead, 
  onDelete, 
  onSelect 
}: { 
  mail: ReceivedEmail; 
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
  onSelect: (mail: ReceivedEmail) => void;
}) => {
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
    onSelect(mail);
  }, [mail, onRead, onSelect]);

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

const InboxPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  const [alias, setAlias] = useState<EmailAlias | null>(null);
  const [emails, setEmails] = useState<ReceivedEmail[]>([]);
  const [copied, setCopied] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [showForward, setShowForward] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<ReceivedEmail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  
  const domainName = "mailrcv.site";
  const email = useMemo(() => `${username}@${domainName}`, [username]);

  const initializeInbox = useCallback(async () => {
    setLoading(true);
    try {
      const defaultDomain = await getOrCreateDefaultDomain();
      if (!defaultDomain) {
        toast.error("Failed to initialize inbox");
        return;
      }

      const aliasData = await getOrCreateAlias(username!, defaultDomain.id);
      if (!aliasData) {
        toast.error("Failed to create inbox");
        return;
      }
      
      setAlias(aliasData);
      setForwardEmail(aliasData.forward_to_email || "");

      const emailsData = await getEmailsForAlias(aliasData.id);
      setEmails(emailsData);
    } catch (error) {
      console.error("Error initializing inbox:", error);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      setAlias(null);
      setEmails([]);
      setSelectedEmail(null);
      setDetailOpen(false);
      initializeInbox();
    }
  }, [username, initializeInbox]);

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
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [alias?.id]);

  const copyToClipboard = useCallback(async () => {
    const productionEmail = `${username}@mailrcv.site`;
    await navigator.clipboard.writeText(productionEmail);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  }, [username]);

  const copyInboxUrl = useCallback(async () => {
    const cleanUrl = `https://mailrcv.site/inbox/${username}`;
    await navigator.clipboard.writeText(cleanUrl);
    toast.success("Inbox URL copied!");
  }, [username]);

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

  const goBack = useCallback(() => {
    navigate("/");
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
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
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleForward}
                  className={`h-9 w-9 ${showForward ? "bg-primary/10 text-primary" : ""}`}
                >
                  <Forward className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Email address card */}
            <div className="glass rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Your temporary inbox</p>
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
        {emails.length === 0 ? (
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
