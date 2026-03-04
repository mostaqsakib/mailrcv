import { memo } from "react";
import { Capacitor } from "@capacitor/core";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StatsSection } from "@/components/StatsSection";
import { ComparisonBanner } from "@/components/ComparisonBanner";
import { DownloadSection } from "@/components/DownloadSection";
import { Footer } from "@/components/Footer";

// Memoize static components to prevent unnecessary re-renders
const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedComparisonBanner = memo(ComparisonBanner);
const MemoizedDownloadSection = memo(DownloadSection);
const MemoizedFooter = memo(Footer);

const Index = () => {
  // Hide download section in native app
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <div className="min-h-screen pt-safe">
      <MemoizedHeader />
      <HeroSection />
      <MemoizedFeaturesSection />
      <StatsSection />
      <MemoizedComparisonBanner />
      {!isNativeApp && <MemoizedDownloadSection />}
      <MemoizedFooter />
    </div>
  );
};

export default Index;
