import { useState } from "react";
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
  ArrowLeft
} from "lucide-react";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  date: Date;
  read: boolean;
}

interface InboxViewProps {
  email: string;
  onBack: () => void;
}

// Mock emails for demo
const mockEmails: Email[] = [
  {
    id: "1",
    from: "newsletter@example.com",
    subject: "Welcome to our newsletter!",
    preview: "Thank you for subscribing to our weekly newsletter. We're excited to have you...",
    date: new Date(Date.now() - 1000 * 60 * 5),
    read: false,
  },
  {
    id: "2",
    from: "support@service.com",
    subject: "Your verification code",
    preview: "Your verification code is: 847291. This code will expire in 10 minutes...",
    date: new Date(Date.now() - 1000 * 60 * 30),
    read: true,
  },
  {
    id: "3",
    from: "noreply@social.app",
    subject: "Someone mentioned you!",
    preview: "@user123 mentioned you in a comment: 'Great work on the project!'...",
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    read: true,
  },
];

export const InboxView = ({ email, onBack }: InboxViewProps) => {
  const [emails] = useState<Email[]>(mockEmails);
  const [copied, setCopied] = useState(false);
  const [forwardEmail, setForwardEmail] = useState("");
  const [showForward, setShowForward] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <span className="font-mono font-semibold text-lg">{email}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={copyToClipboard}
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">Your temporary inbox</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForward(!showForward)}
              >
                <Forward className="w-4 h-4 mr-2" />
                Set Forward
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                className={isRefreshing ? "animate-spin" : ""}
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Forward setup */}
          {showForward && (
            <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border animate-slide-up">
              <p className="text-sm font-medium mb-3">Forward emails to:</p>
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="your-real@email.com"
                  value={forwardEmail}
                  onChange={(e) => setForwardEmail(e.target.value)}
                  variant="hero"
                  className="flex-1"
                />
                <Button variant="hero">
                  <Check className="w-4 h-4 mr-2" />
                  Save
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                All incoming emails will be forwarded to this address.
              </p>
            </div>
          )}
        </div>
      </header>

      {/* Email list */}
      <main className="container mx-auto px-4 py-6">
        {emails.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted flex items-center justify-center">
              <Inbox className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Inbox is empty</h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              Emails sent to {email} will appear here. Use this address to sign up for newsletters, verify accounts, and more.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {emails.map((mail) => (
              <div
                key={mail.id}
                className={`group p-4 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-card ${
                  mail.read 
                    ? "bg-card border-border" 
                    : "bg-primary/5 border-primary/20"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!mail.read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                      )}
                      <span className={`font-medium truncate ${!mail.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {mail.from}
                      </span>
                    </div>
                    <h4 className={`font-semibold mb-1 ${!mail.read ? "text-foreground" : "text-foreground/80"}`}>
                      {mail.subject}
                    </h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">
                      {mail.preview}
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatTime(mail.date)}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive">
                        <Trash2 className="w-3 h-3" />
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
