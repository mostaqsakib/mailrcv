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

const DemoNoirPage = () => {
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div
      className="min-h-screen pt-safe demo-noir-theme"
      style={{
        // Override CSS variables for black & gold editorial theme
        "--background": "0 0% 4%",
        "--foreground": "45 20% 92%",
        "--card": "0 0% 7%",
        "--card-foreground": "45 20% 92%",
        "--popover": "0 0% 7%",
        "--popover-foreground": "45 20% 92%",
        "--primary": "43 90% 55%",
        "--primary-foreground": "0 0% 4%",
        "--secondary": "0 0% 12%",
        "--secondary-foreground": "45 15% 85%",
        "--muted": "0 0% 14%",
        "--muted-foreground": "0 0% 50%",
        "--accent": "35 80% 50%",
        "--accent-foreground": "0 0% 4%",
        "--destructive": "0 72% 51%",
        "--destructive-foreground": "45 20% 92%",
        "--border": "0 0% 14%",
        "--input": "0 0% 14%",
        "--ring": "43 90% 55%",
        "--neon-blue": "43 90% 55%",
        "--neon-cyan": "35 80% 50%",
        "--gradient-blue": "linear-gradient(135deg, hsl(43 90% 55%) 0%, hsl(35 80% 50%) 100%)",
        "--gradient-hero": "radial-gradient(ellipse at top, hsl(0 0% 8%) 0%, hsl(0 0% 4%) 100%)",
        "--gradient-card": "linear-gradient(180deg, hsl(0 0% 8% / 0.8) 0%, hsl(0 0% 6% / 0.9) 100%)",
        "--shadow-blue": "0 0 40px hsl(43 90% 55% / 0.2)",
        "--shadow-blue-strong": "0 0 60px hsl(43 90% 55% / 0.3), 0 0 100px hsl(43 90% 55% / 0.12)",
        "--shadow-soft": "0 8px 32px hsl(0 0% 0% / 0.4)",
        "--shadow-card": "0 8px 32px hsl(0 0% 0% / 0.5), inset 0 1px 0 hsl(45 30% 70% / 0.05)",
        "--shadow-elevated": "0 24px 48px hsl(0 0% 0% / 0.6)",
        "--shadow-glow": "0 0 40px hsl(43 90% 55% / 0.2)",
        "--glass-bg": "hsl(0 0% 8% / 0.6)",
        "--glass-bg-strong": "hsl(0 0% 7% / 0.85)",
        "--glass-border": "hsl(43 90% 55% / 0.12)",
        "--glass-border-hover": "hsl(43 90% 55% / 0.3)",
        "--grid-dot-color": "hsl(43 90% 55% / 0.1)",
      } as React.CSSProperties}
    >
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs font-mono backdrop-blur-xl">
        🖤 DEMO: Noir & Gold Theme — <a href="/" className="underline hover:text-yellow-300">Back to Site</a>
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

export default DemoNoirPage;
