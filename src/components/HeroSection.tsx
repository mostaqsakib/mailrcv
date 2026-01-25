import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, ArrowRight, Shuffle, Copy, Check, Lock, Eye, EyeOff, ChevronDown, ChevronUp, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

// Session storage key prefix
const SESSION_KEY_PREFIX = "mailrcv_session_";

// Default domains list (always available)
const DEFAULT_DOMAINS = ["mailrcv.site", "getemail.cfd"];

// Diverse collection of first names from various regions
const firstNames = [
  // American/English
  "james", "john", "robert", "michael", "david", "william", "richard", "joseph", "thomas", "christopher",
  "mary", "patricia", "jennifer", "linda", "elizabeth", "barbara", "susan", "jessica", "sarah", "karen",
  "daniel", "matthew", "anthony", "mark", "donald", "steven", "paul", "andrew", "joshua", "kenneth",
  "emma", "olivia", "sophia", "isabella", "mia", "charlotte", "amelia", "harper", "evelyn", "abigail",
  // Hispanic/Latino
  "carlos", "miguel", "jose", "juan", "luis", "diego", "alejandro", "gabriel", "rafael", "pablo",
  "maria", "carmen", "rosa", "lucia", "elena", "sofia", "valentina", "camila", "mariana", "isabella",
  // European
  "lucas", "liam", "noah", "oliver", "felix", "max", "leon", "theo", "oscar", "hugo",
  "anna", "julia", "laura", "clara", "marie", "nina", "eva", "lisa", "sara", "hanna",
  // Asian
  "wei", "chen", "ming", "jin", "hao", "yan", "lei", "feng", "yuki", "kenji",
  "mei", "lin", "xiao", "ying", "sakura", "hana", "yuna", "mina", "sora", "aiko",
  // Middle Eastern
  "omar", "ali", "ahmed", "hassan", "karim", "tariq", "malik", "yusuf", "amir", "rami",
  "fatima", "layla", "amira", "nadia", "sara", "leila", "yasmin", "zahra", "dina", "rania",
  // South Asian
  "arjun", "raj", "vikram", "arun", "rohan", "kiran", "sanjay", "amit", "rahul", "varun",
  "priya", "ananya", "divya", "neha", "riya", "pooja", "shreya", "kavya", "aisha", "zara",
  // African
  "kwame", "kofi", "adebayo", "chidi", "emeka", "olu", "sekou", "amadou", "mamadou", "ibrahima",
  "amara", "ayana", "zuri", "nia", "imani", "adaora", "chiamaka", "folake", "ngozi", "adeola"
];

// Last names from various regions
const lastNames = [
  // American/English
  "smith", "johnson", "williams", "brown", "jones", "garcia", "miller", "davis", "rodriguez", "martinez",
  "wilson", "anderson", "taylor", "thomas", "hernandez", "moore", "martin", "jackson", "thompson", "white",
  // European
  "mueller", "schmidt", "schneider", "fischer", "weber", "meyer", "wagner", "becker", "hoffmann", "schulz",
  "rossi", "russo", "ferrari", "esposito", "bianchi", "romano", "colombo", "ricci", "marino", "greco",
  "dubois", "moreau", "laurent", "simon", "michel", "leroy", "roux", "david", "bertrand", "morel",
  // Hispanic
  "gonzalez", "lopez", "perez", "sanchez", "ramirez", "torres", "flores", "rivera", "gomez", "diaz",
  // Asian
  "wang", "li", "zhang", "liu", "chen", "yang", "huang", "zhao", "wu", "zhou",
  "kim", "lee", "park", "choi", "jung", "kang", "cho", "yoon", "jang", "lim",
  "tanaka", "yamamoto", "suzuki", "watanabe", "ito", "yamada", "nakamura", "kobayashi", "kato", "yoshida",
  // South Asian
  "patel", "sharma", "singh", "kumar", "gupta", "das", "reddy", "khan", "ali", "malik",
  // African
  "okonkwo", "adeyemi", "mensah", "diallo", "traore", "coulibaly", "ndiaye", "sy", "ba", "sow"
];

// Generate random name that looks like real person email
const generateRandomName = () => {
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  
  // Various email format patterns
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
  
  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return pattern();
};

