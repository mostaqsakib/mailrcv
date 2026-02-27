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
  AlertCircle,
  Trash2,
  RefreshCw,
  Loader2,
  Forward,
  Save
} from "lucide-react";
import { toast } from "sonner";
import { getAllDomains, addDomain, deleteDomain, verifyDomain, updateDomainForwarding, type Domain } from "@/lib/email-service";

const DomainsPage = () => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingForwardId, setEditingForwardId] = useState<string | null>(null);
  const [forwardEmail, setForwardEmail] = useState("");
  const [savingForwardId, setSavingForwardId] = useState<string | null>(null);

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

  const handleVerifyDomain = async (domain: Domain) => {
    setVerifyingId(domain.id);
    try {
      const result = await verifyDomain(domain.id, domain.domain_name);
      if (result.verified) {
        setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, is_verified: true } : d));
        toast.success(`${domain.domain_name} verified successfully!`);
      } else {
        const issues = [];
        if (!result.mx_valid) issues.push("MX record not found");
        if (!result.txt_valid) issues.push("TXT verification record not found");
        toast.error(issues.join(". "));
      }
    } catch {
      toast.error("Verification check failed");
    } finally {
      setVerifyingId(null);
    }
  };

  const handleDeleteDomain = async (domain: Domain) => {
    if (!confirm(`Delete ${domain.domain_name}? This will remove all associated aliases and emails.`)) return;
    
    setDeletingId(domain.id);
    const success = await deleteDomain(domain.id);
    if (success) {
      setDomains(prev => prev.filter(d => d.id !== domain.id));
      toast.success(`${domain.domain_name} deleted`);
    } else {
      toast.error("Failed to delete domain");
    }
    setDeletingId(null);
  };

  const handleSaveForwarding = async (domain: Domain) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (forwardEmail && !emailRegex.test(forwardEmail)) {
      toast.error("Invalid email format");
      return;
    }

    setSavingForwardId(domain.id);
    try {
      await updateDomainForwarding(domain.id, forwardEmail);
      setDomains(prev => prev.map(d => d.id === domain.id ? { ...d, forward_to_email: forwardEmail || null } : d));
      setEditingForwardId(null);
      toast.success(forwardEmail ? "Forwarding configured!" : "Forwarding removed");
    } catch {
      toast.error("Failed to update forwarding");
    } finally {
      setSavingForwardId(null);
    }
  };

  const startEditingForward = (domain: Domain) => {
    setEditingForwardId(domain.id);
    setForwardEmail(domain.forward_to_email || "");
  };

  const copyToClipboard = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="min-h-screen bg-background relative pt-safe pb-safe">
      <div className="fixed inset-0 grid-dots opacity-30 pointer-events-none" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[200px] pointer-events-none" />
      
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
                    
                    {/* Forwarding config */}
                    <div className="mt-3">
                      {editingForwardId === domain.id ? (
                        <div className="flex items-center gap-2">
                          <Forward className="w-4 h-4 text-muted-foreground shrink-0" />
                          <Input
                            type="email"
                            placeholder="forward-to@example.com"
                            value={forwardEmail}
                            onChange={(e) => setForwardEmail(e.target.value)}
                            className="flex-1 h-8 text-sm font-mono"
                          />
                          <Button 
                            variant="hero" 
                            size="sm" 
                            className="h-8"
                            onClick={() => handleSaveForwarding(domain)}
                            disabled={savingForwardId === domain.id}
                          >
                            {savingForwardId === domain.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8" onClick={() => setEditingForwardId(null)}>
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => startEditingForward(domain)}
                          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Forward className="w-4 h-4" />
                          {domain.forward_to_email ? (
                            <span>Forwarding to <span className="text-primary font-mono">{domain.forward_to_email}</span></span>
                          ) : (
                            <span>Set up forwarding</span>
                          )}
                        </button>
                      )}
                    </div>

                    {!domain.is_verified && (
                      <div className="mt-4 p-4 rounded-xl bg-secondary/50 border border-border">
                        <p className="text-sm font-medium mb-3">DNS Configuration Required:</p>
                        <div className="space-y-2 text-sm font-mono">
                          <div className="flex items-center justify-between p-2 rounded bg-background/50">
                            <span className="text-muted-foreground">MX Record:</span>
                            <div className="flex items-center gap-2">
                              <span>mx.mailrcv.site</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard("mx.mailrcv.site", "MX record")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-background/50">
                            <span className="text-muted-foreground">MX Priority:</span>
                            <span>10</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded bg-background/50">
                            <span className="text-muted-foreground">TXT Record:</span>
                            <div className="flex items-center gap-2">
                              <span className="truncate max-w-[200px]">mailrcv-verify={domain.verification_code.substring(0, 8)}...</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6"
                                onClick={() => copyToClipboard(`mailrcv-verify=${domain.verification_code}`, "TXT record")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!domain.is_verified && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVerifyDomain(domain)}
                        disabled={verifyingId === domain.id}
                      >
                        {verifyingId === domain.id ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Verify
                      </Button>
                    )}
                    
                    {domain.is_verified && (
                      <Link to={`/inbox/test?domain=${domain.domain_name}`}>
                        <Button variant="glass" size="sm">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Test
                        </Button>
                      </Link>
                    )}
                    
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeleteDomain(domain)}
                      disabled={deletingId === domain.id}
                    >
                      {deletingId === domain.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full DNS Setup Guide */}
        <div className="mt-12 p-6 rounded-2xl glass">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Complete DNS Setup Guide
          </h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Step 1: Add Your Domain</h4>
              <p className="text-sm text-muted-foreground">Click "Add Domain" above and enter your domain name (e.g., <code className="text-primary font-mono">yourdomain.com</code>).</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Step 2: Configure MX Record</h4>
              <p className="text-sm text-muted-foreground mb-3">Go to your domain's DNS settings (Cloudflare, Namecheap, GoDaddy, etc.) and add an MX record:</p>
              <div className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-3 text-xs font-semibold border-b border-border bg-background/30">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Value</span>
                  <span>Priority</span>
                </div>
                <div className="grid grid-cols-4 gap-2 p-3 text-sm font-mono items-center">
                  <span className="text-primary">MX</span>
                  <span>@ (root)</span>
                  <div className="flex items-center gap-1">
                    <span>mx.mailrcv.site</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copyToClipboard("mx.mailrcv.site", "MX value")}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <span>10</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Step 3: Add TXT Verification Record</h4>
              <p className="text-sm text-muted-foreground mb-3">Add a TXT record with the verification code shown in your domain's card above:</p>
              <div className="rounded-xl bg-secondary/50 border border-border overflow-hidden">
                <div className="grid grid-cols-3 gap-2 p-3 text-xs font-semibold border-b border-border bg-background/30">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Value</span>
                </div>
                <div className="grid grid-cols-3 gap-2 p-3 text-sm font-mono">
                  <span className="text-primary">TXT</span>
                  <span>@ (root)</span>
                  <span>mailrcv-verify=&lt;your-code&gt;</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Step 4: Verify Domain</h4>
              <p className="text-sm text-muted-foreground">After adding DNS records, wait a few minutes for propagation and click the <strong>"Verify"</strong> button. DNS changes can take up to 24-48 hours in some cases.</p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-primary mb-2">Step 5: Start Receiving Emails</h4>
              <p className="text-sm text-muted-foreground">Once verified, any email sent to <code className="text-primary font-mono">anything@yourdomain.com</code> will appear in your inbox. Optionally, set up forwarding to receive emails in your real inbox.</p>
            </div>

            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-xs text-muted-foreground">
                <strong className="text-primary">⚠️ Important:</strong> If your domain uses Cloudflare, make sure to set MX record Name to <code className="font-mono">@</code> for root domain and set Priority to <code className="font-mono">10</code>. Remove any existing conflicting MX records.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DomainsPage;
