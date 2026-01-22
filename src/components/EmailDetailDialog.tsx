import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Minimize2
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
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

  // Auto-select HTML view if available
  useEffect(() => {
    if (email?.body_html) {
      setViewMode("html");
    } else if (email?.body_text) {
      setViewMode("text");
    }
  }, [email]);

  // Update iframe content when email changes or view mode changes
  const writeIframeContent = () => {
    if (viewMode === "html" && email?.body_html && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        // Create a complete HTML document with proper styling
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              * {
                box-sizing: border-box;
              }
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #e4e4e7;
                background: transparent;
                margin: 0;
                padding: 0;
                word-wrap: break-word;
                overflow-wrap: break-word;
              }
              a {
                color: #60a5fa;
              }
              img {
                max-width: 100%;
                height: auto;
              }
              table {
                max-width: 100%;
                border-collapse: collapse;
              }
              td, th {
                padding: 8px;
              }
              blockquote {
                border-left: 3px solid #3f3f46;
                margin: 16px 0;
                padding-left: 16px;
                color: #a1a1aa;
              }
              pre, code {
                background: #27272a;
                border-radius: 4px;
                font-family: 'Monaco', 'Menlo', monospace;
                font-size: 13px;
              }
              pre {
                padding: 12px;
                overflow-x: auto;
              }
              code {
                padding: 2px 4px;
              }
              hr {
                border: none;
                border-top: 1px solid #3f3f46;
                margin: 16px 0;
              }
              /* Gmail forward styling */
              .gmail_quote, .gmail_attr {
                color: #a1a1aa;
              }
              /* Outlook forward styling */
              .MsoNormal {
                margin: 0;
              }
              /* Common forward headers */
              div[style*="border-left"], 
              div[style*="border-top"] {
                border-color: #3f3f46 !important;
              }
            </style>
          </head>
          <body>
            ${email.body_html}
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
      // Small delay to ensure iframe is mounted and ready
      const timeoutId = setTimeout(() => {
        writeIframeContent();
      }, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [email?.body_html, viewMode, open]);

  if (!email) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={`flex flex-col p-0 gap-0 glass-strong border-border/50 transition-all duration-300 ${
          isFullscreen 
            ? "max-w-[95vw] max-h-[95vh] w-[95vw] h-[95vh]" 
            : "max-w-4xl max-h-[85vh]"
        }`}
      >
        <DialogHeader className="px-6 py-4 border-b border-border/50 shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-xl font-semibold mb-2 pr-8">
                {email.subject || "(No subject)"}
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <User className="w-4 h-4" />
                  <span className="font-mono">{email.from_email}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  <span>{formatDate(email.received_at)}</span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* View mode toggle and actions */}
        <div className="px-6 py-3 border-b border-border/50 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-2">
            {hasHtml && (
              <Button
                variant={viewMode === "html" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("html")}
                className="gap-1.5"
              >
                <Code className="w-4 h-4" />
                HTML
              </Button>
            )}
            {hasText && (
              <Button
                variant={viewMode === "text" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("text")}
                className="gap-1.5"
              >
                <FileText className="w-4 h-4" />
                Text
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-1.5"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={copyEmailContent} className="gap-1.5">
              <Copy className="w-4 h-4" />
              Copy
            </Button>
            {onDelete && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleDelete}
                className="gap-1.5 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Email content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {viewMode === "html" && hasHtml ? (
            <iframe
              ref={iframeRef}
              title="Email Content"
              className="w-full h-full border-0 bg-transparent"
              sandbox="allow-same-origin"
              style={{ minHeight: "300px" }}
              onLoad={writeIframeContent}
            />
          ) : (
            <ScrollArea className="h-full">
              <div className="p-6 whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                {email.body_text || "(No content)"}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDetailDialog;
