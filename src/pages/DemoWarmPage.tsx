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

const DemoWarmPage = () => {
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div
      className="min-h-screen pt-safe demo-warm-theme"
      style={{
        // Override CSS variables for warm amber/terracotta theme
        "--background": "30 25% 6%",
        "--foreground": "35 30% 95%",
        "--card": "30 25% 10%",
        "--card-foreground": "35 30% 95%",
        "--popover": "30 25% 10%",
        "--popover-foreground": "35 30% 95%",
        "--primary": "28 85% 55%",
        "--primary-foreground": "30 25% 6%",
        "--secondary": "30 20% 15%",
        "--secondary-foreground": "35 30% 90%",
        "--muted": "30 15% 18%",
        "--muted-foreground": "30 15% 55%",
        "--accent": "16 75% 50%",
        "--accent-foreground": "30 25% 6%",
        "--destructive": "0 72% 51%",
        "--destructive-foreground": "35 30% 95%",
        "--border": "30 15% 18%",
        "--input": "30 15% 18%",
        "--ring": "28 85% 55%",
        "--neon-blue": "28 85% 55%",
        "--neon-cyan": "16 75% 50%",
        "--gradient-blue": "linear-gradient(135deg, hsl(28 85% 55%) 0%, hsl(16 75% 50%) 100%)",
        "--gradient-hero": "radial-gradient(ellipse at top, hsl(30 25% 11%) 0%, hsl(30 25% 6%) 100%)",
        "--gradient-card": "linear-gradient(180deg, hsl(30 25% 11% / 0.8) 0%, hsl(30 25% 8% / 0.9) 100%)",
        "--shadow-blue": "0 0 40px hsl(28 85% 55% / 0.25)",
        "--shadow-blue-strong": "0 0 60px hsl(28 85% 55% / 0.35), 0 0 100px hsl(28 85% 55% / 0.15)",
        "--shadow-soft": "0 8px 32px hsl(0 0% 0% / 0.3)",
        "--shadow-card": "0 8px 32px hsl(0 0% 0% / 0.4), inset 0 1px 0 hsl(0 0% 100% / 0.05)",
        "--shadow-elevated": "0 24px 48px hsl(0 0% 0% / 0.5)",
        "--shadow-glow": "0 0 40px hsl(28 85% 55% / 0.25)",
        "--glass-bg": "hsl(30 25% 11% / 0.6)",
        "--glass-bg-strong": "hsl(30 25% 10% / 0.85)",
        "--glass-border": "hsl(28 85% 55% / 0.15)",
        "--glass-border-hover": "hsl(28 85% 55% / 0.3)",
        "--grid-dot-color": "hsl(28 85% 55% / 0.15)",
      } as React.CSSProperties}
    >
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-mono backdrop-blur-xl">
        🔥 DEMO: Warm Earth Theme — <a href="/" className="underline hover:text-orange-200">Back to Site</a>
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

export default DemoWarmPage;
