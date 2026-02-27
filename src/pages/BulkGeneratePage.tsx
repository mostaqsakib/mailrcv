import { useState, useCallback } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shuffle, Download, Copy, Check, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useDomains } from "@/hooks/use-domains";

const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];
const SITE_URL = "https://mailrcv.site";

const firstNames = [
  "james","john","robert","michael","david","william","richard","joseph","thomas","christopher",
  "mary","patricia","jennifer","linda","elizabeth","barbara","susan","jessica","sarah","karen",
  "daniel","matthew","anthony","mark","donald","steven","paul","andrew","joshua","kenneth",
  "emma","olivia","sophia","isabella","mia","charlotte","amelia","harper","evelyn","abigail",
  "carlos","miguel","jose","juan","luis","diego","alejandro","gabriel","rafael","pablo",
  "maria","carmen","rosa","lucia","elena","sofia","valentina","camila","mariana",
  "lucas","liam","noah","oliver","felix","max","leon","theo","oscar","hugo",
  "anna","julia","laura","clara","marie","nina","eva","lisa","sara","hanna",
  "wei","chen","ming","jin","hao","yan","lei","feng","yuki","kenji",
  "mei","lin","xiao","ying","sakura","hana","yuna","mina","sora","aiko",
  "omar","ali","ahmed","hassan","karim","tariq","malik","yusuf","amir","rami",
  "fatima","layla","amira","nadia","leila","yasmin","zahra","dina","rania",
  "arjun","raj","vikram","arun","rohan","kiran","sanjay","amit","rahul","varun",
  "priya","ananya","divya","neha","riya","pooja","shreya","kavya","aisha","zara",
  "kwame","kofi","adebayo","chidi","emeka","olu","sekou","amadou","mamadou","ibrahima",
  "amara","ayana","zuri","nia","imani","adaora","chiamaka","folake","ngozi","adeola"
];

const lastNames = [
  "smith","johnson","williams","brown","jones","garcia","miller","davis","rodriguez","martinez",
  "wilson","anderson","taylor","thomas","hernandez","moore","martin","jackson","thompson","white",
  "mueller","schmidt","schneider","fischer","weber","meyer","wagner","becker","hoffmann","schulz",
  "rossi","russo","ferrari","esposito","bianchi","romano","colombo","ricci","marino","greco",
  "dubois","moreau","laurent","simon","michel","leroy","roux","bertrand","morel",
  "gonzalez","lopez","perez","sanchez","ramirez","torres","flores","rivera","gomez","diaz",
  "wang","li","zhang","liu","chen","yang","huang","zhao","wu","zhou",
  "kim","lee","park","choi","jung","kang","cho","yoon","jang","lim",
  "tanaka","yamamoto","suzuki","watanabe","ito","yamada","nakamura","kobayashi","kato","yoshida",
  "patel","sharma","singh","kumar","gupta","das","reddy","khan","malik",
  "okonkwo","adeyemi","mensah","diallo","traore","coulibaly","ndiaye","sy","ba","sow"
];

const generateRandomName = (): string => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const patterns = [
    () => `${firstName}.${lastName}`,
    () => `${firstName}${lastName}`,
    () => `${firstName}_${lastName}`,
    () => `${firstName}.${lastName}${Math.floor(Math.random() * 99) + 1}`,
    () => `${firstName}${Math.floor(Math.random() * 999) + 1}`,
    () => `${firstName[0]}${lastName}`,
    () => `${firstName}${lastName[0]}`,
    () => `${firstName}.${lastName[0]}`,
    () => `${lastName}.${firstName}`,
  ];
  return patterns[Math.floor(Math.random() * patterns.length)]();
};

const getInboxUrl = (username: string, domain: string): string => {
  const param = domain !== DEFAULT_DOMAINS[0] ? `${username}@${domain}` : username;
  return `${SITE_URL}/inbox/${param}`;
};

interface GeneratedEmail {
  email: string;
  link: string;
}

const BulkGeneratePage = () => {
  const [quantity, setQuantity] = useState("10");
  const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAINS[0]);
  const [generated, setGenerated] = useState<GeneratedEmail[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);
  const { domains } = useDomains();

  const handleGenerate = useCallback(() => {
    const count = Math.min(Math.max(parseInt(quantity) || 1, 1), 500);
    const usedNames = new Set<string>();
    const results: GeneratedEmail[] = [];

    while (results.length < count) {
      const name = generateRandomName();
      if (usedNames.has(name)) continue;
      usedNames.add(name);
      const email = `${name}@${selectedDomain}`;
      results.push({ email, link: getInboxUrl(name, selectedDomain) });
    }

    setGenerated(results);
    toast.success(`${count} email addresses generated!`);
  }, [quantity, selectedDomain]);

  const handleCopyAll = async () => {
    const text = generated.map((e) => `${e.email}\t${e.link}`).join("\n");
    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    toast.success("All emails copied!");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleCopyOne = async (email: string) => {
    await navigator.clipboard.writeText(email);
    toast.success("Copied!");
  };

  const handleExportCSV = () => {
    const header = "Email Address,Inbox Link";
    const rows = generated.map((e) => `${e.email},${e.link}`);
    const csv = [header, ...rows].join("\n");
    downloadFile(csv, "mailrcv-emails.csv", "text/csv");
  };

  const handleExportTXT = () => {
    const rows = generated.map((e) => `${e.email}\t${e.link}`);
    const txt = rows.join("\n");
    downloadFile(txt, "mailrcv-emails.txt", "text/plain");
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${filename} downloaded!`);
  };

  return (
    <div className="min-h-screen pt-safe bg-background">
      <Header />
      <main className="container px-4 py-24 sm:py-32 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
            Bulk Email <span className="gradient-text">Generator</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Generate multiple disposable email addresses at once and export them as CSV or TXT.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4 p-5 rounded-2xl bg-card border border-border/50 mb-6">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Quantity</label>
            <Input
              type="number"
              min={1}
              max={500}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="How many?"
              className="font-mono text-lg h-12"
            />
          </div>
          <div className="w-full sm:w-48 space-y-1.5">
            <label className="text-sm font-medium text-foreground">Domain</label>
            <Select value={selectedDomain} onValueChange={setSelectedDomain}>
              <SelectTrigger className="h-12 font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {domains.map((d) => (
                  <SelectItem key={d} value={d} className="font-mono">{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerate} variant="hero" size="lg" className="h-12 gap-2">
            <Shuffle className="w-4 h-4" />
            Generate
          </Button>
        </div>

        {/* Results */}
        {generated.length > 0 && (
          <div className="space-y-4 animate-slide-up">
            {/* Action bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-card border border-border/50">
              <span className="text-sm text-muted-foreground font-medium">
                {generated.length} email addresses
              </span>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyAll} className="gap-1.5">
                  {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy All
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportTXT} className="gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  TXT
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerate} className="gap-1.5">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Regenerate
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setGenerated([])} className="gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </Button>
              </div>
            </div>

            {/* Email list */}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
              <div className="grid grid-cols-[1fr_1fr_auto] gap-0 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50 px-4 py-2.5 border-b border-border/50">
                <span>Email Address</span>
                <span>Inbox Link</span>
                <span className="w-8" />
              </div>
              <div className="max-h-[60vh] overflow-y-auto divide-y divide-border/30">
                {generated.map((item, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center px-4 py-2.5 hover:bg-muted/30 transition-colors group text-sm"
                  >
                    <span className="font-mono text-foreground truncate">{item.email}</span>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-primary/80 hover:text-primary truncate text-xs"
                    >
                      {item.link}
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyOne(item.email)}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default BulkGeneratePage;
