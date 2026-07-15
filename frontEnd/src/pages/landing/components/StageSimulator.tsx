import { useState } from "react";
import { Sliders, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import type { KlStageDetails } from "../types";
import { BentoGrid, type BentoItem } from "../../../components/ui/bento-grid";

const stageDetails: KlStageDetails[] = [
  {
    stage: 0,
    label: "Stage 0: Normal Health",
    category: "HEALTHY",
    badgeColor: "bg-[#FF6D29]/15 text-[#FF6D29] border border-[#FF6D29]/20",
    textColor: "text-[#FF6D29]",
    borderColor: "border-[#FF6D29]",
    description: "Perfect healthy knee joint with no signs of osteoarthritis or wear.",
    xrayFeatures: [
      "Normal wide joint space (no narrowing)",
      "Perfect smooth bone margins",
      "Absence of osteophyte spurs",
      "Normal bone density (no sclerosis)"
    ]
  },
  {
    stage: 1,
    label: "Stage 1: Pre-Clinical",
    category: "HEALTHY",
    badgeColor: "bg-[#FF6D29]/10 text-[#FF6D29] border border-[#FF6D29]/15",
    textColor: "text-[#FF6D29]",
    borderColor: "border-[#FF6D29]",
    description: "Doubtful joint space narrowing and possible osteophyte (spurs) shadow.",
    xrayFeatures: [
      "Possible minimal joint space narrowing",
      "Minute suspected osteophytes (spur shadows)",
      "Intact cartilage layout",
      "No subchondral sclerosis detectable"
    ]
  },
  {
    stage: 2,
    label: "Stage 2: Mild (Definite)",
    category: "Early Stage",
    badgeColor: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/20",
    textColor: "text-yellow-400",
    borderColor: "border-yellow-500",
    description: "Definite osteophyte formation with doubtful narrowing of the joint gap on standing view.",
    xrayFeatures: [
      "Definite presence of marginal osteophytes (spurs)",
      "Doubtful to mild joint space narrowing",
      "Initial cartilage wear on weight-bearing zones",
      "Trace micro-sclerosis starting"
    ]
  },
  {
    stage: 3,
    label: "Stage 3: Moderate",
    category: "Progressing",
    badgeColor: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
    textColor: "text-orange-400",
    borderColor: "border-orange-500",
    description: "Multiple moderate osteophytic spurs, definite narrowing of joint space, and some sclerosis.",
    xrayFeatures: [
      "Moderate joint space reduction (>50% cartilage loss)",
      "Multiple definite osteophytes",
      "Obvious subchondral sclerosis (bone thickening)",
      "Joint asymmetry visible"
    ]
  },
  {
    stage: 4,
    label: "Stage 4: Severe",
    category: "Critical",
    badgeColor: "bg-red-500/15 text-red-400 border border-red-500/20",
    textColor: "text-red-400",
    borderColor: "border-red-500",
    description: "Large osteophytes, severe narrowing of joint space, severe sclerosis, and definite bone attrition.",
    xrayFeatures: [
      "Bone-on-bone friction (total cartilage depletion)",
      "Massive osteophyte formations (sharp spurs)",
      "Primate subchondral sclerosis with joint deformity",
      "Severely compromised clinical range of motion"
    ]
  }
];

export function StageSimulator() {
  const [selectedStage, setSelectedStage] = useState<number>(2);
  const activeStage = stageDetails[selectedStage];

  return (
    <section id="grading-system" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#161316] border-t border-[#453027] scroll-mt-10 relative overflow-hidden">

      {/* Grid Background With (fade-edges) Mask */}
      <div className="absolute inset-0 z-0 h-full w-full bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />

      {/* Ambient background glow behind the Classification section */}
      <div className="absolute left-1/4 bottom-1/4 w-[500px] h-[500px] bg-[#FF6D29]/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">

        {/* Header content with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 flex flex-col items-center text-center"
        >
          <p className="text-[#FF6D29] tracking-widest text-sm font-bold uppercase mb-2">
            Classification Standard
          </p>
          <h2 className="text-4xl font-extrabold text-white mb-4 font-heading tracking-tight">
            Kellgren-Lawrence (KL) Grade Simulator
          </h2>
          <p className="text-[#BABABA] max-w-3xl text-sm sm:text-base leading-relaxed font-sans">
            The Kellgren-Lawrence system is the clinical gold-standard for classification of knee osteoarthritis. Use our reactive simulator to observe bone and cartilage transformations across levels.
          </p>
        </motion.div>

        {/* Dynamic Bento Box layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch transform scale-[0.80] origin-top -mb-[100px]">

          {/* Left Column: Interactive Biological/Radiographic Simulator */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="bg-[#13141A]/60 backdrop-blur-md rounded-3xl border border-[#453027] overflow-hidden flex flex-col justify-between"
          >
            {/* Top status bar */}
            <div className="p-4 bg-black/40 border-b border-[#453027] flex justify-between items-center">
              <span className="text-[11px] font-mono text-[#BABABA] uppercase tracking-widest flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#3B82F6]" />
                Radiograph Pathological Simulator
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${activeStage.badgeColor}`}>
                {activeStage.category}
              </span>
            </div>

            {/* Dynamic Sizing Stage Render Area */}
            <div className="flex-1 w-full min-h-[380px] bg-black relative overflow-hidden flex items-center justify-center">
              {/* Subtle ambient glow behind the image */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full bg-[#3B82F6]/10 blur-[100px]"></div>
              </div>

              {/* Dynamic Image for KL Grade */}
              <img 
                src={`/assets/kl_grades/KL${selectedStage}.png`} 
                alt={`KL Stage ${selectedStage}`} 
                className="absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out hover:scale-[1.03]"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                onLoad={(e) => {
                  (e.target as HTMLImageElement).style.display = 'block';
                }}
              />
            </div>

            {/* Slider control widget bottom */}
            <div className="p-6 bg-black/40 border-t border-[#453027] space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#BABABA] font-mono">Simulate Stage Level:</span>
                <span className="text-white font-bold font-mono">KL-{selectedStage}</span>
              </div>
              
              <div className="relative w-full h-2 bg-[#2A2A35] rounded-full overflow-hidden flex items-center">
                <div 
                  className="absolute left-0 top-0 h-full bg-[#3B82F6] transition-all duration-300"
                  style={{ width: `${(selectedStage / 4) * 100}%` }}
                />
                <input
                  type="range"
                  min="0"
                  max="4"
                  value={selectedStage}
                  onChange={(e) => setSelectedStage(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>
              
              <div className="flex justify-between text-[10px] text-[#808080] font-mono font-medium px-1">
                <span>0</span>
                <span>1</span>
                <span>2</span>
                <span>3</span>
                <span>4</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Stage Information Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col gap-4"
          >
            {/* List of Stages */}
            <BentoGrid
              className="grid-cols-1 gap-3"
              items={stageDetails.map((details) => {
                const isActive = selectedStage === details.stage;
                const cfg = {
                  0: {
                    badgeText: "Perfect Health",
                    statusText: "HEALTHY",
                    indicatorCircle: isActive
                      ? "bg-[#FF6D29] text-white font-black"
                      : "bg-[#FF6D29]/10 text-[#FF6D29] border border-[#FF6D29]/30"
                  },
                  1: {
                    badgeText: "Trace / Doubtful",
                    statusText: "HEALTHY",
                    indicatorCircle: isActive
                      ? "bg-[#FF6D29] text-white font-black"
                      : "bg-[#FF6D29]/10 text-[#FF6D29] border border-[#FF6D29]/30"
                  },
                  2: {
                    badgeText: "Mild (Definite)",
                    statusText: "MILD",
                    indicatorCircle: isActive
                      ? "bg-yellow-500 text-[#121214] font-black"
                      : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
                  },
                  3: {
                    badgeText: "Moderate",
                    statusText: "MODERATE",
                    indicatorCircle: isActive
                      ? "bg-orange-500 text-white font-black"
                      : "bg-orange-500/10 text-orange-400 border border-orange-500/30"
                  },
                  4: {
                    badgeText: "Bone-on-bone",
                    statusText: "SEVERE",
                    indicatorCircle: isActive
                      ? "bg-red-550 text-white font-black bg-red-650"
                      : "bg-red-500/10 text-red-400 border border-red-500/30"
                  }
                }[details.stage as 0 | 1 | 2 | 3 | 4];

                return {
                  title: details.label,
                  description: isActive ? details.description : details.description.slice(0, 60) + "...",
                  icon: (
                    <div className={`w-full h-full rounded-lg flex flex-col items-center justify-center font-mono ${cfg.indicatorCircle}`}>
                      <span className="text-[8px] uppercase tracking-wider scale-90 opacity-80 leading-none">KL</span>
                      <span className="text-sm font-extrabold -mt-0.5 leading-none">{details.stage}</span>
                    </div>
                  ),
                  status: cfg.statusText,
                  tags: [cfg.badgeText],
                  hasPersistentHover: isActive,
                  onClick: () => setSelectedStage(details.stage),
                  className: "!p-3"
                };
              })}
            />

            {/* Active Stage Details Panel */}
            <div className="bg-[#13141A]/60 backdrop-blur-md p-5 rounded-2xl border border-[#453027] space-y-3">
              <span className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest flex items-center gap-1.5 text-left">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                Featured Pathologies in level {selectedStage}
              </span>
              <div className="grid grid-cols-2 gap-3 text-left">
                {activeStage.xrayFeatures.map((feat, index) => (
                  <div key={index} className="bg-black/30 p-2.5 rounded-xl border border-[#453027] flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span className="text-[#BABABA] text-[11px] leading-snug font-mono font-medium">{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

        </div>

      </div>
    
    </section>
  );
}
