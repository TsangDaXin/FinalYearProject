const fs = require('fs');
const path = require('path');

const filePath = path.join('src', 'pages', 'landing', 'components', 'StageSimulator.tsx');

const content = `import { useState } from "react";
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
    <section id="grading-system" className="py-24 px-4 sm:px-6 lg:px-8 bg-[#161316] border-t border-[#453027] scroll-mt-10 relative">

      {/* Ambient background glow behind the Classification section */}
      <div className="absolute left-1/4 bottom-1/4 w-[500px] h-[500px] bg-[#FF6D29]/5 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">

        {/* Header content with Scroll Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-left"
        >
          <p className="text-[#3B82F6] tracking-widest text-sm font-bold uppercase mb-2">
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
              <span className={\`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full \${activeStage.badgeColor}\`}>
                {activeStage.category}
              </span>
            </div>

            {/* Dynamic Sizing Stage Render Area */}
            <div className="flex-1 p-6 md:p-10 flex items-center justify-center min-h-[380px] bg-gradient-to-b from-[#0d0d0f]/40 to-transparent relative overflow-hidden">
              {/* Subtle ambient glow behind the image */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-[60%] h-[60%] rounded-full bg-[#3B82F6]/5 blur-[80px]"></div>
              </div>

              <div className="relative w-full max-w-[450px] flex justify-center items-center group perspective-1000">
                {/* Dynamic Image for KL Grade */}
                <img 
                  src={\`/assets/kl_grades/KL\${selectedStage}.png\`} 
                  alt={\`KL Stage \${selectedStage}\`} 
                  className="w-full h-auto max-h-[340px] object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)] transition-all duration-700 ease-out group-hover:scale-[1.02]"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.display = 'block';
                  }}
                />
              </div>
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
                  style={{ width: \`\${(selectedStage / 4) * 100}%\` }}
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
                    <div className={\`w-full h-full rounded-lg flex flex-col items-center justify-center font-mono \${cfg.indicatorCircle}\`}>
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
    
      {/* 2-Column Layout based on Reference Image */}
      <div className="mt-8 max-w-7xl mx-auto px-6 mb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left Column: Stages Image */}
          <div className="w-full h-auto bg-[#1b1b1d] rounded-xl overflow-hidden p-6 shadow-2xl shadow-blue-900/10 border border-[#424754]/50 flex items-center justify-center">
            <img src="/assets/kl_grades.png" alt="Stages of Knee Osteoarthritis" className="w-full h-auto object-contain max-h-[500px]" />
          </div>

          {/* Right Column: KL Grading System Card */}
          <div className="bg-[#1b1b1d] border border-[#424754]/50 rounded-2xl p-6 md:p-8 w-full shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                  <svg className="w-6 h-6 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              </div>
              <h3 className="text-white font-bold text-xl">KL Grading System (Stage 0-4)</h3>
            </div>

            <div className="flex flex-col gap-4">
              {/* Item 1 */}
              <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-green-500 hover:bg-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base">Stage 0-1: Pre-Clinical</span>
                  <span className="text-gray-400 text-sm mt-1">Normal joint or doubtful joint space narrowing.</span>
                </div>
                <span className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">HEALTHY</span>
              </div>

              {/* Item 2 */}
              <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-yellow-500 hover:bg-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base">Stage 2: Mild (Definite)</span>
                  <span className="text-gray-400 text-sm mt-1">Osteophyte formation; cartilage starts thinning.</span>
                </div>
                <span className="bg-yellow-500/20 text-yellow-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">EARLY STAGE</span>
              </div>

              {/* Item 3 */}
              <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-orange-500 hover:bg-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base">Stage 3: Moderate</span>
                  <span className="text-gray-400 text-sm mt-1">Multiple osteophytes; definite joint narrowing.</span>
                </div>
                <span className="bg-orange-500/20 text-orange-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">PROGRESSING</span>
              </div>

              {/* Item 4 */}
              <div className="flex justify-between items-center bg-white/5 rounded-r-xl p-4 border-l-4 border-red-500 hover:bg-white/10 transition-colors">
                <div className="flex flex-col">
                  <span className="font-bold text-white text-base">Stage 4: Severe</span>
                  <span className="text-gray-400 text-sm mt-1">Large spurs; severe narrowing; bone deformity.</span>
                </div>
                <span className="bg-red-500/20 text-red-400 px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider">CRITICAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
`;

fs.writeFileSync(filePath, content);
console.log('Fixed StageSimulator.tsx');
