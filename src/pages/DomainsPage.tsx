import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Globe, 
  Plus, 
  Check, 
  X, 
  Copy, 
  ArrowLeft,
  Mail,
  ExternalLink,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { getAllDomains, addDomain, type Domain } from "@/lib/email-service";

const DomainsPage = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDomains();
  }, []);

  const loadDomains = async () => {
    setLoading(true);
    const data = await getAllDomains();
    setDomains(data);
    setLoading(false);
  };

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    
    // Basic domain validation
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
    if (!domainRegex.test(newDomain)) {
      toast.error("Invalid domain format");
      return;
    }

    try {
      const domain = await addDomain(newDomain);
      if (domain) {
        setDomains([domain, ...domains]);
        setNewDomain("");
        setIsAdding(false);
        toast.success("Domain added! Configure DNS to verify.");
      }
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Domain already exists");
      } else {
        toast.error("Failed to add domain");
      }
    }
  };

  const copyVerificationCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    toast.success("Verification code copied!");
  };

  return (
    <div className="min-h-screen bg-background relative pt-safe pb-safe">
      {/* Background effects */}
      <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/50">
        <div className="glass-strong">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link to="/">
                  <Button variant="ghost" size="icon">
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center shadow-blue">
                    <Mail className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-semibold">MailRCV</span>
                </Link>
                <span className="text-muted-foreground">/</span>
                <h1 className="text-lg font-semibold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Domains
                </h1>
              </div>
              
              <Button variant="default" onClick={() => setIsAdding(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 relative z-10">
        {/* Add domain form */}
        {isAdding && (
          <div className="mb-8 p-6 rounded-2xl glass animate-slide-up">
            <h2 className="text-lg font-semibold mb-4">Add Custom Domain</h2>
            <div className="flex gap-3">
              <Input
                type="text"
                placeholder="yourdomain.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1 font-mono"
              />
              <Button variant="hero" onClick={handleAddDomain}>
                <Check className="w-4 h-4 mr-2" />
                Add
              </Button>
              <Button variant="ghost" onClick={() => setIsAdding(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Domains list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : domains.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-24 h-24 mx-auto mb-8 rounded-2xl glass flex items-center justify-center">
              <Globe className="w-12 h-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-3">No domains yet</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              Add your custom domain to create unlimited email aliases with your own branding.
            </p>
            <Button variant="hero" onClick={() => setIsAdding(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Domain
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {domains.map((domain) => (
              <div key={domain.id} className="p-6 rounded-2xl glass">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Globe className="w-5 h-5 text-primary" />
                      <span className="text-xl font-semibold font-mono">{domain.domain_name}</span>
                      {domain.is_verified ? (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary flex items-center gap-1">
                          <Check className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-destructive/20 text-destructive flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </div>
                    
                    {!domain.is_verified && (
                      <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-sm font-medium mb-3">DNS Configuration Required:</p>
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex items-center justify-between p-2 rounded bg-background/50">
                            <span className="text-muted-foreground">MX Record:</span>
                            <span>mx.mailrcv.site</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-background/50">
                            <span className="text-muted-foreground">TXT Record:</span>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">mailrcv-verify={domain.verification_code.substring(0, 8)}...</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyVerificationCode(`mailrcv-verify=${domain.verification_code}`)}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/inbox/test?domain=${domain.domain_name}`}>
                    <Button variant="glass" size="sm">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Test
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info box */}
        <div className="mt-12 p-6 rounded-2xl glass">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            How It Works
          </h3>
          <ol className="space-y-2 text-muted-foreground">
            <li>1. Add your domain above</li>
            <li>2. Configure MX records to point to <code className="text-primary font-mono">mx.mailrcv.site</code></li>
            <li>3. Add the TXT verification record</li>
            <li>4. Once verified, any email to <code className="text-primary font-mono">*@yourdomain.com</code> will be received</li>
            <li>5. Set up forwarding to get emails in your real inbox</li>
          </ol>
        </div>
      </main>
    </div>
  );
};

export default DomainsPage;
