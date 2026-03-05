import { memo } from "react";
import { Capacitor } from "@capacitor/core";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";

import { HowItWorksSection } from "@/components/HowItWorksSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { StatsSection } from "@/components/StatsSection";
import { TestimonialsSection } from "@/components/TestimonialsSection";
import { ComparisonBanner } from "@/components/ComparisonBanner";
import { FAQSection } from "@/components/FAQSection";
import { DownloadSection } from "@/components/DownloadSection";
import { Footer } from "@/components/Footer";

import { PageTransition } from "@/components/PageTransition";

const MemoizedHeader = memo(Header);
const MemoizedFeaturesSection = memo(FeaturesSection);
const MemoizedComparisonBanner = memo(ComparisonBanner);
const MemoizedDownloadSection = memo(DownloadSection);
const MemoizedFooter = memo(Footer);

const Index = () => {
  const isNativeApp = Capacitor.isNativePlatform();

  return (
    <PageTransition>
      <div className="min-h-screen pt-safe">
        <MemoizedHeader />
        <HeroSection />
        
        <HowItWorksSection />
        <MemoizedFeaturesSection />
        <StatsSection />
        <TestimonialsSection />
        <MemoizedComparisonBanner />
        <FAQSection />
        {!isNativeApp && <MemoizedDownloadSection />}
        <MemoizedFooter />
        
      </div>
    </PageTransition>
  );
};

export default Index;
