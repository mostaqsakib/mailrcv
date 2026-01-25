import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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

        // Debug: help diagnose "plain text rendered as one paragraph" issues
        // (kept as console.debug to avoid noisy logs in production)
        try {
          const raw = (data as any)?.body_html as string | null | undefined;
          if (raw) {
            const hasNewlines = raw.includes("\n") || raw.includes("\r");
            const hasMeaningfulHtml = /<(br\s*\/?>|p|pre|blockquote|table|tr|td|th|ul|ol|li|h1|h2|h3)[\s>]/i.test(raw);
            console.debug("[EmailDetail] content heuristics", {
              emailId,
              hasNewlines,
              hasMeaningfulHtml,
              rawPreview: raw.slice(0, 220),
            });
          }
        } catch {
          // ignore
        }
        
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
    if (!doc) return;

    const isDark = resolvedTheme === 'dark';
    const bgColor = isDark ? '#0d1117' : '#ffffff';
    const textColor = isDark ? '#f4f4f5' : '#18181b';
    const linkColor = isDark ? '#22d3ee' : '#0891b2';
    const quoteColor = isDark ? '#a1a1aa' : '#71717a';
    const quoteBorder = isDark ? '#3f3f46' : '#d4d4d8';
    const codeBg = isDark ? '#18181b' : '#f4f4f5';
    const codeBorder = isDark ? '#27272a' : '#e4e4e7';
    const hrColor = isDark ? '#3f3f46' : '#e4e4e7';

    const raw = email.body_html;
    const looksLikeFullDoc = /<!doctype/i.test(raw) || /<html[\s>]/i.test(raw) || /<head[\s>]/i.test(raw);

    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#039;");

    // Some providers send "HTML" that is basically plain text with newlines.
    // In that case we must preserve line breaks, otherwise everything collapses into one line.
    const hasNewlines = raw.includes("\n") || raw.includes("\r");
    // NOTE: Some senders wrap plain text in a single <div>/<span>/etc. That should still be treated as plain text.
    // We only consider it "meaningful HTML" if it contains true layout/line-break elements.
    const hasMeaningfulHtml = /<(br\s*\/?>|p|pre|blockquote|table|tr|td|th|ul|ol|li|h1|h2|h3)[\s>]/i.test(raw);

    // Special case: many senders wrap a plaintext email inside a single <p> and rely on \n for line breaks.
    // Browsers collapse those newlines, so we must treat it as plain text.
    const trimmed = raw.trim();
    const isSinglePWrapper =
      /^<p[\s>][\s\S]*<\/p>$/i.test(trimmed) &&
      !/<\/p>\s*<p[\s>]/i.test(trimmed) &&
      !/<br\s*\/?>/i.test(trimmed);

    // If there's no real structure tags OR it's the "single <p> + \n" case, render with pre-wrap.
    const treatAsPlainTextHtml = (hasNewlines && isSinglePWrapper) || (!hasMeaningfulHtml && raw.length > 0);

    const styleText = `
      * { box-sizing: border-box !important; }
      html {
        background: ${bgColor} !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      body {
        background: ${bgColor} !important;
        color: ${textColor} !important;
        margin: 0 !important;
        padding: 24px !important;
        min-height: 100%;
        ${treatAsPlainTextHtml ? "white-space: pre-wrap;" : ""}
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        font-size: 15px;
        line-height: 1.8;
        word-wrap: break-word;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      /* Preserve link colors */
      a { color: ${linkColor} !important; text-decoration: underline; }
      /* Center email content nicely without forcing full width */
      body > table, body > div, body > center {
        margin-left: auto !important;
        margin-right: auto !important;
      }
      img { max-width: 100%; height: auto; }
      ${
        treatAsPlainTextHtml
          ? `
      /* Preserve newlines even if the sender wrapped the text inside elements */
      body * { white-space: inherit; }
      `
          : ""
      }
      a { 
        color: ${linkColor}; 
        text-decoration: underline;
        text-underline-offset: 2px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      a:hover { 
        text-decoration: underline; 
        opacity: 0.8;
      }
      /* Link action popup */
      .link-popup {
         position: fixed !important;
        background: ${isDark ? '#1f2937' : '#ffffff'};
        border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
        border-radius: 12px;
        padding: 8px;
        box-shadow: 0 10px 25px rgba(0,0,0,0.2);
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 4px;
        min-width: 160px;
         width: max-content !important;
         max-width: calc(100vw - 20px) !important;
        animation: popIn 0.15s ease-out;
      }
      @keyframes popIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
      }
      .link-popup button {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 14px;
        border: none;
        background: transparent;
        color: ${textColor};
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        border-radius: 8px;
        transition: background 0.15s;
        text-align: left;
      }
      .link-popup button:hover {
        background: ${isDark ? '#374151' : '#f3f4f6'};
      }
      .link-popup button.primary {
        color: ${linkColor};
      }
      .link-popup-overlay {
         position: fixed !important;
        inset: 0;
        z-index: 9999;
      }
      img { max-width: 100%; height: auto; }
      table { max-width: 100%; }
      blockquote {
        border-left: 3px solid ${quoteBorder};
        margin: 16px 0;
        padding-left: 16px;
        color: ${quoteColor};
      }
      pre, code {
        background: ${codeBg};
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
        font-size: 13px;
        color: ${textColor};
      }
      pre { padding: 16px; overflow-x: auto; border: 1px solid ${codeBorder}; }
      code { padding: 2px 6px; }
      pre code { padding: 0; background: transparent; }
      pre.plaintext {
        margin: 0;
        padding: 24px;
        background: transparent;
        border: 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        word-break: break-word;
        font-size: 16px;
        line-height: 1.75;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      }
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
    `;

    const scriptText = `
      function showCopyToast(message) {
        const existing = document.querySelector('.tap-copy-hint');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'tap-copy-hint';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }


      // Convert plain text URLs to clickable links
      function detectAndWrapUrls() {
        const walker = document.createTreeWalker(
          document.body,
          NodeFilter.SHOW_TEXT,
          null,
          false
        );

        const textNodes = [];
        while (walker.nextNode()) {
          const node = walker.currentNode;
          // Skip if parent is already a link, script, style
          if (node.parentElement && 
              !['SCRIPT', 'STYLE', 'A'].includes(node.parentElement.tagName)) {
            textNodes.push(node);
          }
        }

        // URL pattern - matches http, https, and www URLs
        const urlPattern = /(https?:\\/\\/[^\\s<>]+|www\\.[^\\s<>]+)/gi;

        textNodes.forEach(node => {
          const text = node.textContent;
          if (!urlPattern.test(text)) return;
          urlPattern.lastIndex = 0;

          const fragment = document.createDocumentFragment();
          let lastIndex = 0;
          let match;

          while ((match = urlPattern.exec(text)) !== null) {
            // Add text before the URL
            if (match.index > lastIndex) {
              fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
            }

            // Create link element
            const link = document.createElement('a');
            let url = match[0];
            // Add protocol if missing
            if (url.startsWith('www.')) {
              url = 'https://' + url;
            }
            link.href = url;
            link.textContent = match[0];
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
            fragment.appendChild(link);

            lastIndex = match.index + match[0].length;
          }

          // Add remaining text
          if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
          }

          if (fragment.childNodes.length > 0) {
            node.parentNode.replaceChild(fragment, node);
          }
        });
      }

      // Run URL detection first
      detectAndWrapUrls();


      // Link popup functionality
      let currentPopup = null;
      let currentOverlay = null;

      function closePopup() {
        if (currentPopup) {
          currentPopup.remove();
          currentPopup = null;
        }
        if (currentOverlay) {
          currentOverlay.remove();
          currentOverlay = null;
        }
      }

      function showLinkPopup(link, e) {
        e.preventDefault();
        closePopup();

        const href = link.href;
        
        // Use click/touch position for popup placement
        const clickX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : 0);
        const clickY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : 0);

        // Create overlay
        currentOverlay = document.createElement('div');
        currentOverlay.className = 'link-popup-overlay';
        currentOverlay.onclick = closePopup;
        document.body.appendChild(currentOverlay);

        // Create popup
        currentPopup = document.createElement('div');
        currentPopup.className = 'link-popup';
        
        currentPopup.innerHTML = \`
          <button class="primary" data-action="open">
            <span>🔗</span> Open Link
          </button>
          <button data-action="copy">
            <span>📋</span> Copy Link
          </button>
        \`;

        // Position popup near click/cursor position
        const popupWidth = 160;
        const popupHeight = 90;
        
        let top = clickY - popupHeight - 10; // Show above cursor
        let left = clickX - (popupWidth / 2); // Center on cursor
        
        // If popup would go above viewport, show below cursor
        if (top < 10) {
          top = clickY + 15;
        }
        // Keep within horizontal bounds
        if (left < 10) {
          left = 10;
        }
        if (left + popupWidth > window.innerWidth - 10) {
          left = window.innerWidth - popupWidth - 10;
        }
        // Keep within vertical bounds
        if (top + popupHeight > window.innerHeight - 10) {
          top = window.innerHeight - popupHeight - 10;
        }

        // Use !important so our layout-normalization CSS can't override positioning
        currentPopup.style.setProperty('top', top + 'px', 'important');
        currentPopup.style.setProperty('left', left + 'px', 'important');

        // Add click handlers
        currentPopup.querySelector('[data-action="open"]').onclick = () => {
          window.open(href, '_blank', 'noopener,noreferrer');
          closePopup();
        };

        currentPopup.querySelector('[data-action="copy"]').onclick = () => {
          navigator.clipboard.writeText(href).then(() => {
            showCopyToast('✓ Link copied!');
          });
          closePopup();
        };

        document.body.appendChild(currentPopup);
      }

      // Make all links interactive with popup
      document.querySelectorAll('a[href]').forEach(link => {
        link.setAttribute('target', '_blank');
        link.setAttribute('rel', 'noopener noreferrer');
        
        link.addEventListener('click', (e) => {
          showLinkPopup(link, e);
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
    `;

    let htmlContent = '';
    if (looksLikeFullDoc) {
      const parsed = new DOMParser().parseFromString(raw, 'text/html');
      const head = parsed.head || parsed.getElementsByTagName('head')[0] || parsed.documentElement;

      const styleEl = parsed.createElement('style');
      styleEl.textContent = styleText;
      head.appendChild(styleEl);

      const scriptEl = parsed.createElement('script');
      scriptEl.textContent = scriptText;
      parsed.body?.appendChild(scriptEl);

      htmlContent = '<!DOCTYPE html>\n' + parsed.documentElement.outerHTML;
    } else {
      const contentHtml =
        treatAsPlainTextHtml && email.body_text
          ? `<pre class="plaintext">${escapeHtml(email.body_text)}</pre>`
          : raw;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${styleText}</style>
        </head>
        <body>
           ${contentHtml}
          <script>${scriptText}</script>
        </body>
        </html>
      `;
    }

    doc.open();
    doc.write(htmlContent);
    doc.close();
    setContentWritten(true);
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
      <div className="min-h-screen bg-background flex flex-col">
        {/* Background effects */}
        <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
        
        {/* Header skeleton */}
        <header className="sticky top-0 z-40 glass-strong border-b border-border/50 pt-safe">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-32 rounded-full" />
                <div className="hidden sm:flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          </div>
        </header>

        {/* Email metadata skeleton */}
        <div className="border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>

        {/* Email content skeleton */}
        <main className="flex-1 relative z-10 pb-safe">
          <div className="container mx-auto px-4 py-6">
            <div className="glass rounded-2xl border border-border/50 overflow-hidden shadow-elegant p-6">
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-4/5" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-5/6" />
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-4/5" />
              </div>
            </div>
          </div>
        </main>
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
      <header className="sticky top-0 z-40 glass-strong border-b border-border/50 pt-safe">
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
                 sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
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
