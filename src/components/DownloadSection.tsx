import { Smartphone, Download, Bell, Zap, Shield } from "lucide-react";

export const DownloadSection = () => {
  return (
    <section className="py-16 sm:py-20 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 blur-[150px] rounded-full" />
      
      <div className="container px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main card */}
          <div className="relative p-8 sm:p-12 rounded-3xl bg-card/80 backdrop-blur-xl border border-primary/20 shadow-2xl dark:shadow-primary/10 overflow-hidden">
            {/* Inner glow effect */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/20 blur-[80px] translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
              {/* Left: Content */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
                  <Smartphone className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Android App</span>
                </div>
                
                <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
                  Get the <span className="gradient-text">Mobile App</span>
                </h2>
                
                <p className="text-muted-foreground text-lg mb-6 max-w-md mx-auto lg:mx-0">
                  Never miss an email. Get instant push notifications directly on your phone.
                </p>
                
                {/* Features list */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Bell className="w-4 h-4 text-primary" />
                    <span>Push Notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-primary" />
                    <span>Instant Alerts</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Secure & Private</span>
                  </div>
                </div>
                
                {/* Download button */}
                <a 
                  href="https://github.com/mostaqsakib/mailrcv/releases/latest/download/app-debug.apk"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-lg shadow-lg hover:shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <Download className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                  Download APK
                </a>
                
                <p className="mt-4 text-xs text-muted-foreground/60">
                  Free • No account required • 5MB
                </p>
              </div>
              
              {/* Right: Phone mockup */}
              <div className="relative shrink-0">
                <div className="w-48 h-80 sm:w-56 sm:h-96 rounded-[2.5rem] bg-gradient-to-b from-muted to-muted/50 border-4 border-muted-foreground/20 shadow-2xl relative overflow-hidden">
                  {/* Phone notch */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-6 bg-background rounded-full" />
                  
                  {/* Phone screen content */}
                  <div className="absolute inset-4 top-10 rounded-2xl bg-background overflow-hidden">
                    {/* Notification preview */}
                    <div className="p-3 space-y-2">
                      <div className="text-[10px] text-muted-foreground text-center mb-3">MailRCV</div>
                      
                      {/* Notification cards */}
                      <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 animate-pulse-slow">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">New Email!</div>
                            <div className="text-[10px] text-muted-foreground truncate">From: noreply@example.com</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-3 rounded-xl bg-muted/50 border border-border/50">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Bell className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-foreground truncate">Verification Code</div>
                            <div className="text-[10px] text-muted-foreground truncate">Your code: 847291</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating badges */}
                <div className="absolute -top-3 -right-3 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg animate-bounce">
                  FREE
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};