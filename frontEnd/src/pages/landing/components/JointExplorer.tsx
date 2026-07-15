import { Bone, AlertTriangle, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { BentoGrid, type BentoItem } from "../../../components/ui/bento-grid";

export function JointExplorer() {
  const pathologyItems: BentoItem[] = [
    {
      title: "Subchondral Bone Sclerosis",
      description: "As cartilage fails, the underlying bone thickens and develops painful cysts and osteophytes (spurs).",
      icon: <Bone className="w-5 h-5 text-[#FF6D29]" />,
      status: "Pathology 01",
      hasPersistentHover: true,
      colSpan: 1
    },
    {
      title: "Synovitis & Effusion",
      description: "The joint lining becomes inflamed, producing excess fluid that leads to the 'swollen knee' sensation.",
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      status: "Pathology 02",
      hasPersistentHover: true,
      colSpan: 1
    }
  ];

  return (
    <section id="pathophysiology" className="bg-[#131315] w-full">
      <div className="py-16 px-6 max-w-7xl mx-auto">
        
        {/* Task 1: Section Header & Wrapper */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-[#FF6D29] text-sm font-bold tracking-widest uppercase mb-2">
            PATHOPHYSIOLOGY
          </p>
          <h2 className="text-4xl font-extrabold mb-6 font-heading">
            <motion.span
              initial={{ backgroundPosition: "200% center" }}
              whileInView={{ backgroundPosition: "-200% center" }}
              viewport={{ once: false }}
              transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 6 }}
              className="bg-[linear-gradient(110deg,#ffffff,45%,#FF6D29,55%,#ffffff)] bg-[length:200%_auto] text-transparent bg-clip-text"
            >
              The Science of Joint Decay
            </motion.span>
          </h2>
        </motion.div>

        {/* Task 2: Implement the 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start mt-8">
          
          {/* Task 3: Left Column (Content & Info Card) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Intro Paragraph */}
            <p className="text-gray-300 text-lg mb-8 leading-relaxed font-sans">
              Knee Osteoarthritis is not just 'wear and tear.' It is a whole-joint disease involving the degradation of hyaline cartilage, bone remodeling, and synovial inflammation.
            </p>

            {/* Bento Grid */}
            <div className="mb-8 w-full -mx-2 sm:mx-0">
              <BentoGrid items={pathologyItems} />
            </div>

            {/* Bottom Paragraph */}
            <p className="text-gray-300 text-sm leading-relaxed font-sans">
              Traditional diagnostics are <strong className="text-white">lagging indicators</strong>. By the time a patient feels pain, up to 10% of cartilage may already be lost. Our AI utilizes <strong className="text-white">advanced CNNs and Grad-CAM explainability</strong> to detect microscopic structural changes and catch decay in its infancy.
            </p>
          </motion.div>

          {/* Task 4: Right Column (Anatomical Image inside Terminal Mockup) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex items-center justify-center h-full"
          >
            <div className="w-full bg-[#131315] rounded-xl border border-[#424754]/50 shadow-2xl shadow-[#FF6D29]/5 overflow-hidden flex flex-col">
              {/* Browser Header */}
              <div className="flex items-center px-4 py-2.5 bg-[#1b1b1d] border-b border-[#424754]/30 relative">
                <div className="flex space-x-1.5 absolute left-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#424754]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#424754]"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-[#424754]"></div>
                </div>
                <div className="mx-auto flex items-center justify-center bg-[#0f0f11] border border-[#424754]/50 rounded-md px-3 py-1.5 w-3/4 max-w-sm">
                  <Lock className="w-3 h-3 text-gray-500 mr-2 shrink-0" />
                  <span className="text-gray-400 text-[11px] font-sans truncate tracking-wide">
                    app.steadygerak.com <span className="text-gray-600 mx-1">/</span> <span className="text-gray-300">Knee Degenerative Joint Disease</span>
                  </span>
                </div>
              </div>
              {/* Browser Body */}
              <div className="bg-[#0a0a0b] p-0 relative flex items-center justify-center overflow-hidden">
                <img 
                  src="/KOA_JointDisease.png" 
                  alt="Anatomy of Normal vs Osteoarthritis Knee" 
                  className="w-full h-auto object-contain"
                />
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
