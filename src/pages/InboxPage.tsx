import { useState, useEffect } from "react";
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
  ExternalLink,
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
  const [domainName, setDomainName] = useState("mailrcv.site");
  
  const email = `${username}@${domainName}`;
  

  useEffect(() => {
    if (username) {
      initializeInbox();
    }
  }, [username]);

  // Set up realtime subscription for new emails
  useEffect(() => {
    if (!alias?.id) return;

    const channel = supabase
      .channel('inbox-emails')
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

  const initializeInbox = async () => {
    setLoading(true);
    try {
      // Get or create default domain
      const defaultDomain = await getOrCreateDefaultDomain();
      if (!defaultDomain) {
        toast.error("Failed to initialize inbox");
        return;
      }

      // Get or create alias for this username
      const aliasData = await getOrCreateAlias(username!, defaultDomain.id);
      if (!aliasData) {
        toast.error("Failed to create inbox");
        return;
      }
      
      setAlias(aliasData);
      setForwardEmail(aliasData.forward_to_email || "");

      // Load existing emails
      const emailsData = await getEmailsForAlias(aliasData.id);
      setEmails(emailsData);
    } catch (error) {
      console.error("Error initializing inbox:", error);
      toast.error("Failed to load inbox");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const copyInboxUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Inbox URL copied!");
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (alias) {
      const emailsData = await getEmailsForAlias(alias.id);
      setEmails(emailsData);
    }
    setIsRefreshing(false);
    toast.info("Inbox refreshed");
  };

  const handleSaveForward = async () => {
    if (!alias) return;
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (forwardEmail && !emailRegex.test(forwardEmail)) {
      toast.error("Invalid email format");
      return;
    }

    await updateAliasForwarding(alias.id, forwardEmail);
    setShowForward(false);
    toast.success("Forwarding settings saved!");
  };

  const handleDeleteEmail = async (emailId: string) => {
    await deleteEmail(emailId);
    setEmails(emails.filter(e => e.id !== emailId));
    toast.success("Email deleted");
  };

  const handleMarkAsRead = async (emailId: string) => {
    await markEmailAsRead(emailId);
    setEmails(emails.map(e => e.id === emailId ? { ...e, is_read: true } : e));
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

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
      <header className="sticky top-0 z-40 border-b border-border/50">
        <div className="glass-strong">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-blue">
                    <Mail className="w-4 h-4 text-primary-foreground" />
                  </div>
                </Link>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-semibold text-lg text-primary break-all">{email}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
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
                      className="h-8 w-8"
                      onClick={copyInboxUrl}
                      title="Share inbox URL"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">
                    /inbox/{username}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setShowForward(!showForward)}
                >
                  <Forward className="w-4 h-4 mr-2" />
                  Set Forward
                </Button>
                <Button
                  variant="glass"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                </Button>
              </div>
            </div>

            {/* Forward setup */}
            {showForward && (
              <div className="mt-4 p-5 rounded-xl glass animate-slide-up">
                <p className="text-sm font-medium mb-3 text-primary">Forward emails to:</p>
                <div className="flex gap-3">
                  <Input
                    type="email"
                    placeholder="your-real@email.com"
                    value={forwardEmail}
                    onChange={(e) => setForwardEmail(e.target.value)}
                    className="flex-1 font-mono"
                  />
                  <Button variant="hero" onClick={handleSaveForward}>
                    <Check className="w-4 h-4 mr-2" />
                    Save
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  All incoming emails will be forwarded to this address.
                </p>
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
              <div
                key={mail.id}
                className={`group p-5 rounded-xl transition-all duration-300 cursor-pointer ${
                  mail.is_read 
                    ? "glass" 
                    : "glass glow"
                }`}
                onClick={() => handleMarkAsRead(mail.id)}
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
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmail(mail.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default InboxPage;
