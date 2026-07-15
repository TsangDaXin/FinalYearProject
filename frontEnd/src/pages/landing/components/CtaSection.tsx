import { motion } from "framer-motion";
import { Play, Sparkles, Activity, ShieldAlert } from "lucide-react";
import { GradientBarsBackground } from "../../../components/ui/gradient-bars-background";

import { StartAnalyzingButton } from "./Hero";

interface CtaSectionProps {
  onOpenSandbox: () => void;
}

export function CtaSection({ onOpenSandbox }: CtaSectionProps) {
  return (
    <GradientBarsBackground
      id="cta-section"
      className="py-28 px-4 sm:px-6 lg:px-8 border-t border-[#453027] relative z-0"
      numBars={15}
      gradientFrom="rgb(255, 109, 41)"
      animationDuration={2.5}
      backgroundColor="#161316"
    >
      {/* Main Container */}
      <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
        
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF6D29]/10 border border-[#FF6D29]/20 text-white text-[10px] font-extrabold uppercase tracking-widest mb-6 font-mono"
        >
          <Sparkles className="w-3 h-3 text-[#FF6D29]" />
          Immediate Assessment Recommended
        </motion.div>

        {/* Big Title */}
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.1] font-heading"
        >
          What are you waiting for?
        </motion.h2>

        {/* Highlight Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-6 text-base sm:text-lg text-[#BABABA] max-w-2xl font-sans leading-relaxed font-semibold flex items-center justify-center gap-2"
        >
          <ShieldAlert className="w-4 h-4 text-[#FF6D29] inline shrink-0" />
          <span className="whitespace-nowrap">Start analyzing before its too late.</span>
        </motion.p>

        {/* Animated CTA Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10"
        >
          <StartAnalyzingButton 
            onClick={onOpenSandbox} 
            text="Analyzing" 
            icon={Activity} 
          />
        </motion.div>

        {/* Clinical Note Block */}
        <motion.p 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 0.5 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-6 text-[10px] sm:text-[11px] text-[#BABABA] font-mono tracking-wide"
        >
          Continuous tracking helps clinicians spot joint spacing issues 3x faster than annual checks.
        </motion.p>

      </div>
    </GradientBarsBackground>
  );
}
