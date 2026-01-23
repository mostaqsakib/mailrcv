import { memo } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { DownloadSection } from "@/components/DownloadSection";
import { StatsSection } from "@/components/StatsSection";
import { Footer } from "@/components/Footer";

// Memoize static components to prevent unnecessary re-renders
const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedDownloadSection = memo(DownloadSection);
const MemoizedFooter = memo(Footer);

const Index = () => {
  return (
    <div className="min-h-screen">
      <MemoizedHeader />
      <HeroSection />
      <MemoizedFeaturesSection />
      <MemoizedDownloadSection />
      <StatsSection />
      <MemoizedFooter />
    </div>
  );
};

export default Index;