const generateStrongPassword = () => {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

export const HeroSection = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [domains, setDomains] = useState<string[]>(DEFAULT_DOMAINS);
  const [selectedDomain, setSelectedDomain] = useState(DEFAULT_DOMAINS[0]);
  const navigate = useNavigate();

  // Fetch available domains from database
  useEffect(() => {
    const fetchDomains = async () => {
      try {
        const { data, error } = await supabase
          .from('domains')
          .select('domain_name')
          .eq('is_verified', true);
        
        if (!error && data && data.length > 0) {
          const dbDomains = data.map(d => d.domain_name);
          // Merge with default domains, avoiding duplicates
          const allDomains = [...new Set([...DEFAULT_DOMAINS, ...dbDomains])];
          setDomains(allDomains);
        }
      } catch (err) {
        console.error('Error fetching domains:', err);
      }
    };
    fetchDomains();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    const cleanUsername = username.trim().toLowerCase();

    // If no password, go to public inbox with domain
    if (!password) {
      const params = selectedDomain !== DEFAULT_DOMAINS[0] ? `?domain=${encodeURIComponent(selectedDomain)}` : '';
      navigate(`/inbox/${cleanUsername}${params}`);
      return;
    }

    // With password - check if inbox exists and handle accordingly
    setIsLoading(true);
    try {
      // First check if inbox exists
      const { data: checkData, error: checkError } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'check', username: cleanUsername, domain: selectedDomain }
      });

      if (checkError) throw checkError;

      if (checkData.exists) {
        if (!checkData.is_password_protected) {
          toast.error("This is a public inbox, remove password to access");
          setIsLoading(false);
          return;
        }

        // Try to login
        const { data: loginData, error: loginError } = await supabase.functions.invoke('inbox-auth', {
          body: { action: 'login', username: cleanUsername, domain: selectedDomain, password }
        });

        if (loginError) throw loginError;

        if (loginData.error) {
          toast.error(loginData.error);
          setIsLoading(false);
          return;
        }

        // Save session with domain info
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: loginData.alias_id,
          token: loginData.session_token,
          password: password,
          domain: selectedDomain,
          created_at: Date.now()
        }));

        toast.success("Login successful!");
        const params = selectedDomain !== DEFAULT_DOMAINS[0] ? `?domain=${encodeURIComponent(selectedDomain)}` : '';
        navigate(`/inbox/${cleanUsername}${params}`);
      } else {
        // Create new secure inbox
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        const { data: registerData, error: registerError } = await supabase.functions.invoke('inbox-auth', {
          body: { action: 'register', username: cleanUsername, domain: selectedDomain, password }
        });

        if (registerError) throw registerError;

        if (registerData.error) {
          toast.error(registerData.error);
          setIsLoading(false);
          return;
        }

        // Save session with domain info
        localStorage.setItem(`${SESSION_KEY_PREFIX}${cleanUsername}`, JSON.stringify({
          alias_id: registerData.alias_id,
          token: registerData.session_token,
          password: password,
          domain: selectedDomain,
          created_at: Date.now()
        }));

        toast.success("Secure inbox created!");
        const params = selectedDomain !== DEFAULT_DOMAINS[0] ? `?domain=${encodeURIComponent(selectedDomain)}` : '';
        navigate(`/inbox/${cleanUsername}${params}`);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRandomGenerate = () => {
    setUsername(generateRandomName());
  };

  const handleGeneratePassword = async () => {
    const newPassword = generateStrongPassword();
    setPassword(newPassword);
    setShowPassword(true);
    await navigator.clipboard.writeText(newPassword);
    toast.success("Strong password generated & copied!");
  };

  const handleCopyEmail = async () => {
    if (!username.trim()) {
      toast.error("Please enter a name first");
      return;
    }
    const fullEmail = `${username.trim().toLowerCase()}@${selectedDomain}`;
    await navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    toast.success("Email address copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative sm:min-h-screen flex items-start sm:items-center justify-center hero-gradient overflow-hidden pt-14 sm:pt-20 pb-0 sm:py-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-dots opacity-50 dark:opacity-50" />
      
      {/* Glowing orbs - different for light/dark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 dark:bg-primary/20 blur-[150px] animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 dark:bg-accent/15 blur-[120px] animate-pulse-slow" style={{ animationDelay: "2s" }} />
        {/* Light mode extra gradient */}
        <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent dark:from-transparent pointer-events-none" />
      </div>

      <div className="container relative z-10 px-4 py-4 sm:py-20">
        <div className="max-w-3xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full glass mb-6 sm:mb-10 shadow-sm dark:shadow-none">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs sm:text-sm font-medium text-foreground/80">No signup required • Instant forwarding</span>
          </div>

          {/* Main heading */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-4 sm:mb-6 tracking-tight leading-tight">
            Instant Email
            <span className="block gradient-text drop-shadow-sm">Forwarding</span>
          </h1>

          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-12 max-w-xl mx-auto leading-relaxed">
            Create disposable email addresses in seconds. 
            No password. No registration. Pure simplicity.
          </p>

          {/* Email creation form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col gap-4 p-5 sm:p-6 rounded-3xl bg-card/90 dark:bg-gradient-to-b dark:from-background/80 dark:to-background/40 backdrop-blur-xl border border-border/40 dark:border-primary/20 shadow-2xl dark:shadow-[0_0_50px_-10px] dark:shadow-primary/40">
              {/* Input row with random button */}
              <div className="flex items-center gap-3">
                {/* Main input container */}
                <div className="flex-1 relative group">
                  <div className="relative flex items-center bg-background dark:bg-background/70 rounded-xl px-4 py-4 gap-3 border border-border/50 dark:border-primary/20 group-hover:border-primary/40 transition-all duration-300 group-focus-within:border-primary group-focus-within:shadow-[0_0_20px_-5px] group-focus-within:shadow-primary/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <Input
                      type="text"
                      placeholder="enter-name"
                      value={username}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Auto-detect if user pasted full email
                        if (value.includes('@')) {
                          const emailMatch = value.match(/^([a-zA-Z0-9._-]+)@mailrcv\.site$/i);
                          if (emailMatch) {
                            value = emailMatch[1];
                          } else {
                            // Remove everything from @ onwards
                            value = value.split('@')[0];
                          }
                        }
                        setUsername(value.replace(/[^a-zA-Z0-9._-]/g, ""));
                      }}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-lg font-medium text-foreground placeholder:text-muted-foreground/50 min-w-0 h-auto py-0"
                    />
                  </div>
                </div>
                
                {/* Random generate button */}
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon"
                  onClick={handleRandomGenerate}
                  className="h-14 w-14 shrink-0 rounded-xl border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 hover:from-primary/20 hover:to-accent/20 hover:border-primary/50 transition-all duration-300 group hover:scale-105 active:scale-95"
                  title="Generate random name"
                >
                  <Shuffle className="w-5 h-5 text-primary group-hover:rotate-180 transition-transform duration-500" />
                </Button>
              </div>

              {/* Email preview with domain selector and copy */}
              <div className="flex items-center justify-between gap-2 py-3 px-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 group hover:border-primary/40 transition-colors">
                <div className="flex items-center gap-1 min-w-0 flex-1">
                  <span className="font-mono text-base sm:text-lg font-semibold text-foreground truncate">
                    {username || <span className="text-muted-foreground/50">your-name</span>}
                  </span>
                  <span className="font-mono text-base sm:text-lg font-semibold text-primary shrink-0">@</span>
                  <Select value={selectedDomain} onValueChange={setSelectedDomain}>
                    <SelectTrigger className="h-auto px-2 py-1 border border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 rounded-lg font-mono text-base sm:text-lg font-semibold text-primary focus:ring-1 focus:ring-primary/50 focus:ring-offset-0 w-auto gap-1.5 transition-all duration-200 group/domain [&>svg]:w-4 [&>svg]:h-4 [&>svg]:text-primary [&>svg]:transition-transform [&>svg]:duration-200 hover:[&>svg]:translate-y-0.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover/95 backdrop-blur-xl border border-primary/20 shadow-xl shadow-primary/10 rounded-xl overflow-hidden">
                      {domains.map((d) => (
                        <SelectItem 
                          key={d} 
                          value={d} 
                          className="font-mono text-sm cursor-pointer py-2.5 pl-8 pr-4 focus:bg-primary/10 focus:text-primary transition-colors"
                        >
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleCopyEmail}
                  className="h-8 w-8 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity"
                  title="Copy email address"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-primary" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Password toggle button */}
              <button
                type="button"
                onClick={() => {
                  setShowPasswordField(!showPasswordField);
                  if (showPasswordField) setPassword("");
                }}
                className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>{showPasswordField ? "Remove password protection" : "Add password protection"}</span>
                {showPasswordField ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Password input - collapsible */}
              {showPasswordField && (
                <div className="relative animate-slide-up">
                  <div className="relative flex items-center bg-background dark:bg-background/70 rounded-xl px-4 py-3 gap-3 border border-border/50 dark:border-primary/20 focus-within:border-primary transition-all duration-300">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-primary" />
                    </div>
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter password (min 6 chars)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 font-mono text-base text-foreground placeholder:text-muted-foreground/50 min-w-0 h-auto py-0"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={handleGeneratePassword}
                      title="Generate strong password"
                    >
                      <Wand2 className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                    With password: creates secure inbox or logs in to existing one
                  </p>
                </div>
              )}

              {/* Submit button */}
              <Button 
                type="submit" 
                variant="hero" 
                size="lg" 
                className="w-full rounded-xl h-14 text-base font-semibold shadow-lg hover:shadow-xl dark:shadow-primary/20 dark:hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    {password ? "Open Secure Inbox" : "Open Inbox"}
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Hint text */}
          <p className="mt-4 text-xs sm:text-sm text-muted-foreground/60">
            💡 Click the <Shuffle className="inline w-3.5 h-3.5 mx-0.5" /> button for a random name
          </p>

        </div>
      </div>
    </section>
  );
};
