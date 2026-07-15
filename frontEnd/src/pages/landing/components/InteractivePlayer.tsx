import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Volume2, Maximize, Activity, Sparkles, MessageSquare, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { LampContainer } from "../../../components/ui/lamp";

export function InteractivePlayer() {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(34); // starts at 4:22 (34% of 12:45)
  const [activeFrequency, setActiveFrequency] = useState<number>(340);
  const [peakingDb, setPeakingDb] = useState<number>(72);
  const [scanPosition, setScanPosition] = useState<number>(40);
  
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      simulationTimerRef.current = setInterval(() => {
        // Random progress advance
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 0.15;
        });

        // Scan animation line
        setScanPosition((prev) => {
          const next = prev + 1.5;
          return next > 95 ? 5 : next;
        });

        // Simulate real-time data
        const randFrequency = Math.floor(220 + Math.sin(Date.now() / 200) * 80 + Math.random() * 40);
        setActiveFrequency(randFrequency);

        if (Math.random() > 0.85) {
          setPeakingDb(Math.floor(70 + Math.random() * 15));
        } else {
          setPeakingDb(Math.floor(40 + Math.random() * 15));
        }
      }, 100);
    } else {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    }

    return () => {
      if (simulationTimerRef.current) {
        clearInterval(simulationTimerRef.current);
      }
    };
  }, [isPlaying]);

  const handleTogglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const formatTime = (percentage: number) => {
    const totalSeconds = 12 * 60 + 45; // 12:45
    const currentSeconds = Math.floor((percentage / 100) * totalSeconds);
    const mins = Math.floor(currentSeconds / 60);
    const secs = currentSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="py-24 bg-[#161316] border-t border-[#453027] scroll-mt-10 relative" id="sandbox">
      
      {/* Background radial highlight */}
      <div className="absolute right-1/4 top-1/3 w-[500px] h-[550px] bg-[#FF6D29]/5 rounded-full blur-[110px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header with Scroll Reveal */}
        <LampContainer className="-mb-8">
          <motion.div 
            initial={{ opacity: 0.5, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{
              delay: 0.3,
              duration: 0.8,
              ease: "easeInOut",
            }}
            className="flex flex-col items-center text-center mt-20 relative z-50"
          >
            <p className="flex items-center gap-2.5 text-white tracking-widest text-sm font-bold uppercase mb-6 z-50 bg-black/40 px-5 py-2 rounded-full border border-[#FF6D29]/30 backdrop-blur-xl drop-shadow-[0_0_15px_rgba(0,0,0,0.8)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              X-ray Knee Processing
            </p>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white font-heading tracking-tight z-50 drop-shadow-[0_10px_20px_rgba(0,0,0,0.9)] leading-tight">
              Walkthrough &amp; Real-time <br /> Video Demonstration
            </h2>
          </motion.div>
        </LampContainer>

        {/* Outer Frame with heights aligned with scroll transitions */}
        <div className="flex flex-col items-center max-w-4xl mx-auto gap-8">
          
          {/* Diagnostic Video Walkthrough Frame (Left Column Span 2) */}
          <motion.div 
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="relative w-full bg-[#13141A]/60 backdrop-blur-md rounded-3xl overflow-hidden border border-[#453027] shadow-2xl flex flex-col justify-between group min-h-[460px]"
          >
            
            {/* Main Video Viewport area */}
            <div className="flex-1 relative flex flex-col items-center justify-center p-6 bg-gradient-to-b from-transparent to-black/40 overflow-hidden">
              
              {/* Backing stylized X-ray projection graphic representing actual Knee Radiograph */}
              <div className="absolute inset-0 opacity-[0.22] flex justify-center items-center pointer-events-none select-none">
                <svg viewBox="0 0 200 200" className="w-[124%] h-[124%] text-[#FF6D29]/20">
                  <path d="M 60,10 L 140,10 L 140,75 Q 135,100 120,95 Q 100,90 80,95 Q 65,100 60,75 Z" fill="#20232a" stroke="currentColor" strokeWidth="1" />
                  <path d="M 60,190 L 140,190 L 140,125 Q 135,110 120,113 Q 100,118 80,113 Q 65,110 60,125 Z" fill="#1b1c21" stroke="currentColor" strokeWidth="1" />
                  {/* Grad-CAM transparent heatmap overlay */}
                  {isPlaying && (
                    <circle cx="106" cy="103" r="32" className="fill-red-500/15 blur-md animate-pulse" />
                  )}
                </svg>
              </div>

              {/* Dynamic Grad-CAM scan line laser */}
              {isPlaying && (
                <div 
                  style={{ top: `${scanPosition}%` }}
                  className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-lg shadow-[#FF6D29]/50 z-20 pointer-events-none transition-all duration-100"
                />
              )}

              {/* Central Trigger Action */}
              <div className="text-center z-10 space-y-5">
                {!isPlaying ? (
                  <>
                    <button 
                      onClick={handleTogglePlay}
                      className="w-20 h-20 rounded-full bg-[#FF6D29]/10 border border-[#FF6D29]/30 flex items-center justify-center transition-all duration-300 hover:scale-105 hover:bg-[#FF6D29] text-white cursor-pointer shadow-xl shadow-[#FF6D29]/10 group mx-auto"
                    >
                      <Play className="w-6 h-6 text-white fill-white translate-x-0.5 transition-transform group-hover:scale-95" />
                    </button>
                    <div className="space-y-1">
                      <p className="text-white text-base font-heading font-semibold tracking-wide">
                        Play Interactive Video Demonstration
                      </p>
                      <p className="text-[#BABABA] text-xs font-mono">
                        Walkthrough | Duration 12:45
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    {/* Live Waveform drawing */}
                    <div className="flex items-end justify-center gap-1.5 h-16 w-60 mx-auto bg-black/40 p-3 rounded-xl border border-[#453027]">
                      {[...Array(14)].map((_, i) => {
                        const waveHeight = isPlaying ? Math.floor(Math.random() * 45) + 8 : 4;
                        return (
                          <div 
                            key={i} 
                            style={{ height: `${waveHeight}px` }}
                            className="w-1.5 rounded-full transition-all duration-150 bg-[#FF6D29]"
                          />
                        );
                      })}
                    </div>
                    <div>
                      <p className="text-[#3B82F6] text-xs font-mono tracking-widest flex items-center justify-center gap-1.5 animate-pulse font-bold">
                        <Activity className="w-3.5 h-3.5" />
                        GRAD-CAM NEURAL PROJECTION OVERLAY INJECTED
                      </p>
                      <p className="text-[#BABABA] text-[10px] uppercase font-mono mt-0.5">
                        X-RAY SCANNER LEVEL: ACTIVE
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Diagnostics statistics badges top overlay */}
              {isPlaying && (
                <div className="absolute top-6 left-6 bg-[#161316]/95 border border-[#453027] px-4 py-2.5 rounded-xl flex items-center gap-3 z-35">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping shrink-0" />
                  <div>
                    <p className="text-white text-[11px] font-bold font-heading mb-0.5">
                      AI DIAGNOSTIC INTERPRETER
                    </p>
                    <p className="text-[10px] text-[#3B82F6] font-mono font-semibold">
                      SCAN RATE: {activeFrequency} FPS | DEEP GRIDS: ACTIVE
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Polished media command bar at the bottom */}
            <div className="px-5 py-4 border-t border-[#453027] bg-black/40 flex items-center justify-between gap-4">
              <div className="flex gap-3 items-center shrink-0">
                <button 
                  onClick={handleTogglePlay}
                  className="text-[#BABABA] hover:text-white transition-colors cursor-pointer"
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-5 h-5 text-[#3B82F6]" /> : <Play className="w-5 h-5" />}
                </button>
                <button 
                  onClick={() => setProgress(0)}
                  className="text-[#BABABA] hover:text-white transition-colors cursor-pointer"
                  title="Reset Demo"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>

              {/* Progress Scrubber */}
              <div className="flex-1 flex gap-4 items-center">
                <div 
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const clickX = e.clientX - rect.left;
                    const pct = (clickX / rect.width) * 100;
                    setProgress(pct);
                  }}
                  className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden cursor-pointer relative"
                >
                  <div 
                    style={{ width: `${progress}%` }}
                    className="h-full bg-[#FF6D29] transition-all duration-200"
                  />
                </div>
                <span className="text-[11px] font-mono text-white/50 shrink-0">
                  {formatTime(progress)} / 12:45
                </span>
              </div>

              <div className="flex gap-3 items-center shrink-0 text-[#BABABA]">
                <Volume2 className="w-4 h-4" />
                <Maximize className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
              </div>
            </div>
          </motion.div>



        </div>

      </div>
    </section>
  );
}
