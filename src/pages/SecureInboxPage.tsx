import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Eye, EyeOff, Shuffle, Mail, ArrowLeft, LogIn, UserPlus } from "lucide-react";

// Session storage key prefix
const SESSION_KEY_PREFIX = "mailrcv_session_";

// Generate random password
const generateRandomPassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// Save session with password for later viewing
const saveSession = (username: string, aliasId: string, token: string, password?: string) => {
  localStorage.setItem(`${SESSION_KEY_PREFIX}${username}`, JSON.stringify({
    alias_id: aliasId,
    token: token,
    password: password, // Store password for viewing in inbox
    created_at: Date.now()
  }));
};

export default function SecureInboxPage() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'check' | 'login' | 'register'>('check');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [inboxExists, setInboxExists] = useState(false);
  const [isPasswordProtected, setIsPasswordProtected] = useState(false);

  const domain = 'mailrcv.site';
  const email = `${username}@${domain}`;

  // Check session on mount
  useEffect(() => {
    const checkSession = () => {
      const sessionData = localStorage.getItem(`${SESSION_KEY_PREFIX}${username}`);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.alias_id && session.token) {
            // Valid session, redirect to inbox
            navigate(`/inbox/${username}`, { replace: true });
            return true;
          }
        } catch {
          localStorage.removeItem(`${SESSION_KEY_PREFIX}${username}`);
        }
      }
      return false;
    };

    if (checkSession()) return;
    
    // Check inbox status
    checkInboxStatus();
  }, [username, navigate]);

  const checkInboxStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'check', username, domain }
      });

      if (error) throw error;

      setInboxExists(data.exists);
      setIsPasswordProtected(data.is_password_protected);

      if (data.exists) {
        if (data.is_password_protected) {
          setMode('login');
        } else {
          // Public inbox, redirect directly
          navigate(`/inbox/${username}`, { replace: true });
        }
      } else {
        setMode('register');
      }
    } catch (error) {
      console.error('Check inbox error:', error);
      toast({
        title: "Error",
        description: "Failed to check inbox status",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'register', username, domain, password }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Registration failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Save session with password
      saveSession(username!, data.alias_id, data.session_token, password);

      toast({
        title: "Inbox created!",
        description: `${email} is now password protected`,
      });

      navigate(`/inbox/${username}`, { replace: true });
    } catch (error) {
      console.error('Register error:', error);
      toast({
        title: "Registration failed",
        description: "Could not create inbox",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({
        title: "Password required",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('inbox-auth', {
        body: { action: 'login', username, domain, password }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Login failed",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      // Save session with password
      saveSession(username!, data.alias_id, data.session_token, password);

      toast({
        title: "Welcome back!",
        description: `Logged in to ${email}`,
      });

      navigate(`/inbox/${username}`, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "Could not authenticate",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    setPassword(newPassword);
    setShowPassword(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(newPassword);
    toast({
      title: "Password generated & copied!",
      description: "Save this password somewhere safe",
    });
  };

  if (isLoading && mode === 'check') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 pt-24 pb-8">
        <div className="w-full max-w-md">
          <div className="glass rounded-2xl p-6 sm:p-8 border border-border/50">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {mode === 'register' ? 'Create Secure Inbox' : 'Login to Inbox'}
              </h1>
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="font-mono text-sm">{email}</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">
                  {mode === 'register' ? 'Create Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                    className="pr-20"
                    autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    {mode === 'register' && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleGeneratePassword}
                        title="Generate random password"
                      >
                        <Shuffle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : mode === 'register' ? (
                  <>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Create Secure Inbox
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2" />
                    Login
                  </>
                )}
              </Button>
            </form>

            {/* Alternative options */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>

            {/* Info text */}
            {mode === 'register' && (
              <p className="text-xs text-muted-foreground text-center mt-4">
                This creates a private, password-protected inbox. 
                Only you can access emails sent to this address.
              </p>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
