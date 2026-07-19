import { useState } from "react";
import { 
  Activity, 
  Eye, 
  TrendingUp, 
  ShieldCheck, 
  X, 
  CheckCircle,
  Clock, 
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeatureDetail {
  title: string;
  shortDesc: string;
  badge: string;
  icon: any;
  longDesc: string;
  specs: { label: string; value: string }[];
  useCases: string[];
  compliance: string[];
}

const platformFeatures: FeatureDetail[] = [
  {
    title: "AI-Powered KL Grade Classification",
    shortDesc: "A deep learning model trained to detect subtle joint changes and classify knee osteoarthritis severity from X-rays.",
    badge: "Deep Learning",
    icon: Activity,
    longDesc: "The system uses an EfficientNet-V2B3 deep learning model to analyze knee X-ray images and determine the Kellgren–Lawrence (KL) severity grade (0–4). The model was iteratively refined across 13 experimental configurations to find the best combination of training settings, achieving strong agreement with expert radiologist labels.",
    specs: [
      { label: "Model", value: "EfficientNet-V2B3 (Ordinal Regression)" },
      { label: "Agreement Score (QWK)", value: "0.81" },
      { label: "Average Error (MAE)", value: "0.41 grades" }
    ],
    useCases: [
      "Automated KL severity grading from X-ray upload",
      "Baseline and follow-up scan comparison",
      "Supporting clinical decision-making with AI confidence scores"
    ],
    compliance: ["Trained on OAI Dataset (8,260 images)", "Balanced Augmentation Applied", "Model Validation via Confusion Matrix & ROC-AUC"]
  },
  {
    title: "Explainable AI with Grad-CAM",
    shortDesc: "Every AI-generated grade is supported by a visual heatmap showing exactly which areas of the X-ray influenced the decision.",
    badge: "Explainability",
    icon: Eye,
    longDesc: "To build clinical trust, the system generates Gradient-weighted Class Activation Maps (Grad-CAM) for each prediction. These heatmaps highlight the specific regions — such as joint space narrowing, osteophyte formation, or sclerosis — that the model focused on when assigning a severity grade. This makes the AI's reasoning transparent and verifiable.",
    specs: [
      { label: "Method", value: "Grad-CAM (Gradient-weighted Class Activation)" },
      { label: "Overlay", value: "Heatmap on original X-ray image" },
      { label: "Adjustable", value: "Opacity slider for clinical review" }
    ],
    useCases: [
      "Visual explanation of AI decisions for patients",
      "Clinician verification of model reasoning",
      "Identifying specific regions of joint degradation"
    ],
    compliance: ["Supports Explainable AI (XAI) Principles", "Transparent Decision-Making for Clinical Trust"]
  },
  {
    title: "Behavioural Monitoring Ecosystem",
    shortDesc: "A Self-Determination Theory (SDT) grounded system that tracks joint health weekly and promotes rehabilitation adherence.",
    badge: "SDT Framework",
    icon: TrendingUp,
    longDesc: "The platform implements a 12-week rehabilitation cycle where users complete weekly check-ins (pain and stiffness levels), track exercise completion, and monitor their composite mobility score over time. Streaks, XP rewards, and progression charts provide competence feedback — a core SDT principle — to encourage long-term engagement with physiotherapy routines.",
    specs: [
      { label: "Cycle Length", value: "12 weeks per rehabilitation cycle" },
      { label: "Mobility Formula", value: "100 − (pain × 10) − (stiffness × 5)" },
      { label: "Tracking", value: "Weekly check-ins + exercise adherence" }
    ],
    useCases: [
      "Longitudinal tracking of pain and joint mobility",
      "Promoting exercise consistency through gamification",
      "Providing data-driven feedback to support patient competence"
    ],
    compliance: ["Grounded in Self-Determination Theory (SDT)", "Weekly Data Stored in Secure Database", "12-Week Cycle Aligned with Clinical Follow-Up Windows"]
  },
  {
    title: "Cross-Platform Deployment",
    shortDesc: "Built for real-time performance across devices with a modern web stack and cloud-hosted infrastructure.",
    badge: "Deployment",
    icon: ShieldCheck,
    longDesc: "The application is built with a React frontend and FastAPI backend, with data stored securely in Supabase (PostgreSQL). The deep learning model runs server-side with optimised inference, ensuring responsive performance even on older or resource-constrained devices. The system is designed to be accessible from any modern browser without requiring local installation.",
    specs: [
      { label: "Frontend", value: "React + TypeScript + Tailwind CSS" },
      { label: "Backend", value: "FastAPI (Python) + Supabase" },
      { label: "Inference", value: "Server-side TensorFlow (< 3 seconds)" }
    ],
    useCases: [
      "Accessible from any device with a web browser",
      "No local GPU or software installation required",
      "Real-time X-ray analysis with immediate results"
    ],
    compliance: ["Supabase Row-Level Security (RLS)", "Authenticated User Access via Supabase Auth", "Responsive Design for Mobile and Desktop"]
  }
];
import { RaycastBackground } from "../../../components/ui/raycast-animated-background";

export function Features() {
  const [selectedFeature, setSelectedFeature] = useState<FeatureDetail | null>(null);

  return (
    <section 
      id="platform-features" 
      className="py-24 px-4 sm:px-6 lg:px-8 bg-[#161316] border-t border-[#453027] relative z-10 overflow-hidden"
    >
      <div className="absolute inset-0 -z-10 pointer-events-none opacity-40 mix-blend-screen">
        <RaycastBackground className="w-full h-full object-cover" />
      </div>
      
      {/* SaaS subtle accent glow */}
      <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[110px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto">
        
        {/* Header containing metadata and standard styling */}
        <div className="mb-16 text-center max-w-3xl mx-auto">
          <p className="text-white tracking-widest text-[11px] font-extrabold uppercase mb-3 px-3 py-1 bg-[#FF6D29]/10 border border-[#FF6D29]/15 rounded-full inline-block font-mono">
            Platform Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-5 font-heading tracking-tight">
            Designed for Modern Clinical Operations
          </h2>
          <p className="text-[#BABABA] text-sm sm:text-base leading-relaxed font-sans">
            A secure, enterprise-ready software deck combining pixel-level vision models, robust diagnostic accountability, and seamless clinical system compatibility.
          </p>
        </div>

        {/* 4 Cards B2B SaaS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {platformFeatures.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                onClick={() => setSelectedFeature(feat)}
                whileHover={{ y: -6, borderColor: "rgba(59, 130, 246, 0.3)" }}
                className="bg-[#13141A]/50 backdrop-blur-md rounded-2xl border border-[#453027] p-6 flex flex-col justify-between cursor-pointer transition-all duration-300 hover:bg-[#13141A]/90 hover:shadow-xl hover:shadow-[#FF6D29]/5 select-none text-left relative group overflow-hidden"
              >
                {/* Inside card subtle glow design */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                <div className="space-y-4">
                  {/* Icon & Badge Line */}
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-[#FF6D29]/10 border border-[#FF6D29]/15 text-[#FF6D29] rounded-xl group-hover:bg-[#FF6D29] group-hover:text-white transition-all duration-300">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[9px] font-bold tracking-wider uppercase bg-white/5 border border-[#453027] px-2.5 py-0.5 rounded text-[#BABABA] font-mono">
                      {feat.badge}
                    </span>
                  </div>

                  {/* Text stack */}
                  <div className="space-y-2">
                    <h3 className="text-white font-bold text-base font-heading group-hover:text-[#FF6D29] transition-colors duration-200">
                      {feat.title}
                    </h3>
                    <p className="text-[#BABABA] text-xs leading-relaxed font-sans">
                      {feat.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-[#453027] flex items-center justify-between text-[11px] text-[#BABABA] font-mono group-hover:text-[#FF6D29] transition-colors duration-200">
                  <span>Explore Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Pop out Detail — Fullscreen Takeover */}
      <AnimatePresence>
        {selectedFeature && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-md" onClick={() => setSelectedFeature(null)}>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-5xl bg-[#13141A] rounded-3xl border border-[#453027] shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 bg-black/40 border-b border-[#453027] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-[#FF6D29]/10 border border-[#FF6D29]/15 text-[#FF6D29] rounded-xl">
                    <selectedFeature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[9px] font-bold font-mono text-[#FF6D29] uppercase tracking-widest bg-[#FF6D29]/10 px-2 py-0.5 rounded">
                      {selectedFeature.badge}
                    </span>
                    <h3 className="text-lg font-bold text-white font-heading mt-0.5">
                      {selectedFeature.title}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="p-1.5 rounded-lg bg-white/5 border border-[#453027] text-[#BABABA] hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 2-Column Content — No Scroll */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 md:p-8">
                {/* Left Column — Description + Use Cases */}
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest mb-2">Functional Overview</h4>
                    <p className="text-[#BABABA] text-sm leading-relaxed font-sans">
                      {selectedFeature.longDesc}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-[#453027]">
                    <h4 className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest mb-3 font-bold">Key Capabilities</h4>
                    <div className="space-y-2">
                      {selectedFeature.useCases.map((useCase, uIdx) => (
                        <div key={uIdx} className="flex items-start gap-2.5 p-2.5 bg-[#FF6D29]/5 border border-[#FF6D29]/10 rounded-lg">
                          <CheckCircle className="w-4 h-4 text-[#FF6D29] shrink-0 mt-0.5" />
                          <p className="text-white text-xs leading-relaxed font-sans">{useCase}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column — Specs + Standards */}
                <div className="space-y-5">
                  <div>
                    <h4 className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest mb-3 font-bold">Technical Specifications</h4>
                    <div className="space-y-2">
                      {selectedFeature.specs.map((spec, sIdx) => (
                        <div key={sIdx} className="bg-black/30 p-3 rounded-xl border border-[#453027]">
                          <span className="text-[10px] text-[#BABABA] font-mono block uppercase">{spec.label}</span>
                          <span className="text-white text-sm font-semibold font-mono mt-0.5 block">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[#453027]">
                    <h4 className="text-[10px] font-mono text-[#BABABA] uppercase tracking-widest mb-3 font-bold">Standards & Validation</h4>
                    <div className="space-y-2">
                      {selectedFeature.compliance.map((item, cIdx) => (
                        <div key={cIdx} className="flex items-start gap-2 text-xs text-[#BABABA] bg-white/5 border border-[#453027] py-2.5 px-3 rounded-lg">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#FF6D29] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-3 bg-black/40 border-t border-[#453027] flex justify-between items-center">
                <span className="text-[#BABABA] text-[10px] font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#FF6D29]" />
                  Module Active
                </span>
                <button
                  onClick={() => setSelectedFeature(null)}
                  className="px-4 py-2 bg-[#FF6D29] hover:bg-[#FF8D59] font-semibold rounded-xl text-white transition-colors cursor-pointer text-[11px]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </section>
  );
}
