import { Play, Clipboard, Layers, CheckCircle2, Send } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { ContainerScroll } from "../../../components/ui/container-scroll-animation";
import { PaperDesignBackground } from "../../../components/ui/neon-dither";
import { Liquid } from "../../../components/ui/button-1";

const COLORS = {
  color1: '#FFFFFF',
  color2: '#FF6D29',
  color3: '#FF8D59',
  color4: '#FFF0E6',
  color5: '#FFD9C2',
  color6: '#E65A1A',
  color7: '#CC4D11',
  color8: '#B34008',
  color9: '#FF8247',
  color10: '#FFA375',
  color11: '#FF6D29',
  color12: '#453027',
  color13: '#5C4033',
  color14: '#8C5942',
  color15: '#A66A4E',
  color16: '#D95B1F',
  color17: '#F26622',
};

interface HeroProps {
  onOpenSandbox: () => void;
}

export function Hero({ onOpenSandbox }: HeroProps) {

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#161316] pb-20 pt-32">

      {/* Task 1: Massive, soft ambient glow centered at the top */}
      <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[500px] bg-[#FF6D29]/15 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute left-1/2 -translate-x-1/2 top-40 w-[600px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <PaperDesignBackground themeMode="dark" intensity={0.65} parallax={true} />

      {/* Grid Pattern overlay for SaaS texture */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex flex-col items-center">

        {/* Task 5: Scroll animation wrapper for Hero Text stack */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto flex flex-col items-center"
        >
          {/* Top Pill centered */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FF6D29]/10 border border-[#FF6D29]/20 text-[#FF6D29] text-xs font-bold uppercase tracking-widest mb-8 backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF6D29] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6D29]"></span>
            </span>
            Artificial Intelligence System for Physiotherapy and Osteoarthritis Monitoring
          </div>

          {/* Middle Headings Centered */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight font-heading max-w-3xl overflow-hidden">
            Smart Prediction for <br />
            <span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6D29] via-[#FF8D59] to-[#FF6D29] inline-block glitch-word"
              data-text="Knee Recovery."
            >
              Knee Recovery.
            </span>
          </h1>

        </motion.div>

        {/* Task 2: Mockup below CTA */}
        {/* Task 2: Mockup below CTA */}
        <div className="w-full flex justify-center -mt-16">
          <ContainerScroll
            titleComponent={<></>}
          >
            <div className="flex flex-col space-y-5 w-full">
              {/* Actions row inside the scrollable container */}
              <div className="flex justify-end gap-2 pb-4 border-b border-[#453027] w-full pt-2 pr-2">
                <button className="px-3.5 py-2 text-[10px] font-bold text-white bg-transparent hover:bg-white/5 border border-[#453027] rounded-lg transition-colors uppercase tracking-wider font-mono">
                  Export PDF
                </button>
                <button className="px-3.5 py-2 text-[10px] font-bold text-[#121214] bg-white hover:bg-gray-200 border border-[#453027] rounded-lg transition-colors uppercase tracking-wider font-mono">
                  Validate Results
                </button>
              </div>

            {/* Grid of the three key cards (Input, Overlay, KL Grade Prediction) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">

              {/* Panel 1: Input Image */}
              <div className="bg-[#453027]/40 border border-[#453027] rounded-2xl p-4 flex flex-col justify-between text-left">
                <div className="flex items-center gap-1.5 mb-3 text-[#BABABA]">
                  <Layers className="w-3.5 h-3.5 text-[#BABABA]" />
                  <span className="text-xs font-bold font-mono tracking-tight">Input Image</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border border-[#453027] bg-[#453027]">
                  <img
                    alt="Input Knee X-Ray"
                    className="w-full h-full object-cover opacity-85"
                    src="/main_section/leftknee.png"
                  />
                </div>
              </div>

              {/* Panel 2: Explainability (Grad-CAM Overlay) */}
              <div className="bg-[#453027]/40 border border-[#453027] rounded-2xl p-4 flex flex-col justify-between text-left">
                <div className="flex items-center gap-1.5 mb-3 text-[#BABABA]">
                  <Layers className="w-3.5 h-3.5 text-[#BABABA]" />
                  <span className="text-xs font-bold font-mono tracking-tight">Explainability (Grad-CAM)</span>
                </div>
                <div className="relative aspect-square rounded-xl overflow-hidden border border-[#453027] bg-[#453027]">
                  <img
                    alt="Grad-CAM Heatmap Overlay"
                    className="w-full h-full object-cover opacity-85"
                    src="/main_section/gradcam.jpg"
                  />
                </div>
              </div>

              {/* Panel 3: KL Grade Prediction */}
              <div className="bg-[#453027]/40 border border-[#453027] rounded-2xl p-4 flex flex-col justify-between space-y-3 text-left">
                <div>
                  <span className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest block">KL GRADE PREDICTION</span>
                  <h4 className="text-3xl font-black text-white tracking-tight font-heading leading-tight mt-0.5">
                    Healthy
                  </h4>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#BABABA] mb-1">
                    <span>Confidence Score</span>
                    <span className="font-bold text-[#BABABA]">32.7%</span>
                  </div>
                  <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                    <div className="h-full bg-[#FF6D29] rounded-full" style={{ width: "32.7%" }} />
                  </div>
                </div>

                <div className="space-y-1 pt-1 border-t border-[#453027] font-mono">
                  <span className="text-[9px] font-mono text-[#BABABA] uppercase tracking-widest block mb-1">PROBABILITY DISTRIBUTION</span>

                  <div className="space-y-1.5 text-[10px]">
                    {/* Healthy */}
                    <div>
                      <div className="flex items-center justify-between text-[#BABABA] text-[10px]">
                        <span>Healthy</span>
                        <span className="font-mono text-[#BABABA]">66.3%</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-[#FF6D29] rounded-full" style={{ width: "66.3%" }} />
                      </div>
                    </div>

                    {/* Doubtful */}
                    <div>
                      <div className="flex items-center justify-between text-[#BABABA] text-[10px]">
                        <span>Doubtful</span>
                        <span className="font-mono text-[#BABABA]">21.2%</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-[#6366F1] rounded-full" style={{ width: "21.2%" }} />
                      </div>
                    </div>

                    {/* Minimal */}
                    <div>
                      <div className="flex items-center justify-between text-[#BABABA] text-[10px]">
                        <span>Minimal</span>
                        <span className="font-mono text-[#BABABA]">12.5%</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-[#D16900] rounded-full" style={{ width: "12.5%" }} />
                      </div>
                    </div>

                    {/* Moderate */}
                    <div>
                      <div className="flex items-center justify-between text-[#BABABA] text-[10px]">
                        <span>Moderate</span>
                        <span className="font-mono text-[#BABABA]">0.0%</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-gray-700/25 rounded-full" style={{ width: "0%" }} />
                      </div>
                    </div>

                    {/* Severe */}
                    <div>
                      <div className="flex items-center justify-between text-[#BABABA] text-[10px]">
                        <span>Severe</span>
                        <span className="font-mono text-[#BABABA]">0.0%</span>
                      </div>
                      <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden mt-0.5">
                        <div className="h-full bg-gray-700/25 rounded-full" style={{ width: "0%" }} />
                      </div>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Row Grid containing Diagnostics and SteadyGerak chat */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left">

              {/* Diagnostics Insights */}
              <div className="lg:col-span-8 bg-[#453027]/30 border border-[#453027] rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="flex items-center gap-2 text-[#FF6D29]">
                  <Clipboard className="w-4 h-4 text-[#FF6D29]" />
                  <span className="text-xs font-bold font-mono tracking-widest uppercase">
                    Diagnostic Insights <span className="text-[10px] text-gray-550 font-normal lowercase">(AI Generated)</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <span className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest block mb-2.5">
                      Possible reasons for the diagnostic
                    </span>
                    <ul className="text-[11px] text-[#BABABA] space-y-2.5 list-none pl-0 leading-relaxed font-sans">
                      <li className="flex items-start gap-1.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6D29] shrink-0 select-none" />
                        <span>No visible osteophytes, joint space narrowing, or subchondral sclerosis detected on the radiographs.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#FF6D29] shrink-0 select-none" />
                        <span>Hyaline cartilage volume and underlying subchondral bone integrity both appear within normal parameters.</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest block mb-2.5">
                      Recommended Interventions
                    </span>
                    <ul className="text-[11px] text-[#BABABA] space-y-2.5 list-none pl-0 leading-relaxed font-sans">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6D29] shrink-0 mt-0.5" />
                        <span>PEAK strength and mobility exercises to reinforce quad alignment.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FF6D29] shrink-0 mt-0.5" />
                        <span>Regular low-impact walking and maintaining healthy weight loads.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* SteadyGerak Assistant Mini Chat widget */}
              <div className="lg:col-span-4 bg-[#453027]/30 border border-[#453027] rounded-2xl p-5 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between border-b border-[#453027] pb-2">
                  <div className="flex items-center gap-2">
                    {/* Stylized Avatar container */}
                    <div className="w-6 h-6 rounded-full bg-[#FF6D29]/10 border border-[#FF6D29]/20 flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#FF6D29] rounded-sm flex items-center justify-center opacity-80" style={{ clipPath: "polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)" }} />
                    </div>
                    <span className="text-xs font-bold text-white font-heading">SteadyGerak Assistant</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#FF6D29] tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29] animate-pulse" />
                    Online
                  </span>
                </div>

                {/* Message stack with Bot icon */}
                <div className="flex items-start gap-2.5 bg-black/20 rounded-xl p-3 flex-1">
                  <div className="w-5 h-5 rounded bg-[#FF6D29]/10 border border-[#FF6D29]/20 text-[#FF6D29] flex items-center justify-center text-[10px] shrink-0 font-bold mt-0.5">
                    🤖
                  </div>
                  <div className="text-[10.5px] text-[#BABABA] leading-relaxed max-h-[100px] overflow-y-auto w-full">
                    Hello! I've reviewed your results. Let's start custom predictions below!
                  </div>
                </div>

                {/* Input field with Send button */}
                <div className="relative flex items-center mt-2 w-full">
                  <input
                    disabled
                    placeholder="Ask about your condition..."
                    className="w-full bg-[#161316] text-[10.5px] border border-[#453027] rounded-xl pl-3 pr-9 py-2 text-white outline-none placeholder:text-gray-600 focus:border-[#3B82F6]"
                  />
                  <button className="absolute right-1.5 w-6 h-6 rounded-full bg-[#FF6D29]/10 hover:bg-[#FF6D29]/20 text-[#FF6D29] flex items-center justify-center transition-colors cursor-not-allowed">
                    <Send className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>

            </div>

            </div>
          </ContainerScroll>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl mx-auto flex flex-col items-center -mt-16 mb-20 z-10 relative"
        >
          {/* Subtext Centered */}
          <p className="text-lg sm:text-xl text-[#BABABA] max-w-2xl leading-relaxed font-sans">
            A clinical-grade AI assistant that clearly explains your knee X-rays, provides explainable segmentations, and builds a customized daily rehabilitation routine.
          </p>

          {/* Primary CTA centered */}
          <div className="mt-8 flex justify-center">
            <StartAnalyzingButton onClick={onOpenSandbox} />
          </div>
        </motion.div>


      </div>
    </section>
  );
}

export const StartAnalyzingButton = ({ 
  onClick, 
  text = "Start Analyzing", 
  icon: Icon = Play,
  className = "w-56 h-14 mx-auto",
  containerClassName = "flex justify-center mt-2"
}: { 
  onClick: () => void; 
  text?: string; 
  icon?: any; 
  className?: string;
  containerClassName?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <div className={containerClassName}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`relative inline-block group dark:bg-[#161316] bg-[#161316] border-[#453027] border-2 rounded-xl transition-transform active:scale-[0.98] ${className}`}
      >
        <div className="absolute w-[112.81%] h-[128.57%] top-[8.57%] left-1/2 -translate-x-1/2 filter blur-[19px] opacity-70">
          <span className="absolute inset-0 rounded-xl bg-[#FF6D29] filter blur-[6.5px]"></span>
          <div className="relative w-full h-full overflow-hidden rounded-xl">
            <Liquid isHovered={isHovered} colors={COLORS} />
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[92.23%] h-[112.85%] rounded-xl bg-[#453027] filter blur-[7.3px]"></div>
        <div className="relative w-full h-full overflow-hidden rounded-xl">
          <span className="absolute inset-0 rounded-xl bg-[#453027]"></span>
          <span className="absolute inset-0 rounded-xl bg-[#161316]"></span>
          <Liquid isHovered={isHovered} colors={COLORS} />
          {[1, 2, 3, 4, 5].map((i) => (
            <span
              key={i}
              className={`absolute inset-0 rounded-xl border-solid border-[3px] border-gradient-to-b from-transparent to-white/20 mix-blend-overlay filter ${i <= 2 ? 'blur-[3px]' : i === 3 ? 'blur-[5px]' : 'blur-[4px]'}`}
            ></span>
          ))}
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[40%] w-[70.8%] h-[42.85%] rounded-xl filter blur-[15px] bg-[#FF6D29]/40"></span>
        </div>
        <div className="absolute inset-0 rounded-xl bg-transparent pointer-events-none flex items-center justify-center gap-2">
          <span className="flex items-center justify-center px-4 gap-2 rounded-xl group-hover:text-white text-white text-base font-semibold tracking-wide whitespace-nowrap z-10 w-full h-full">
            <Icon className="group-hover:fill-white fill-white w-5 h-5 flex-shrink-0" />
            <span className="uppercase tracking-widest text-[11px] font-bold">{text}</span>
          </span>
        </div>
      </button>
    </div>
  );
};
