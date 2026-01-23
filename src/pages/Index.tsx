import { memo } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StatsSection } from "@/components/StatsSection";
import { Footer } from "@/components/Footer";

// Memoize static components to prevent unnecessary re-renders
const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedFooter = memo(Footer);

const Index = () => {
  return (
    <div className="min-h-screen pt-safe">
      <MemoizedHeader />
      <HeroSection />
      <MemoizedFeaturesSection />
      <StatsSection />
      <MemoizedFooter />
    </div>
  );
};

export default Index;
