import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  User, 
  Copy, 
  Trash2,
  ArrowLeft,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import type { ReceivedEmail } from "@/lib/email-service";
import { deleteEmail, markEmailAsRead } from "@/lib/email-service";

const EmailDetailPage = () => {
  const { username, emailId } = useParams<{ username: string; emailId: string }>();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [email, setEmail] = useState<ReceivedEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [contentWritten, setContentWritten] = useState(false);
  
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      if (!emailId) return;
      
      try {
        const { data, error } = await supabase
          .from('received_emails')
          .select('*')
          .eq('id', emailId)
          .single();
        
        if (error) throw error;
        
        setEmail(data);
        
        // Mark as read
        if (data && !data.is_read) {
          await markEmailAsRead(emailId);
        }
        
      } catch (error) {
        console.error('Error fetching email:', error);
        toast.error("Failed to load email");
        navigate(`/inbox/${username}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEmail();
  }, [emailId, username, navigate]);

  const writeIframeContent = useCallback((forceWrite = false) => {
    if (!email?.body_html || !iframeRef.current) return;
    
    // Prevent double-writes unless forced (for theme changes)
    if (contentWritten && !forceWrite) return;
    
    const iframe = iframeRef.current;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
        const isDark = resolvedTheme === 'dark';
        const bgColor = isDark ? '#0c0c0e' : '#ffffff';
        const textColor = isDark ? '#f4f4f5' : '#18181b';
        const linkColor = isDark ? '#22d3ee' : '#0891b2';
        const quoteColor = isDark ? '#a1a1aa' : '#71717a';
        const quoteBorder = isDark ? '#3f3f46' : '#d4d4d8';
        const codeBg = isDark ? '#18181b' : '#f4f4f5';
        const codeBorder = isDark ? '#27272a' : '#e4e4e7';
        const hrColor = isDark ? '#3f3f46' : '#e4e4e7';
        
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 15px;
                line-height: 1.8;
                color: ${textColor};
                background: ${bgColor};
                margin: 0;
                padding: 24px;
                word-wrap: break-word;
                overflow-wrap: anywhere;
                word-break: break-word;
                white-space: pre-line;
              }
              p, div { margin-bottom: 1em; }
              p:last-child, div:last-child { margin-bottom: 0; }
              a { color: ${linkColor}; word-break: break-all; }
              a:hover { text-decoration: underline; }
              img { max-width: 100%; height: auto; }
              table { max-width: 100%; border-collapse: collapse; }
              td, th { padding: 8px; }
              blockquote {
                border-left: 3px solid ${quoteBorder};
                margin: 16px 0;
                padding-left: 16px;
                color: ${quoteColor};
              }
              pre, code {
                background: ${codeBg};
                border-radius: 6px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
                color: ${textColor};
              }
              pre { padding: 16px; overflow-x: auto; border: 1px solid ${codeBorder}; }
              code { padding: 2px 6px; }
              pre code { padding: 0; background: transparent; }
              hr { border: none; border-top: 1px solid ${hrColor}; margin: 16px 0; }
              .tap-copy-hint {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: #22c55e;
                color: white;
                padding: 8px 16px;
                border-radius: 8px;
                font-size: 14px;
                font-weight: 600;
                z-index: 9999;
                animation: fadeInOut 2s ease-in-out forwards;
              }
              @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
              }
              .copy-highlight {
                outline: 2px solid ${linkColor} !important;
                outline-offset: 2px;
                background: rgba(34, 211, 238, 0.1) !important;
              }
            </style>
          </head>
          <body>
            ${email.body_html}
            <script>
              function showCopyToast(message) {
                const existing = document.querySelector('.tap-copy-hint');
                if (existing) existing.remove();
                const toast = document.createElement('div');
                toast.className = 'tap-copy-hint';
                toast.textContent = message;
                document.body.appendChild(toast);
                setTimeout(() => toast.remove(), 2000);
              }
              
              document.querySelectorAll('a[href]').forEach(link => {
                link.addEventListener('click', (e) => {
                  if (e.detail === 2) {
                    e.preventDefault();
                    navigator.clipboard.writeText(link.href).then(() => {
                      showCopyToast('✓ Link copied!');
                    });
                  }
                });
              });
              
              document.querySelectorAll('code:not(pre code)').forEach(code => {
                code.style.cursor = 'pointer';
                code.onclick = () => {
                  navigator.clipboard.writeText(code.textContent).then(() => {
                    showCopyToast('✓ Copied!');
                  });
                };
              });
            </script>
          </body>
          </html>
        `;
      doc.open();
      doc.write(htmlContent);
      doc.close();
      setContentWritten(true);
    }
  }, [email?.body_html, resolvedTheme, contentWritten]);

  // Reset contentWritten when email changes
  useEffect(() => {
    setContentWritten(false);
  }, [emailId]);

  // Re-write on theme change (force write)
  useEffect(() => {
    if (email?.body_html && contentWritten && resolvedTheme) {
      writeIframeContent(true);
    }
  }, [resolvedTheme]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const copyEmailContent = async () => {
    if (!email) return;
    const content = email.body_html || email.body_text;
    if (content) {
      await navigator.clipboard.writeText(content);
      toast.success("Email content copied!");
    }
  };

  const handleDelete = async () => {
    if (!email) return;
    await deleteEmail(email.id);
    toast.success("Email deleted");
    navigate(`/inbox/${username}`);
  };

  const goBack = () => {
    navigate(`/inbox/${username}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!email) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Email not found</h2>
          <Button onClick={goBack}>Back to Inbox</Button>
        </div>
      </div>
    );
  }

  const hasHtml = !!email.body_html;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={goBack}
                className="gap-2 rounded-full border-primary/30 hover:border-primary hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Inbox</span>
              </Button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">MailRCV</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={copyEmailContent} className="gap-1.5">
                <Copy className="w-4 h-4" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Delete</span>
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      {/* Email metadata */}
      <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">
            {email.subject || "(No subject)"}
          </h1>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-mono">{email.from_email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{formatDate(email.received_at)}</span>
            </div>
          </div>
          
        </div>
      </div>

      {/* Email content - full height */}
      <main className="flex-1 relative z-10 pb-safe">
        <div className="container mx-auto px-4 py-6">
          <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-elegant">
            {hasHtml ? (
              <iframe
                ref={iframeRef}
                title="Email Content"
                className="w-full border-0 bg-transparent"
                style={{ minHeight: "calc(100vh - 280px)" }}
                sandbox="allow-same-origin allow-scripts"
                srcDoc="<!DOCTYPE html><html><body></body></html>"
                onLoad={() => writeIframeContent()}
              />
            ) : (
              <ScrollArea className="h-full" style={{ maxHeight: "calc(100vh - 280px)" }}>
                <div className="p-6">
                  <div 
                    className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90"
                    style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                  >
                    {email.body_text || "(No content)"}
                  </div>
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmailDetailPage;
