import { cleanSenderEmail } from "@/lib/clean-sender";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Clock, 
  User, 
  Copy, 
  Trash2,
  FileText,
  Code,
  Maximize2,
  Minimize2,
  Mail
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef, useCallback } from "react";
import type { ReceivedEmail } from "@/lib/email-service";

interface EmailDetailDialogProps {
  email: ReceivedEmail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (emailId: string) => void;
}

const EmailDetailDialog = ({ email, open, onOpenChange, onDelete }: EmailDetailDialogProps) => {
  const [viewMode, setViewMode] = useState<"text" | "html">("html");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (headerRef.current) {
      const rect = headerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  }, []);

  useEffect(() => {
    if (email?.body_html) {
      setViewMode("html");
    } else if (email?.body_text) {
      setViewMode("text");
    }
  }, [email]);

  const writeIframeContent = () => {
    if (viewMode === "html" && email?.body_html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
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
                font-size: 14px; line-height: 1.6; color: #e4e4e7;
                background: transparent; margin: 0; padding: 16px;
                word-wrap: break-word; overflow-wrap: break-word;
              }
              a { color: #22d3ee; cursor: pointer; }
              a:hover { text-decoration: underline; }
              .tap-copy-hint {
                position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
                background: #22c55e; color: white; padding: 8px 16px; border-radius: 8px;
                font-size: 14px; font-weight: 600; z-index: 9999;
                animation: fadeInOut 2s ease-in-out forwards;
              }
              @keyframes fadeInOut {
                0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
                15% { opacity: 1; transform: translateX(-50%) translateY(0); }
                85% { opacity: 1; transform: translateX(-50%) translateY(0); }
                100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
              }
              .copy-highlight {
                outline: 2px solid #22d3ee !important; outline-offset: 2px;
                background: rgba(34, 211, 238, 0.1) !important;
              }
              img { max-width: 100%; height: auto; }
              table { max-width: 100%; border-collapse: collapse; }
              td, th { padding: 8px; }
              blockquote { border-left: 3px solid #3f3f46; margin: 16px 0; padding-left: 16px; color: #a1a1aa; }
              pre, code {
                background: #18181b; border-radius: 6px;
                font-family: 'Monaco', 'Menlo', 'JetBrains Mono', monospace; font-size: 13px; position: relative;
              }
              pre { padding: 16px; padding-right: 50px; overflow-x: auto; border: 1px solid #27272a; }
              code { padding: 2px 6px; }
              pre code { padding: 0; background: transparent; }
              .copyable { position: relative; cursor: pointer; transition: all 0.2s ease; }
              .copyable:hover { background: #27272a; }
              .copy-btn {
                position: absolute; top: 8px; right: 8px; background: #22d3ee; color: #000;
                border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;
                cursor: pointer; opacity: 0; transition: opacity 0.2s ease;
              }
              pre:hover .copy-btn, .copyable:hover .copy-btn { opacity: 1; }
              .copy-btn:hover { background: #06b6d4; }
              .copy-btn.copied { background: #22c55e; }
              a.copyable::after { content: '📋'; font-size: 10px; margin-left: 4px; opacity: 0.5; }
              hr { border: none; border-top: 1px solid #3f3f46; margin: 16px 0; }
              .gmail_quote, .gmail_attr { color: #a1a1aa; }
              .MsoNormal { margin: 0; }
            </style>
          </head>
          <body>
            ${email.body_html}
            <script>
              document.querySelectorAll('pre').forEach(pre => {
                const btn = document.createElement('button');
                btn.className = 'copy-btn'; btn.textContent = 'Copy';
                btn.onclick = async (e) => {
                  e.stopPropagation();
                  const code = pre.querySelector('code') || pre;
                  try {
                    await navigator.clipboard.writeText(code.textContent || code.innerText);
                    btn.textContent = 'Copied!'; btn.classList.add('copied');
                    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
                  } catch (err) { console.error('Failed to copy:', err); }
                };
                pre.style.position = 'relative'; pre.appendChild(btn);
              });
              function showCopyToast(message) {
                const existing = document.querySelector('.tap-copy-hint');
                if (existing) existing.remove();
                const t = document.createElement('div'); t.className = 'tap-copy-hint'; t.textContent = message;
                document.body.appendChild(t); setTimeout(() => t.remove(), 2000);
              }
              document.querySelectorAll('a[href]').forEach(link => {
                link.classList.add('copyable');
                let pressTimer, lastTap = 0;
                link.addEventListener('touchstart', (e) => {
                  pressTimer = setTimeout(() => {
                    e.preventDefault();
                    navigator.clipboard.writeText(link.href).then(() => {
                      link.classList.add('copy-highlight'); showCopyToast('✓ Link copied!');
                      setTimeout(() => link.classList.remove('copy-highlight'), 1500);
                    });
                  }, 500);
                });
                link.addEventListener('touchend', () => clearTimeout(pressTimer));
                link.addEventListener('touchmove', () => clearTimeout(pressTimer));
                link.addEventListener('click', (e) => {
                  const now = Date.now();
                  if (now - lastTap < 300) {
                    e.preventDefault();
                    navigator.clipboard.writeText(link.href).then(() => {
                      link.classList.add('copy-highlight'); showCopyToast('✓ Link copied!');
                      setTimeout(() => link.classList.remove('copy-highlight'), 1500);
                    });
                  }
                  lastTap = now;
                });
              });
              document.querySelectorAll('code:not(pre code)').forEach(code => {
                code.classList.add('copyable'); code.style.cursor = 'pointer'; code.title = 'Tap to copy';
                code.onclick = async (e) => {
                  e.stopPropagation();
                  try {
                    await navigator.clipboard.writeText(code.textContent || code.innerText);
                    code.classList.add('copy-highlight'); showCopyToast('✓ Code copied!');
                    setTimeout(() => code.classList.remove('copy-highlight'), 1500);
                  } catch (err) { console.error('Failed to copy:', err); }
                };
              });
              const codePatterns = [/\\b[A-Z0-9]{6,8}\\b/g, /\\b\\d{4,8}\\b/g];
              document.body.querySelectorAll('*:not(script):not(style)').forEach(el => {
                if (el.children.length === 0 && el.textContent) {
                  const text = el.textContent.trim();
                  codePatterns.forEach(pattern => {
                    if (pattern.test(text) && text.length <= 20) {
                      el.classList.add('copyable'); el.style.cursor = 'pointer';
                      el.style.borderBottom = '1px dashed #22d3ee'; el.title = 'Tap to copy';
                      el.onclick = async (e) => {
                        e.stopPropagation();
                        try {
                          await navigator.clipboard.writeText(text);
                          el.classList.add('copy-highlight'); showCopyToast('✓ Copied: ' + text);
                          setTimeout(() => el.classList.remove('copy-highlight'), 1500);
                        } catch (err) { console.error('Failed to copy:', err); }
                      };
                    }
                  });
                }
              });
            </script>
          </body>
          </html>
        `;
        doc.open();
        doc.write(htmlContent);
        doc.close();
      }
    }
  };

  useEffect(() => {
    if (open && viewMode === "html" && email?.body_html) {
      const timeoutId = setTimeout(() => writeIframeContent(), 50);
      return () => clearTimeout(timeoutId);
    }
  }, [email?.body_html, viewMode, open]);

  if (!email) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      weekday: "short", year: "numeric", month: "short",
      day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const copyEmailContent = async () => {
    const content = viewMode === "html" ? email.body_html : email.body_text;
    if (content) {
      await navigator.clipboard.writeText(content);
      toast.success("Email content copied!");
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(email.id);
      onOpenChange(false);
    }
  };

  const hasHtml = !!email.body_html;
  const hasText = !!email.body_text;

  const senderInitial = (email.from_email || "?")[0].toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`flex flex-col p-0 gap-0 border-0 bg-background/80 backdrop-blur-2xl shadow-2xl transition-all duration-500 overflow-hidden ${
          isFullscreen 
            ? "max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh] rounded-2xl" 
            : "max-w-4xl max-h-[85vh] rounded-2xl"
        }`}
      >
        {/* Ambient glow */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Premium header with spotlight */}
        <div 
          ref={headerRef}
          onMouseMove={handleMouseMove}
          className="relative px-6 py-5 border-b border-border/30 shrink-0 overflow-hidden"
        >
          {/* Mouse spotlight */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none transition-opacity duration-300"
            style={{
              background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.15), transparent 70%)`,
            }}
          />

          <div className="flex items-start gap-4 relative z-10">
            {/* Sender avatar */}
            <div className="shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-border/30 flex items-center justify-center">
              <span className="text-sm font-bold text-primary">{senderInitial}</span>
            </div>

            <div className="flex-1 min-w-0">
              <DialogTitle className="text-lg font-semibold mb-2 leading-tight">
                {email.subject || "(No subject)"}
              </DialogTitle>
              <DialogDescription className="sr-only">
                Email from {cleanSenderEmail(email.from_email)}
              </DialogDescription>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-primary/60" />
                  <span className="font-mono text-xs">{cleanSenderEmail(email.from_email)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-primary/60" />
                  <span className="text-xs">{formatDate(email.received_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Premium toolbar */}
        <div className="px-5 py-2.5 border-b border-border/20 flex items-center justify-between gap-3 shrink-0 bg-secondary/10">
          {/* View mode toggle pills */}
          <div className="flex items-center rounded-xl bg-secondary/40 p-0.5 backdrop-blur-sm">
            {hasHtml && (
              <button
                onClick={() => setViewMode("html")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  viewMode === "html"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                HTML
              </button>
            )}
            {hasText && (
              <button
                onClick={() => setViewMode("text")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                  viewMode === "text"
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Text
              </button>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center rounded-xl bg-secondary/30 p-0.5">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={copyEmailContent}
              className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all duration-200"
              title="Copy content"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
                title="Delete email"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Email content */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {viewMode === "html" && hasHtml ? (
            <iframe
              ref={iframeRef}
              title="Email Content"
              className="w-full h-full border-0 bg-transparent"
              sandbox="allow-same-origin allow-scripts"
              style={{ minHeight: "300px" }}
              onLoad={writeIframeContent}
            />
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                {email.body_text || (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 border border-border/30 flex items-center justify-center mb-4">
                      <Mail className="w-6 h-6 text-primary/40" />
                    </div>
                    <p className="text-sm">No content available</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDetailDialog;
