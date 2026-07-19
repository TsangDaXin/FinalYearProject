import { useRef } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { JointExplorer } from "./components/JointExplorer";
import { StageSimulator } from "./components/StageSimulator";
import { InteractivePlayer } from "./components/InteractivePlayer";
import { Features } from "./components/Features";
import { CtaSection } from "./components/CtaSection";
import { Footer } from "./components/Footer";

interface LandingPageProps {
  onLoginClick: () => void;
}

export default function LandingPage({ onLoginClick }: LandingPageProps) {
  // References for scrolling
  const sandboxRef = useRef<HTMLDivElement>(null);



  return (
    <div className="min-h-screen bg-[#161316] text-gray-200 antialiased selection:bg-[#FF6D29] selection:text-white">
      
      {/* 1. Header Navigation */}
      <Header onLoginClick={onLoginClick} />

      {/* 2. Hero Deck Section */}
      <Hero 
        onOpenSandbox={onLoginClick} 
      />

      {/* 3. Pathophysiology ("The Science of Joint Decay") */}
      <JointExplorer />

      {/* 4. KL Grading System Stage Simulator */}
      <StageSimulator />

      {/* 5. Custom Live Interactive Acoustic Demo Console */}
      <div ref={sandboxRef}>
        <InteractivePlayer />
      </div>

      {/* 6. Platform Features Section (B2B SaaS styled) */}
      <Features />

      {/* 6.5. Start Analyzing CTA Section */}
      <CtaSection onOpenSandbox={onLoginClick} />

      {/* 7. Footer Certifications block */}
      <Footer />

    </div>
  );
}
