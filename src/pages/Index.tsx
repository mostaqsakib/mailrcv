import { useState } from "react";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { Footer } from "@/components/Footer";
import { InboxView } from "@/components/InboxView";

const Index = () => {
  const [activeEmail, setActiveEmail] = useState<string | null>(null);
  const domain = "mailfly.io";

  const handleCreateEmail = (username: string) => {
    setActiveEmail(`${username}@${domain}`);
  };

  if (activeEmail) {
    return <InboxView email={activeEmail} onBack={() => setActiveEmail(null)} />;
  }

  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection onCreateEmail={handleCreateEmail} />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
