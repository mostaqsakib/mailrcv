import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Mail, 
  Clock, 
  User, 
  Copy, 
  Trash2,
  X,
  FileText,
  Code
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import type { ReceivedEmail } from "@/lib/email-service";

interface EmailDetailDialogProps {
  email: ReceivedEmail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (emailId: string) => void;
}

const EmailDetailDialog = ({ email, open, onOpenChange, onDelete }: EmailDetailDialogProps) => {
  const [viewMode, setViewMode] = useState<"text" | "html">("text");

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
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 glass-strong border-border/50">
        <DialogHeader className="px-6 py-4 border-b border-border/50">
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
        <div className="px-6 py-3 border-b border-border/50 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
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
          </div>
          
          <div className="flex items-center gap-2">
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
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-6">
            {viewMode === "html" && hasHtml ? (
              <div 
                className="prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: email.body_html! }}
              />
            ) : (
              <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-foreground/90">
                {email.body_text || "(No content)"}
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmailDetailDialog;
