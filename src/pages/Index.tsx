import { memo } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";

// Memoize static components to prevent unnecessary re-renders
const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedFooter = memo(Footer);

const Index = () => {
  return (
    <div className="min-h-screen">
      <MemoizedHeader />
      <HeroSection />
      <MemoizedFeaturesSection />
      <MemoizedFooter />
    </div>
  );
};

export default Index;
