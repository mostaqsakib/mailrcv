import { memo } from "react";
import { Capacitor } from "@capacitor/core";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StatsSection } from "@/components/StatsSection";
import { DownloadSection } from "@/components/DownloadSection";
import { Footer } from "@/components/Footer";

const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedDownloadSection = memo(DownloadSection);
const MemoizedFooter = memo(Footer);

const DemoFrostPage = () => {
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div
      className="min-h-screen pt-safe demo-frost-theme"
      style={{
        // Override CSS variables for icy frost/white-blue theme
        "--background": "210 40% 97%",
        "--foreground": "220 30% 12%",
        "--card": "0 0% 100%",
        "--card-foreground": "220 30% 12%",
        "--popover": "0 0% 100%",
        "--popover-foreground": "220 30% 12%",
        "--primary": "210 100% 50%",
        "--primary-foreground": "0 0% 100%",
        "--secondary": "210 30% 93%",
        "--secondary-foreground": "220 30% 15%",
        "--muted": "210 25% 92%",
        "--muted-foreground": "215 15% 45%",
        "--accent": "195 90% 45%",
        "--accent-foreground": "0 0% 100%",
        "--destructive": "0 72% 51%",
        "--destructive-foreground": "0 0% 100%",
        "--border": "214 25% 88%",
        "--input": "214 25% 88%",
        "--ring": "210 100% 50%",
        "--neon-blue": "210 100% 50%",
        "--neon-cyan": "195 90% 45%",
        "--gradient-blue": "linear-gradient(135deg, hsl(210 100% 50%) 0%, hsl(195 90% 45%) 100%)",
        "--gradient-hero": "radial-gradient(ellipse at top, hsl(210 40% 97%) 0%, hsl(210 35% 93%) 100%)",
        "--gradient-card": "linear-gradient(180deg, hsl(0 0% 100% / 0.95) 0%, hsl(210 40% 97% / 0.9) 100%)",
        "--shadow-blue": "0 0 40px hsl(210 100% 50% / 0.15)",
        "--shadow-blue-strong": "0 0 60px hsl(210 100% 50% / 0.25), 0 0 100px hsl(210 100% 50% / 0.1)",
        "--shadow-soft": "0 8px 32px hsl(0 0% 0% / 0.06)",
        "--shadow-card": "0 8px 32px hsl(0 0% 0% / 0.08), inset 0 1px 0 hsl(0 0% 100% / 0.9)",
        "--shadow-elevated": "0 24px 48px hsl(0 0% 0% / 0.12)",
        "--shadow-glow": "0 0 40px hsl(210 100% 50% / 0.15)",
        "--glass-bg": "hsl(0 0% 100% / 0.7)",
        "--glass-bg-strong": "hsl(0 0% 100% / 0.9)",
        "--glass-border": "hsl(210 100% 50% / 0.15)",
        "--glass-border-hover": "hsl(210 100% 50% / 0.35)",
        "--grid-dot-color": "hsl(210 100% 50% / 0.12)",
      } as React.CSSProperties}
    >
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-600 text-xs font-mono backdrop-blur-xl">
        ❄️ DEMO: Frost Theme — <a href="/" className="underline hover:text-blue-500">Back to Site</a>
      </div>
      <MemoizedHeader />
      <HeroSection />
      <MemoizedFeaturesSection />
      <StatsSection />
      {!isNativeApp && <MemoizedDownloadSection />}
      <MemoizedFooter />
    </div>
  );
};

export default DemoFrostPage;
