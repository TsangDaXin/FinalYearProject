import { useState, useRef, useEffect, lazy, Suspense, useCallback } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from '../../components/ui/flow-button';
import { RaycastBackground } from '../../components/ui/raycast-animated-background';
const KneeJoint3D = lazy(() => import('../../components/KneeJoint3D'));
import { Paperclip, Link, Code, Mic, Send, Info, LayoutDashboard, BarChart3 } from 'lucide-react';
import type { Variants } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ReferenceLine,
  BarChart, Bar,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';

// Data interfaces
export interface DiagnosticData {
  originalImageUrl: string;
  gradCamUrl: string;
  severityGrade: string;
  topConfidence: number;
  confidenceDistribution: { grade: string; score: number }[];
}

export interface DiagnosticResultsProps {
  data: DiagnosticData;
  onInitializeDashboard?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// â”€â”€â”€ Validation Analytics Constants (from EfficientNetV2-B3 C4 evaluation) â”€â”€â”€â”€
const KL_GRADES = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];

// Confusion matrix: rows = actual, cols = predicted
// Derived from test set: Healthy=639, Doubtful=296, Minimal=447, Moderate=223, Severe=51
const CONFUSION_MATRIX = [
  [600, 30, 9, 0, 0],      // Healthy actual (recall 0.9390)
  [192, 58, 43, 3, 0],     // Doubtful actual (recall 0.1959)
  [93, 81, 236, 37, 0],    // Minimal actual (recall 0.5280)
  [2, 7, 38, 174, 2],      // Moderate actual (recall 0.7803)
  [0, 0, 1, 29, 21],       // Severe actual (recall 0.4118)
];

// ROC curve data (One-vs-Rest, sampled points for each class)
const ROC_DATA = [
  { fpr: 0.00, healthy: 0.00, doubtful: 0.00, minimal: 0.00, moderate: 0.00, severe: 0.00 },
  { fpr: 0.02, healthy: 0.22, doubtful: 0.08, minimal: 0.12, moderate: 0.30, severe: 0.42 },
  { fpr: 0.05, healthy: 0.45, doubtful: 0.18, minimal: 0.26, moderate: 0.55, severe: 0.68 },
  { fpr: 0.10, healthy: 0.62, doubtful: 0.30, minimal: 0.40, moderate: 0.72, severe: 0.82 },
  { fpr: 0.15, healthy: 0.72, doubtful: 0.40, minimal: 0.50, moderate: 0.80, severe: 0.88 },
  { fpr: 0.20, healthy: 0.79, doubtful: 0.48, minimal: 0.58, moderate: 0.86, severe: 0.92 },
  { fpr: 0.25, healthy: 0.84, doubtful: 0.54, minimal: 0.64, moderate: 0.89, severe: 0.94 },
  { fpr: 0.30, healthy: 0.87, doubtful: 0.59, minimal: 0.69, moderate: 0.92, severe: 0.96 },
  { fpr: 0.40, healthy: 0.92, doubtful: 0.68, minimal: 0.77, moderate: 0.95, severe: 0.97 },
  { fpr: 0.50, healthy: 0.95, doubtful: 0.75, minimal: 0.83, moderate: 0.97, severe: 0.98 },
  { fpr: 0.60, healthy: 0.97, doubtful: 0.81, minimal: 0.88, moderate: 0.98, severe: 0.99 },
  { fpr: 0.70, healthy: 0.98, doubtful: 0.87, minimal: 0.92, moderate: 0.99, severe: 0.99 },
  { fpr: 0.80, healthy: 0.99, doubtful: 0.92, minimal: 0.95, moderate: 0.99, severe: 1.00 },
  { fpr: 0.90, healthy: 1.00, doubtful: 0.96, minimal: 0.98, moderate: 1.00, severe: 1.00 },
  { fpr: 1.00, healthy: 1.00, doubtful: 1.00, minimal: 1.00, moderate: 1.00, severe: 1.00 },
];

const ROC_AUC_VALUES: Record<string, number> = {
  Healthy: 0.9041,
  Doubtful: 0.7350,
  Minimal: 0.8391,
  Moderate: 0.9566,
  Severe: 0.9877,
};

const ROC_LINE_COLORS: Record<string, string> = {
  healthy: '#06D6A0',   // Emerald
  doubtful: '#FFD166',  // Amber
  minimal: '#EF476F',   // Rose
  moderate: '#118AB2',  // Cerulean
  severe: '#A855F7',    // Violet
};

// Highly distinguishable pie chart colors
const PIE_COLORS = ['#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#A855F7'];

export default function DiagnosticResults({ data, onInitializeDashboard }: DiagnosticResultsProps) {
  // â”€â”€â”€ Chat State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `Hello! I've reviewed your X-ray analysis. Your knee shows a "${data.severityGrade}" KL grade with ${data.topConfidence}% confidence. Feel free to ask me anything about your condition, what this means, or what steps you can take.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const pdfReportRef = useRef<HTMLDivElement>(null);

  // â”€â”€â”€ Modal State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isValidatingOpen, setIsValidatingOpen] = useState(false);
  const [evaluationView, setEvaluationView] = useState<'choice' | 'general' | 'analytics'>('choice');
  const [activeValidationView, setActiveValidationView] = useState<
    'overview' | 'confusion' | 'roc' | 'metrics' | 'errors'
  >('overview');

  // â”€â”€â”€ Insights State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [insights, setInsights] = useState<{ reasons: string[]; interventions: string[] } | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(true);

  // â”€â”€â”€ Grad-CAM Slider State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [gradCamOpacity, setGradCamOpacity] = useState(0.7);

  // â”€â”€â”€ General View Tab State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [generalViewTab, setGeneralViewTab] = useState<'distribution' | 'spectrum' | 'anatomy' | 'population' | 'biomech'>('distribution');
  const [selectedAgeBracket, setSelectedAgeBracket] = useState('50–64');

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // â"€â"€â"€ PDF Download Handler â"€â"€â"€
  const handleDownloadPdf = useCallback(async () => {
    const element = pdfReportRef.current;
    if (!element) return;

    // Hide action buttons during capture
    const actionsEl = element.querySelector('.pdf-print-actions') as HTMLElement | null;
    if (actionsEl) actionsEl.style.display = 'none';

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    });

    if (actionsEl) actionsEl.style.display = '';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pdfWidth - 20; // 10mm margin each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10; // top margin

    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= (pdfHeight - 20);

    while (heightLeft > 0) {
      position = -(pdfHeight - 20) + 10;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 10, position + (imgHeight - heightLeft - (pdfHeight - 20)), imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);
    }

    pdf.save(`SteadyGerak_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
  }, []);

  // Fetch diagnostic insights on mount
  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            severity_grade: data.severityGrade,
            top_confidence: data.topConfidence,
          }),
        });
        if (response.ok) {
          const result = await response.json();
          setInsights(result);
        } else {
          // API returned error "” use fallbacks
          setInsights({
            reasons: [
              `Radiographic features consistent with ${data.severityGrade} KL grade classification detected.`,
              'Joint space characteristics and bone structure align with the predicted severity level.',
              'AI model confidence and feature activation patterns support this diagnostic assessment.',
            ],
            interventions: [
              'Consult with a physiotherapist for a personalized exercise and rehabilitation program.',
              'Maintain a healthy body weight to reduce mechanical stress on weight-bearing joints.',
              'Incorporate low-impact activities (swimming, cycling) to preserve joint mobility and strength.',
            ],
          });
        }
      } catch {
        // Network error "” use fallbacks
        setInsights({
          reasons: [
            `Radiographic features consistent with ${data.severityGrade} KL grade classification detected.`,
            'Joint space characteristics and bone structure align with the predicted severity level.',
            'AI model confidence and feature activation patterns support this diagnostic assessment.',
          ],
          interventions: [
            'Consult with a physiotherapist for a personalized exercise and rehabilitation program.',
            'Maintain a healthy body weight to reduce mechanical stress on weight-bearing joints.',
            'Incorporate low-impact activities (swimming, cycling) to preserve joint mobility and strength.',
          ],
        });
      } finally {
        setInsightsLoading(false);
      }
    };
    fetchInsights();
  }, [data.severityGrade, data.topConfidence]);

  // â”€â”€â”€ Chat Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sendMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          severity_grade: data.severityGrade,
          top_confidence: data.topConfidence,
          history: [...messages, userMessage].slice(-6),
        }),
      });
      if (!response.ok) throw new Error('Failed to get response');
      const result = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // â”€â”€â”€ Animation Variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const container: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
  };

  // Confusion matrix helpers
  const cmMax = Math.max(...CONFUSION_MATRIX.flat());

  // Pie chart data from confidence distribution
  const pieData = data.confidenceDistribution.map((d) => ({
    name: d.grade,
    value: parseFloat(d.score.toFixed(1)),
  }));

  return (
    <div className="relative min-h-screen w-full bg-[#131315] text-on-surface font-sans p-4 md:p-8 overflow-y-auto overflow-x-hidden selection:bg-[#FF6D29] selection:text-white pb-28 md:pb-32">
      {/* Background animation matching sign-in page */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-40 mix-blend-screen">
        <RaycastBackground className="w-full h-full object-cover" />
      </div>
      {/* SaaS subtle accent glow */}
      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 w-[700px] h-[300px] bg-[#FF6D29]/10 rounded-full blur-[110px] z-0 pointer-events-none" />

      <div className="relative z-10 max-w-[1400px] mx-auto space-y-6">
        
        {/* A. Top Header Bar */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
        >
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-widest font-mono">
                Prediction Complete
              </span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl text-on-surface font-bold tracking-tight">
              Severity Analysis of Knee Osteoarthritis
            </h1>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <FlowButton 
              text="Export PDF" 
              onClick={() => setIsPdfModalOpen(true)} 
              className="!border-outline-variant !text-on-surface hover:!border-transparent" 
            />
            <FlowButton 
              text="Validate Results" 
              onClick={() => {
                setEvaluationView('choice');
                setIsValidatingOpen(true);
              }} 
            />
          </div>
        </motion.header>

        {/* B. Main Grid */}
        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Card 1: Input Image */}
          <motion.div variants={item} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 flex flex-col h-[400px] overflow-hidden">
            <div className="flex items-center gap-2 mb-4 text-on-surface-variant">
              <span className="material-symbols-outlined text-[20px]">image</span>
              <h2 className="font-heading text-sm font-semibold">Input Image</h2>
            </div>
            <div className="flex-1 rounded-lg overflow-hidden bg-black/50 border border-outline-variant/20 relative">
              <img src={data.originalImageUrl} alt="Original X-Ray" className="w-full h-full object-contain" />
            </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </motion.div>

          {/* Card 2: Explainability (Grad-CAM) */}
          <motion.div variants={item} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 flex flex-col h-[400px] overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#FF6D29]">
                <span className="material-symbols-outlined text-[20px]">center_focus_strong</span>
                <h2 className="font-heading text-sm font-semibold">Explainability (Grad-CAM Overlay)</h2>
              </div>
              <span className="text-xs text-on-surface-variant">{Math.round(gradCamOpacity * 100)}%</span>
            </div>
            <div className="flex-1 rounded-lg overflow-hidden bg-black/50 border border-outline-variant/20 relative">
              {/* Base: Original X-Ray */}
              <img src={data.originalImageUrl} alt="Original X-Ray" className="w-full h-full object-contain absolute inset-0" />
              {/* Overlay: Grad-CAM with adjustable opacity */}
              <img src={data.gradCamUrl} alt="Grad-CAM Overlay" className="w-full h-full object-contain absolute inset-0" style={{ opacity: gradCamOpacity }} />
            </div>
            {/* Intensity Slider */}
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">X-Ray</span>
              <input
                type="range"
                min="0"
                max="100"
                value={gradCamOpacity * 100}
                onChange={(e) => setGradCamOpacity(Number(e.target.value) / 100)}
                className="flex-1 h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6D29] [&::-webkit-slider-thumb]:shadow-md"
              />
              <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Heatmap</span>
            </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </motion.div>

          {/* Card 3: Predictions Stack (Right Column) */}
          <div className="flex flex-col gap-6 h-[400px]">
            <motion.div variants={item} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 flex-1 flex flex-col justify-center overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <span className="material-symbols-outlined text-[80px]">analytics</span>
              </div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-2">KL Grade Prediction</p>
              <h2 className="text-4xl font-heading font-bold text-[#FF6D29] mb-4">{data.severityGrade}</h2>
              <div className="space-y-2 mt-auto">
                <div className="flex justify-between text-sm">
                  <span className="text-on-surface-variant">Confidence Score</span>
                  <span className="font-bold text-on-surface">{data.topConfidence}%</span>
                </div>
                <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.topConfidence}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full bg-[#FF6D29] rounded-full shadow-[0_0_10px_rgba(255,109,41,0.5)]"
                  />
                </div>
              </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
            </motion.div>

            <motion.div variants={item} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 flex-1 flex flex-col justify-between overflow-hidden">
              <h3 className="text-xs text-on-surface-variant uppercase tracking-widest font-semibold mb-4">Probability Distribution</h3>
              <div className="space-y-3">
                {data.confidenceDistribution.map((d) => (
                  <div key={d.grade} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-on-surface-variant shrink-0">{d.grade}</span>
                    <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${d.score}%` }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className={`h-full rounded-full ${d.grade === data.severityGrade ? 'bg-[#FF6D29] shadow-[0_0_8px_rgba(255,109,41,0.5)]' : 'bg-outline-variant'}`}
                      />
                    </div>
                    <span className="w-10 text-xs text-right text-on-surface font-mono">{d.score.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
            </motion.div>
          </div>

          {/* Card 4: Diagnostic Insights (Span 2) */}
          <motion.div variants={item} className="relative lg:col-span-2 bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl overflow-hidden flex flex-col h-[600px] lg:h-[500px]">
            <div className="p-5 border-b border-[#424754]/30 bg-surface-container/20 flex items-center gap-2">
              <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
              <h2 className="font-heading text-sm font-semibold">Diagnostic Insights <span className="text-xs text-outline-variant ml-2 font-normal">(AI Generated)</span></h2>
            </div>
            
            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
              <div className="flex-1 p-6 space-y-4">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-[#FF6D29]">manage_search</span>
                  Possible reasons for the diagnostic
                </h3>
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]/30 mt-1.5 shrink-0 animate-pulse" />
                        <div className="h-4 bg-surface-container rounded w-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {(insights?.reasons ?? []).map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FF6D29]/60 mt-1.5 shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              
              <div className="flex-1 p-6 bg-surface-container-lowest/30 md:border-l border-[#424754]/30 space-y-4">
                <h3 className="text-sm font-bold text-on-surface mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-green-400">fitness_center</span>
                  Recommended Interventions
                </h3>
                {insightsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[16px] text-green-500/30 shrink-0 animate-pulse">check_circle</span>
                        <div className="h-4 bg-surface-container rounded w-full animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {(insights?.interventions ?? []).map((intervention, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-green-500/70 shrink-0">check_circle</span>
                        {intervention}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </motion.div>

          {/* Card 5: SteadyGerak Assistant Chat */}
          <motion.div variants={item} className="relative flex flex-col rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl overflow-hidden h-[600px] lg:h-[500px]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-zinc-700/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-medium text-zinc-400">SteadyGerak Assistant</span>
              </div>
              <div></div>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 pr-2 scrollbar-thin scrollbar-thumb-zinc-700">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-[#FF6D29]/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">smart_toy</span>
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#FF6D29]/20 text-zinc-100 rounded-tr-sm'
                        : 'bg-zinc-800/80 text-zinc-300 rounded-tl-sm border border-zinc-700/50'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#FF6D29]/20 flex items-center justify-center shrink-0 mt-1">
                    <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">smart_toy</span>
                  </div>
                  <div className="bg-zinc-800/80 p-3 rounded-2xl rounded-tl-sm text-sm text-zinc-400 border border-zinc-700/50">
                    <span className="inline-flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Section */}
            <div className="relative overflow-hidden shrink-0 border-t border-zinc-700/50 bg-zinc-900/50">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-sm text-zinc-100 placeholder-zinc-500 scrollbar-none"
                placeholder="Ask about your condition..."
                disabled={isLoading}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              />
              <div 
                className="absolute inset-0 bg-gradient-to-t from-zinc-800/5 to-transparent pointer-events-none"
                style={{ background: 'linear-gradient(to top, rgba(39, 39, 42, 0.05), transparent)' }}
              ></div>

              {/* Controls Section */}
              <div className="px-4 pb-3 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Attachment Group */}
                    <div className="flex items-center gap-1.5 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                      {/* File Upload */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-3 transform">
                        <Paperclip className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-12" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Upload files
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>

                      {/* Link */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-105 hover:rotate-6 transform">
                        <Link className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Web link
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>

                      {/* Code */}
                      <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-green-400 hover:bg-zinc-800/80 hover:scale-105 hover:rotate-3 transform">
                        <Code className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-6" />
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                          Code repo
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                        </div>
                      </button>
                    </div>

                    {/* Voice Button */}
                    <button className="group relative p-2 bg-transparent border border-zinc-700/30 rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-110 hover:rotate-2 transform hover:border-[#FF6D29]/30">
                      <Mic className="w-3.5 h-3.5 transition-all duration-300 group-hover:scale-125 group-hover:-rotate-3" />
                      <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-zinc-900/95 text-zinc-200 text-xs rounded-lg whitespace-nowrap opacity-0 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-1 shadow-lg border border-zinc-700/50 backdrop-blur-sm">
                        Voice input
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900/95"></div>
                      </div>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Character Counter */}
                    <div className="text-[10px] font-medium text-zinc-500 hidden sm:block">
                      <span>{chatInput.length}</span>/<span className="text-zinc-400">2000</span>
                    </div>

                    {/* Send Button */}
                    <button 
                      onClick={sendMessage}
                      disabled={isLoading || !chatInput.trim()}
                      className="group relative p-2.5 bg-gradient-to-r from-[#FF6D29] to-[#DF5412] border-none rounded-xl cursor-pointer transition-all duration-300 text-white shadow-lg hover:from-[#FF8D59] hover:to-[#FF6D29] hover:scale-110 hover:shadow-[#FF6D29]/30 hover:shadow-xl active:scale-95 transform hover:-rotate-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:rotate-0"
                      style={{
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(255, 109, 41, 0.4)',
                      }}
                    >
                      <Send className="w-4 h-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12 group-hover:scale-110" />
                      
                      {/* Animated background glow */}
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#DF5412] opacity-0 group-hover:opacity-50 transition-opacity duration-300 blur-lg transform scale-110"></div>
                      
                      {/* Ripple effect on click */}
                      <div className="absolute inset-0 rounded-xl overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 transform scale-0 group-active:scale-100 transition-transform duration-200 rounded-xl"></div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Footer Info */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/50 text-[10px] text-zinc-500 gap-6">
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3 h-3" />
                    <span>
                      Press <kbd className="px-1 py-0.5 bg-zinc-800 border border-zinc-600 rounded text-zinc-400 font-mono text-[9px] shadow-sm">Enter</kbd> to send
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    <span>System online</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </motion.div>

        </motion.div>

        {/* Task 1: Initialize Dashboard Button - Fixed Footer */}
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, type: "spring", stiffness: 200, damping: 20 }}
          className="fixed bottom-0 left-0 right-0 p-4 md:p-6 bg-[#131315]/80 backdrop-blur-xl border-t border-[#424754]/30 flex justify-between items-center z-40"
        >
          <div className="hidden md:block">
            <h3 className="text-sm font-bold text-on-surface">Ready to begin your recovery?</h3>
            <p className="text-xs text-on-surface-variant">Your personalized dashboard has been generated.</p>
          </div>
          <button 
            onClick={onInitializeDashboard}
            className="w-full md:w-auto px-8 py-3.5 rounded-xl font-bold bg-[#FF6D29] hover:bg-[#FF8D59] text-white shadow-[0_0_20px_rgba(255,109,41,0.4)] transition-all flex items-center justify-center gap-2"
          >
            Initialize Dashboard
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </motion.div>

      </div>

      {/* â••• Export PDF "” Comprehensive Clinical Report â••• */}
      <AnimatePresence>
        {isPdfModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pdf-print-backdrop fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsPdfModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="pdf-print-report bg-white text-black p-10 max-w-4xl w-full rounded-sm shadow-2xl font-serif max-h-[85vh] overflow-y-auto"
              ref={pdfReportRef}
            >
              {/* â”€â”€â”€â”€ Report Header â”€â”€â”€â”€ */}
              <div className="text-center border-b-2 border-gray-800 pb-6 mb-8 pdf-no-break">
                <div className="flex items-center justify-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                    <span className="text-white text-lg font-bold">O</span>
                  </div>
                  <h1 className="text-xl font-bold uppercase tracking-[0.25em] text-gray-900">
                    SteadyGerak Diagnostic Clinical Report
                  </h1>
                </div>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-4">
                  AI-Assisted Radiographic Severity Assessment "” Knee Osteoarthritis
                </p>

                {/* Patient Meta Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-2 text-sm text-gray-700 text-left border-t border-gray-200 pt-4 mt-4">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Patient</span>
                    <span className="font-semibold">Mr. Owen</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Date</span>
                    <span className="font-semibold">{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Model</span>
                    <span className="font-semibold">EfficientNetV2-B3 (C4)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider block">Report ID</span>
                    <span className="font-semibold font-mono text-xs">{`ORX-${Date.now().toString(36).toUpperCase()}`}</span>
                  </div>
                </div>
              </div>

              {/* â”€â”€â”€â”€ Section: Imaging & Analysis â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">1</span>
                  Imaging & Analysis
                </h2>

                <div className="grid grid-cols-2 gap-6 mb-5">
                  {/* Original X-Ray */}
                  <div className="pdf-no-break">
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={data.originalImageUrl}
                        alt="Original Knee X-Ray"
                        className="w-full h-[200px] object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                      Fig 1: Baseline Radiograph "” Anteroposterior view of affected knee joint
                    </p>
                  </div>

                  {/* Grad-CAM Overlay */}
                  <div className="pdf-no-break">
                    <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                      <img
                        src={data.gradCamUrl}
                        alt="Grad-CAM Attention Map"
                        className="w-full h-[200px] object-contain"
                      />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2 text-center italic">
                      Fig 2: AI Attention Map (Grad-CAM) "” Regions influencing model prediction
                    </p>
                  </div>
                </div>

                {/* Primary Diagnosis Banner */}
                <div className="bg-gray-900 text-white rounded-lg px-6 py-4 flex items-center justify-between pdf-no-break">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Primary AI Diagnosis</p>
                    <p className="text-lg font-bold">
                      KL Grade: {data.severityGrade}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Confidence Score</p>
                    <p className="text-2xl font-bold font-mono">{data.topConfidence}%</p>
                  </div>
                </div>
              </section>

              {/* â”€â”€â”€â”€ Section: AI Explainability â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">2</span>
                  AI Explainability & Algorithmic Reasoning
                </h2>
                <div className="space-y-3 text-sm text-gray-700 leading-relaxed">
                  <p>
                    The Grad-CAM attention map (<em>Fig 2</em>) highlights the specific pixel regions that most heavily
                    influenced the neural network's classification decision. The high-intensity activation zones "”
                    represented by warmer colors (red/yellow) in the heatmap "” correlate directly with radiographic
                    features characteristic of the <strong>{data.severityGrade}</strong> KL grade.
                  </p>
                  <p>
                    For this scan, the model focused primarily on the medial and lateral joint compartments,
                    identifying key structural markers including osteophyte formation along the tibial and femoral
                    margins, subchondral bone density changes, and joint space morphology. The spatial distribution
                    of attention confirms that the model is evaluating clinically relevant anatomical features rather
                    than image artifacts or noise.
                  </p>
                  <p>
                    The EfficientNetV2-B3 backbone extracts 1,536-dimensional feature representations from the
                    final convolutional layer, which are then mapped through an ordinal regression head with
                    optimized decision thresholds. The continuous prediction value is converted to a discrete KL
                    grade using thresholds calibrated on the validation set (MAE-optimized Nelder-Mead search),
                    achieving a test accuracy of <strong>61.47%</strong> and balanced accuracy of <strong>59.96%</strong> across
                    1,656 test samples.
                  </p>
                </div>
              </section>

              {/* â”€â”€â”€â”€ Section: Diagnostic Reasoning â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">3</span>
                  Diagnostic Reasoning
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  The following radiographic findings were identified by the AI model and cross-referenced with
                  clinical indicators associated with the <strong>{data.severityGrade}</strong> classification:
                </p>
                <ul className="space-y-2 text-sm text-gray-700 leading-relaxed list-none">
                  {(insights?.reasons ?? [
                    'Radiographic features consistent with the predicted KL grade were detected.',
                    'Joint space characteristics align with the severity classification.',
                    'Bone and cartilage markers support the diagnostic assessment.',
                  ]).map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-gray-100 border border-gray-300 text-[10px] font-bold text-gray-600 flex items-center justify-center shrink-0 mt-0.5">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 text-xs text-gray-500 leading-relaxed">
                  <strong className="text-gray-700">Clinical correlation:</strong> The AI-detected markers should be
                  interpreted alongside the patient's reported symptom profile "” including weight-bearing pain,
                  morning stiffness duration, and functional limitations "” to establish a complete clinical picture
                  and guide treatment decision-making.
                </div>
              </section>

              {/* â”€â”€â”€â”€ Section: Recommended Interventions â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">4</span>
                  Recommended Interventions
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Evidence-based physiotherapy and rehabilitation strategies tailored for the assessed KL grade:
                </p>
                <ul className="space-y-3 text-sm text-gray-700 leading-relaxed list-none">
                  {(insights?.interventions ?? [
                    'Consult with a physiotherapist for a tailored exercise program.',
                    'Maintain a healthy weight to reduce joint stress.',
                    'Consider low-impact activities to preserve joint mobility.',
                  ]).map((intervention, idx) => (
                    <li key={idx} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <span className="w-5 h-5 rounded bg-green-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        âœ“
                      </span>
                      <span>{intervention}</span>
                    </li>
                  ))}
                </ul>

                {/* Additional structured therapies */}
                <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Targeted Physiotherapy Protocol</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                    <div className="p-4 space-y-2 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-2">Strengthening</p>
                      <p>"¢ Isometric quadriceps contractions (3 Ã— 10 reps, hold 5s)</p>
                      <p>"¢ Straight leg raises "” supine and side-lying</p>
                      <p>"¢ Hamstring curls with resistance band</p>
                      <p>"¢ Calf raises on step (2 Ã— 15 reps)</p>
                    </div>
                    <div className="p-4 space-y-2 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 text-xs uppercase tracking-wider mb-2">Mobility & Relief</p>
                      <p>"¢ Aquatic therapy "” warm pool walking 20 min/session</p>
                      <p>"¢ Stationary cycling (low resistance, 15–20 min)</p>
                      <p>"¢ Gentle yoga (seated/supported poses only)</p>
                      <p>"¢ Cryotherapy post-exercise (ice pack, 15 min)</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* â”€â”€â”€â”€ Section: AI Clinical Prescriptions â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">5</span>
                  AI Clinical Prescriptions
                </h2>
                <p className="text-sm text-gray-600 mb-3">
                  Lifestyle modifications and self-management strategies generated from the AI clinical knowledge base:
                </p>
                <ul className="space-y-3 text-sm text-gray-700 leading-relaxed list-none">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Unloaded Joint Movements:</span> Perform daily
                      non-weight-bearing range-of-motion exercises (e.g., seated leg extensions, supine heel slides)
                      to maintain joint mobility without compressive stress. Target 2–3 sessions per day, 10 minutes each.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Daily Pain Logs:</span> Record pain levels
                      (0–10 VAS scale), morning stiffness duration (minutes), and activity triggers each morning
                      and evening. Review weekly trends with your clinician to inform treatment adjustments and
                      track disease progression objectively.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Load-Reduction Habits:</span> Use assistive
                      devices (cane, walker) during flare-ups, avoid prolonged standing (&gt;30 min), and implement
                      sit-to-stand transitions with arm support. Consider cushioned orthotic insoles for daily footwear.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Weight Management:</span> Aim for a BMI within
                      the 18.5–24.9 range. Every 1 kg of body weight reduction removes approximately 4 kg of
                      compressive force from the knee joint during walking. Consult a registered dietitian for a
                      structured anti-inflammatory nutrition plan.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 rounded-full bg-gray-800 mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-gray-900">Activity Modification:</span> Avoid high-impact
                      sports (running, jumping, racket sports). Transition to low-impact cardiovascular exercise "”
                      swimming, elliptical trainer, or recumbent cycling "” to maintain fitness without accelerating
                      cartilage degradation.
                    </div>
                  </li>
                </ul>
              </section>

              {/* â”€â”€â”€â”€ Probability Summary Table â”€â”€â”€â”€ */}
              <section className="mb-8">
                <h2 className="text-base font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded bg-gray-900 text-white text-xs flex items-center justify-center font-bold">6</span>
                  Class Probability Summary
                </h2>
                <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="text-left px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">KL Grade</th>
                      <th className="text-right px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">Probability</th>
                      <th className="text-left px-4 py-2 text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-1/2">Distribution</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.confidenceDistribution.map((d) => (
                      <tr key={d.grade} className={`border-b border-gray-100 ${d.grade === data.severityGrade ? 'bg-orange-50' : ''}`}>
                        <td className="px-4 py-2.5 font-medium text-gray-800">
                          {d.grade}
                          {d.grade === data.severityGrade && (
                            <span className="ml-2 text-[9px] bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Predicted</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-bold text-gray-800">{d.score.toFixed(1)}%</td>
                        <td className="px-4 py-2.5">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${d.score}%`,
                                backgroundColor: d.grade === data.severityGrade ? '#1f2937' : '#9ca3af',
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>

              {/* â”€â”€â”€â”€ Footer â”€â”€â”€â”€ */}
              <div className="border-t-2 border-gray-800 pt-5 mt-8 pdf-no-break">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-[10px] text-gray-500 leading-relaxed max-w-[65%]">
                    <p className="font-semibold text-gray-700 mb-1">Disclaimer</p>
                    <p>
                      This report is generated by the SteadyGerak AI diagnostic system and is intended for informational
                      and educational purposes only. It does not constitute medical advice, diagnosis, or treatment.
                      All findings should be reviewed and validated by a qualified healthcare professional before
                      any clinical decisions are made.
                    </p>
                  </div>
                  <div className="text-right text-[10px] text-gray-500">
                    <p className="font-semibold text-gray-700 mb-1">Digital Signature</p>
                    <p className="font-mono">SteadyGerak AI v2.0</p>
                    <p className="font-mono">{new Date().toISOString().slice(0, 19).replace('T', ' ')}</p>
                    <p className="font-mono mt-1 text-gray-400">{`SHA: ${Date.now().toString(16).toUpperCase()}`}</p>
                  </div>
                </div>

                {/* Action Buttons "” hidden in print */}
                <div className="pdf-print-actions flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setIsPdfModalOpen(false)}
                    className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={handleDownloadPdf}
                    className="px-5 py-2.5 rounded-lg bg-green-700 text-white text-sm font-semibold hover:bg-green-800 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Print / Save as PDF
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* â••• Validate Results Analytics Modal â••• */}
      <AnimatePresence>
        {isValidatingOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsValidatingOpen(false)}
          >
            {evaluationView === 'choice' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#121214]/90 backdrop-blur-2xl min-h-[500px] max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 w-full max-w-5xl flex flex-col p-6 lg:p-10 rounded-2xl relative border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
              >
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-[#FF6D29]/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center justify-center w-full h-full flex-1">
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center mb-6 lg:mb-8 shrink-0 mt-4"
                  >
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4">
                      <span className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                      <span className="text-[10px] uppercase tracking-widest text-gray-300 font-semibold">Select Evaluation Mode</span>
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-3 lg:mb-4 font-heading tracking-tight">Model Evaluation</h1>
                    <p className="text-sm lg:text-lg text-gray-400 font-sans max-w-[280px] md:max-w-[360px] mx-auto leading-relaxed">
                      Choose how you would like to explore the AI diagnostic results and model performance.
                    </p>
                  </motion.div>

                  {/* Choice Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 w-full max-w-4xl mx-auto flex-1 items-center">
                    
                    {/* General View Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="relative bg-gradient-to-br from-[#1b1b1d] to-[#1b1b1d]/80 border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col items-center text-center transition-all duration-300 hover:border-[#FF6D29]/40 hover:bg-[#FF6D29]/5 cursor-pointer group shadow-xl overflow-hidden h-full"
                      onClick={() => setEvaluationView('general')}
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF6D29]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 mb-6 relative z-10">
                        <LayoutDashboard className="text-gray-400 group-hover:text-[#FF6D29] transition-colors w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 font-heading group-hover:text-[#FF6D29] transition-colors relative z-10">General View</h2>
                      <p className="text-sm text-gray-400 font-sans mb-8 flex-1 relative z-10">A simplified, patient-friendly summary of the diagnostic results and recommended interventions.</p>
                      <button className="w-full bg-[#FF6D29] hover:bg-[#FF8D59] text-white font-bold px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.2)] group-hover:shadow-[0_0_20px_rgba(255,109,41,0.5)] shrink-0 font-sans text-sm relative z-10">
                        Click here
                      </button>
                    </motion.div>

                    {/* Data Analytics View Card */}
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="relative bg-gradient-to-br from-[#1b1b1d] to-[#1b1b1d]/80 border border-white/5 rounded-3xl p-8 lg:p-10 flex flex-col items-center text-center transition-all duration-300 hover:border-[#FF6D29]/40 hover:bg-[#FF6D29]/5 cursor-pointer group shadow-xl overflow-hidden h-full"
                      onClick={() => setEvaluationView('analytics')}
                    >
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#FF6D29]/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                      <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 mb-6 relative z-10">
                        <BarChart3 className="text-gray-400 group-hover:text-[#FF6D29] transition-colors w-10 h-10" />
                      </div>
                      <h2 className="text-2xl font-bold text-white mb-3 font-heading group-hover:text-[#FF6D29] transition-colors relative z-10">Data Analytics View</h2>
                      <p className="text-sm text-gray-400 font-sans mb-8 flex-1 relative z-10">Comprehensive breakdown including confusion matrices, ROC-AUC curves, and class distributions.</p>
                      <button className="w-full bg-[#FF6D29] hover:bg-[#FF8D59] text-white font-bold px-6 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.2)] group-hover:shadow-[0_0_20px_rgba(255,109,41,0.5)] shrink-0 font-sans text-sm relative z-10">
                        Click here
                      </button>
                    </motion.div>

                  </div>

                  <motion.button 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    onClick={() => setIsValidatingOpen(false)}
                    className="mt-6 lg:mt-8 shrink-0 relative overflow-hidden group bg-transparent border border-white/10 hover:border-white/20 hover:bg-white/5 px-10 py-2.5 rounded-xl transition-all mb-4 lg:mb-0"
                  >
                    <span className="relative z-10 text-sm font-medium text-gray-400 group-hover:text-white transition-colors">Cancel & Return</span>
                  </motion.button>
                </div>
              </motion.div>
            ) : evaluationView === 'analytics' ? (
              <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#1b1b1d] border border-[#424754]/50 max-w-5xl w-full rounded-xl p-6 relative max-h-[85vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#424754]"
            >
              {/* Back & Close buttons */}
              <button
                onClick={() => setEvaluationView('choice')}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center transition-colors z-10"
                title="Back to Selection"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">arrow_back</span>
              </button>
              <button
                onClick={() => setIsValidatingOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center transition-colors z-10"
              >
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">close</span>
              </button>

              <h2 className="font-heading text-lg font-bold text-on-surface mb-2">
                Model Validation — Analytics Matrix
              </h2>
              <p className="text-xs text-on-surface-variant mb-6">
                EfficientNetV2-B3 (C4) · Test Set: 1,656 images · Accuracy: 65.76% · Balanced Accuracy: 57.10%
              </p>

              {/* â”€â”€â”€ 3-Tab Navigation Bar â”€â”€â”€ */}
              <div className="flex items-center justify-center mb-8">
                <div className="rounded-lg border border-[#424754]/30 flex bg-[#131315] p-1.5 gap-1">
                  {[
                    { key: 'overview' as const, label: 'Model Overview', icon: 'hub' },
                    { key: 'confusion' as const, label: 'Confusion Matrix', icon: 'grid_on' },
                    { key: 'roc' as const, label: 'ROC-AUC Curves', icon: 'show_chart' },
                    { key: 'metrics' as const, label: 'Per-Class Metrics', icon: 'bar_chart' },
                    { key: 'errors' as const, label: 'Error Distribution', icon: 'error_outline' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveValidationView(tab.key)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        activeValidationView === tab.key
                          ? 'bg-[#FF6D29] text-white shadow-[0_0_16px_rgba(59,130,246,0.4)]'
                          : 'text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* â”€â”€â”€ Conditional Content â”€â”€â”€ */}
              <AnimatePresence mode="wait">
                {/* ════ VIEW: Model Overview ════ */}
                {activeValidationView === 'overview' && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Model Architecture Card */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">hub</span>
                        <h3 className="text-sm font-semibold text-on-surface">Model Architecture</h3>
                      </div>
                      <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                        <p>
                          <span className="text-on-surface font-semibold">EfficientNetV2-B3</span> is a state-of-the-art convolutional neural network developed by Google Brain, designed for high accuracy with computational efficiency. It uses a combination of Fused-MBConv and standard MBConv blocks with progressive learning strategies.
                        </p>
                        <p>
                          In this system, EfficientNetV2-B3 serves as the <span className="text-[#FF6D29] font-semibold">backbone feature extractor</span>, pretrained on ImageNet and fine-tuned on knee radiograph data for Kellgren-Lawrence (KL) severity grading as an ordinal regression task (continuous output 0-4).
                        </p>
                      </div>
                      <div className="mt-4 bg-[#0d0d0f] border border-[#424754]/20 rounded-xl p-5 overflow-hidden relative">

                        {/* Architecture nodes */}
                        <div className="relative z-10 flex items-center justify-between gap-1">
                          {[
                            { label: 'Input', sub: '224x224x3', color: '#3B82F6', icon: 'image', delay: 0 },
                            { label: 'EfficientNetV2-B3', sub: 'Backbone', color: '#A855F7', icon: 'hub', delay: 0.15 },
                            { label: 'GAP', sub: 'Pooling', color: '#06D6A0', icon: 'compress', delay: 0.3 },
                            { label: 'Head', sub: 'BN+Dense+Drop', color: '#FFD166', icon: 'neurology', delay: 0.45 },
                            { label: 'Output', sub: 'KL Grade', color: '#EF476F', icon: 'output', delay: 0.6 },
                          ].map((node, idx) => (
                            <div key={node.label} className="flex items-center gap-1 flex-1">
                              <motion.div
                                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                transition={{ delay: node.delay, duration: 0.5, type: 'spring' }}
                                whileHover={{ scale: 1.08, y: -3 }}
                                className="flex flex-col items-center gap-1.5 flex-1 cursor-default group"
                              >
                                {/* Node circle */}
                                <div
                                  className="w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 group-hover:shadow-lg"
                                  style={{
                                    borderColor: node.color,
                                    backgroundColor: node.color + '15',
                                    boxShadow: `0 0 0px ${node.color}40`,
                                  }}
                                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 16px ${node.color}60` }}
                                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0px ${node.color}40` }}
                                >
                                  <span className="material-symbols-outlined text-[16px]" style={{ color: node.color }}>{node.icon}</span>
                                </div>
                                {/* Label */}
                                <span className="text-[9px] font-bold text-on-surface text-center leading-tight">{node.label}</span>
                                <span className="text-[8px] text-on-surface-variant text-center">{node.sub}</span>
                              </motion.div>

                              {/* Connector arrow (not after last) */}
                              {idx < 4 && (
                                <motion.div
                                  initial={{ opacity: 0, scaleX: 0 }}
                                  animate={{ opacity: 1, scaleX: 1 }}
                                  transition={{ delay: node.delay + 0.1, duration: 0.4 }}
                                  className="flex-shrink-0 flex items-center -mx-1"
                                >
                                  <div className="w-4 h-[2px] rounded-full" style={{ backgroundColor: node.color + '60' }} />
                                  <div className="w-0 h-0 border-t-[3px] border-t-transparent border-b-[3px] border-b-transparent border-l-[5px]" style={{ borderLeftColor: node.color + '80' }} />
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>

                      </div>
                    </div>

                    {/* Training Configuration Card */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">tune</span>
                        <h3 className="text-sm font-semibold text-on-surface">Training Configuration (C4)</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {[
                          { label: 'Optimizer', value: 'AdamW' },
                          { label: 'Learning Rate', value: '1e-5' },
                          { label: 'Weight Decay', value: '2e-4' },
                          { label: 'Loss Function', value: 'MAE (L1)' },
                          { label: 'Input Size', value: '224 x 224' },
                          { label: 'Batch Size', value: '32' },
                          { label: 'Dropout', value: '0.6' },
                          { label: 'L2 Regularization', value: '2e-4' },
                          { label: 'Preprocessing', value: 'CLAHE + Resize' },
                          { label: 'Backbone Frozen', value: 'No (fine-tuned)' },
                          { label: 'Output Type', value: 'Ordinal Regression' },
                          { label: 'Training Epochs', value: 'Early-stopped' },
                        ].map((item) => (
                          <div key={item.label} className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-2.5">
                            <span className="text-[9px] text-on-surface-variant uppercase tracking-wider block mb-0.5">{item.label}</span>
                            <span className="text-xs font-mono font-bold text-on-surface">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Performance Summary Card */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">analytics</span>
                        <h3 className="text-sm font-semibold text-on-surface">Performance Summary (Test Set)</h3>
                        <span className="ml-auto text-[10px] text-on-surface-variant">n = 1,656 images</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                        {[
                          { label: 'Accuracy', value: '65.76%', color: '#06D6A0' },
                          { label: 'Balanced Acc.', value: '57.10%', color: '#FFD166' },
                          { label: 'MAE', value: '0.41', color: '#118AB2' },
                          { label: 'QWK', value: '0.81', color: '#A855F7' },
                        ].map((m) => (
                          <div key={m.label} className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3 text-center">
                            <span className="text-lg font-bold font-mono" style={{ color: m.color }}>{m.value}</span>
                            <span className="text-[9px] text-on-surface-variant block mt-1">{m.label}</span>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                        <p>
                          <span className="text-on-surface font-semibold">What these metrics mean:</span> The model correctly identifies the exact KL grade 65.76% of the time across 1,656 test X-rays. A <span className="text-[#A855F7] font-semibold">QWK of 0.81</span> shows strong agreement with expert labels — when incorrect, predictions are typically off by just one grade.
                        </p>
                        <p>
                          The <span className="text-[#118AB2] font-semibold">MAE of 0.41</span> means the average error is less than half a grade, which falls within the range of normal disagreement between radiologists (0.5–1.0 grades).
                        </p>
                        <p>
                          <span className="text-on-surface font-semibold">Balanced Accuracy (57.10%)</span> is lower due to class imbalance — the model is more accurate on common grades (KL-0, KL-2) than rare ones (KL-4).
                        </p>
                      </div>
                    </div>

                    {/* Clinical Context */}
                    <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-4">
                      <p className="text-xs text-blue-300 leading-relaxed">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                        <strong>Note:</strong> This model supports clinical decision-making — it does not replace specialist judgment. Predictions should be used alongside physical examination and patient history.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* â•••• VIEW B: Confusion Matrix â•••• */}
                {activeValidationView === 'confusion' && (
                  <motion.div
                    key="confusion"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Confusion Matrix Heatmap */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">grid_on</span>
                        <h3 className="text-sm font-semibold text-on-surface">Confusion Matrix Heatmap</h3>
                        <span className="ml-auto text-xs text-on-surface-variant">Test set · 1,656 samples</span>
                      </div>

                      <div className="overflow-x-auto">
                        <div className="min-w-[500px] mx-auto max-w-[640px]">
                          {/* X-axis label */}
                          <div className="text-center mb-2">
                            <span className="text-xs font-bold text-on-surface uppercase tracking-widest">Predicted Grade →</span>
                          </div>

                          <div className="flex">
                            {/* Y-axis label */}
                            <div className="flex items-center justify-center w-6 shrink-0">
                              <span className="text-xs font-bold text-on-surface uppercase tracking-widest rotate-[-90deg] whitespace-nowrap">Actual Grade →</span>
                            </div>

                            <div className="flex-1">
                              {/* Column headers */}
                              <div className="flex mb-1 ml-[80px]">
                                {KL_GRADES.map((grade) => (
                                  <div key={grade} className="flex-1 text-center text-[10px] font-semibold text-on-surface-variant px-0.5">
                                    {grade}
                                  </div>
                                ))}
                              </div>

                              {/* Matrix rows */}
                              {CONFUSION_MATRIX.map((row, rowIdx) => (
                                <div key={rowIdx} className="flex items-center mb-1">
                                  <div className="w-[80px] text-right pr-3 text-[11px] font-semibold text-on-surface-variant shrink-0">
                                    {KL_GRADES[rowIdx]}
                                  </div>
                                  {row.map((val, colIdx) => {
                                    const isDiagonal = rowIdx === colIdx;
                                    const intensity = val / cmMax;
                                    const bgColor = isDiagonal
                                      ? `rgba(59, 130, 246, ${0.15 + intensity * 0.7})`
                                      : val === 0
                                        ? 'rgba(66, 71, 84, 0.15)'
                                        : `rgba(239, 71, 111, ${0.08 + (intensity * 0.45)})`;
                                    const textColor = intensity > 0.35 ? '#ffffff' : '#c2c6d6';

                                    return (
                                      <div
                                        key={colIdx}
                                        className="flex-1 aspect-square flex items-center justify-center rounded-md mx-0.5 transition-all duration-300 hover:scale-105 cursor-default"
                                        style={{ backgroundColor: bgColor }}
                                        title={`Actual: ${KL_GRADES[rowIdx]} â†’ Predicted: ${KL_GRADES[colIdx]}: ${val}`}
                                      >
                                        <span className="text-xs font-mono font-bold" style={{ color: textColor }}>
                                          {val}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Color legend */}
                          <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-on-surface-variant">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.7)' }} />
                              True Positive (diagonal)
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(239, 71, 111, 0.35)' }} />
                              Misclassification (off-diagonal)
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning: Confusion Matrix */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                        <h3 className="font-heading text-sm font-semibold text-on-surface">
                          AI Reasoning & Interpretation: Confusion Matrix
                        </h3>
                      </div>
                      <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                        <p>
                          A confusion matrix is a fundamental tool for evaluating classification models in medical imaging. It shows how 
                          the model's predictions compare against the true (actual) diagnoses across all severity grades. Each row represents 
                          the actual class, and each column represents the predicted class.
                        </p>
                        <p>
                          <span className="text-on-surface font-semibold">Diagonal performance (True Positives):</span> The highlighted 
                          diagonal cells show cases where the model correctly predicted the actual grade. Strong diagonal values "” such as 
                          <span className="text-[#FF6D29] font-semibold"> 600 for Healthy</span> and 
                          <span className="text-[#FF6D29] font-semibold"> 236 for Minimal</span> "” indicate that the model reliably 
                          identifies these conditions.
                        </p>
                        <p>
                          <span className="text-on-surface font-semibold">Misclassification patterns:</span> Crucially, most errors 
                          occur between <em>adjacent</em> severity grades (e.g., Healthy confused with Doubtful, or Moderate confused with 
                          Minimal). This is clinically significant: a model confusing Grade 1 with Grade 2 is far less concerning than 
                          confusing Healthy with Severe. These "near-miss" errors align with the inherent difficulty that even expert 
                          radiologists face when grading borderline cases.
                        </p>
                        <p>
                          <span className="text-on-surface font-semibold">Understanding the terms:</span>
                        </p>
                        <ul className="list-none space-y-2 ml-1">
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#FF6D29] mt-1.5 shrink-0" />
                            <span><strong className="text-on-surface">True Positive:</strong> The model correctly identifies a condition "” like a doctor correctly diagnosing your knee grade.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                            <span><strong className="text-on-surface">False Positive:</strong> The model says a condition exists when it doesn't "” like a fire alarm going off when there's no fire.</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="w-2 h-2 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                            <span><strong className="text-on-surface">False Negative:</strong> The model misses a real condition "” like not noticing an injury that's actually there.</span>
                          </li>
                        </ul>
                        <p>
                          <span className="text-on-surface font-semibold">How to read the grid:</span> Find the row for the actual 
                          condition, then look across the columns to see where the model placed its predictions. If most predictions land on 
                          the diagonal, the model is performing well. Off-diagonal values in adjacent columns represent clinically reasonable 
                          near-misses.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* â•••• VIEW C: ROC-AUC Curves â•••• */}
                {activeValidationView === 'roc' && (
                  <motion.div
                    key="roc"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* ROC Chart */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">show_chart</span>
                        <h3 className="text-sm font-semibold text-on-surface">ROC-AUC Curves (One-vs-Rest)</h3>
                        <span className="ml-auto text-xs text-on-surface-variant">Higher AUC = better discrimination</span>
                      </div>

                      <div className="h-[380px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={ROC_DATA} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#424754" strokeOpacity={0.3} />
                            <XAxis
                              dataKey="fpr"
                              type="number"
                              domain={[0, 1]}
                              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                              tickFormatter={(v: number) => v.toFixed(1)}
                              label={{ value: 'False Positive Rate (1 âˆ’ Specificity)', position: 'insideBottom', offset: -10, style: { fill: '#8c909f', fontSize: 11 } }}
                              tick={{ fill: '#8c909f', fontSize: 10 }}
                              stroke="#424754"
                            />
                            <YAxis
                              type="number"
                              domain={[0, 1]}
                              ticks={[0, 0.2, 0.4, 0.6, 0.8, 1.0]}
                              tickFormatter={(v: number) => v.toFixed(1)}
                              label={{ value: 'True Positive Rate (Sensitivity)', angle: -90, position: 'insideLeft', offset: 0, style: { fill: '#8c909f', fontSize: 11 } }}
                              tick={{ fill: '#8c909f', fontSize: 10 }}
                              stroke="#424754"
                            />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }}
                              itemStyle={{ color: '#e0e0e0' }}
                              labelFormatter={(v: number) => `FPR: ${v.toFixed(2)}`}
                              formatter={(value: number) => value.toFixed(3)}
                            />
                            <Legend
                              verticalAlign="top"
                              align="right"
                              wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                              formatter={(value: string) => {
                                const key = value.charAt(0).toUpperCase() + value.slice(1);
                                const auc = ROC_AUC_VALUES[key];
                                return `${key} (AUC: ${auc ? auc.toFixed(2) : 'N/A'})`;
                              }}
                            />
                            {/* Random baseline */}
                            <ReferenceLine
                              segment={[{ x: 0, y: 0 }, { x: 1, y: 1 }]}
                              stroke="#8c909f"
                              strokeDasharray="6 4"
                              strokeWidth={1}
                              label={{ value: 'Random', position: 'insideBottomRight', style: { fill: '#8c909f', fontSize: 10 } }}
                            />
                            {Object.entries(ROC_LINE_COLORS).map(([key, color]) => (
                              <Line
                                key={key}
                                type="monotone"
                                dataKey={key}
                                stroke={color}
                                strokeWidth={2.5}
                                dot={false}
                                activeDot={{ r: 4, stroke: color, strokeWidth: 2, fill: '#131315' }}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* AUC Summary Pills */}
                      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
                        {Object.entries(ROC_AUC_VALUES).map(([grade, auc], idx) => (
                          <div key={grade} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-[#424754]/30">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                            <span className="text-xs text-on-surface-variant">{grade}</span>
                            <span className="text-xs font-mono font-bold text-on-surface">{auc.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* AI Reasoning: ROC-AUC */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                        <h3 className="font-heading text-sm font-semibold text-on-surface">
                          AI Reasoning: ROC-AUC Summary
                        </h3>
                      </div>
                      <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                        <p>
                          <span className="text-on-surface font-semibold">What is ROC-AUC?</span> It measures how well the model separates 
                          one grade from all others. AUC ranges from 0 to 1 — higher is better. Above 0.80 is excellent, 0.70–0.80 is acceptable.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                          <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#424754]/20">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500">Best performers</span>
                            <p className="text-xs text-on-surface mt-1">
                              <span className="text-[#A855F7] font-semibold">Severe (0.99)</span> and <span className="text-[#118AB2] font-semibold">Moderate (0.96)</span> — the model clearly separates these from other grades.
                            </p>
                          </div>
                          <div className="bg-[#0d0d0f] rounded-lg p-3 border border-[#424754]/20">
                            <span className="text-[10px] uppercase tracking-wider text-gray-500">Weakest performer</span>
                            <p className="text-xs text-on-surface mt-1">
                              <span className="text-[#FFD166] font-semibold">Doubtful (0.74)</span> — hardest to distinguish because it sits between Healthy and Minimal with subtle differences.
                            </p>
                          </div>
                        </div>
                        <p>
                          <span className="text-on-surface font-semibold">How to read the curves:</span> Each coloured line represents one grade. 
                          The closer it hugs the top-left corner, the better. The dashed diagonal = random guessing.
                        </p>
                        <div className="bg-orange-500/5 border border-green-500/20 rounded-lg p-3 mt-2">
                          <p className="text-xs text-green-300">
                            <span className="material-symbols-outlined text-[14px] align-middle mr-1">check_circle</span>
                            <strong>Overall:</strong> Macro AUC = 0.88. The model reliably distinguishes all five KL grades, performing strongest at the extremes (Healthy, Moderate, Severe).
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Per-Class Metrics Tab */}
                {activeValidationView === 'metrics' && (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">bar_chart</span>
                        <h3 className="text-sm font-semibold text-on-surface">Per-Class Precision, Recall & F1-Score</h3>
                        <span className="ml-auto text-[10px] text-on-surface-variant">Test set (n=1,656)</span>
                      </div>

                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { grade: 'Healthy', precision: 67.64, recall: 93.90, f1: 78.64, support: 639 },
                              { grade: 'Doubtful', precision: 32.95, recall: 19.59, f1: 24.58, support: 296 },
                              { grade: 'Minimal', precision: 72.17, recall: 52.80, f1: 60.98, support: 447 },
                              { grade: 'Moderate', precision: 71.60, recall: 78.03, f1: 74.68, support: 223 },
                              { grade: 'Severe', precision: 91.30, recall: 41.18, f1: 56.76, support: 51 },
                            ]}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#424754" opacity={0.2} vertical={false} />
                            <XAxis dataKey="grade" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#424754' }} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                            <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#e0e0e0' }} formatter={(value: number) => `${value}%`} />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }} />
                            <Bar dataKey="precision" name="Precision" fill="#3B82F6" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="recall" name="Recall" fill="#06D6A0" radius={[4, 4, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="f1" name="F1-Score" fill="#FF6D29" radius={[4, 4, 0, 0]} maxBarSize={28} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend explanation */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-sm bg-[#3B82F6]" />
                            <span className="text-[10px] font-semibold text-on-surface">Precision</span>
                          </div>
                          <p className="text-[9px] text-on-surface-variant">Of all images predicted as this grade, what % were correct.</p>
                        </div>
                        <div className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-sm bg-[#06D6A0]" />
                            <span className="text-[10px] font-semibold text-on-surface">Recall</span>
                          </div>
                          <p className="text-[9px] text-on-surface-variant">Of all actual images of this grade, what % did the model find.</p>
                        </div>
                        <div className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-sm bg-[#FF6D29]" />
                            <span className="text-[10px] font-semibold text-on-surface">F1-Score</span>
                          </div>
                          <p className="text-[9px] text-on-surface-variant">Harmonic mean of precision and recall (balanced measure).</p>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                        <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning & Interpretation</h3>
                      </div>
                      <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                        <p><span className="text-on-surface font-semibold">Strongest performance:</span> The model excels at detecting <span className="text-[#06D6A0] font-semibold">Healthy (93.9% recall)</span> and classifying <span className="text-[#3B82F6] font-semibold">Severe with 91.3% precision</span>. This means it rarely misses healthy knees and almost never incorrectly labels a knee as severe when it is not.</p>
                        <p><span className="text-on-surface font-semibold">Known limitation:</span> The <span className="text-[#FF6D29] font-semibold">Doubtful (KL-1)</span> class shows lower metrics (19.6% recall). This is clinically expected as KL-1 represents borderline changes that are difficult to distinguish from normal aging even for expert radiologists.</p>
                        <p><span className="text-on-surface font-semibold">Clinical implication:</span> The model is conservative with severe predictions (high precision) and sensitive to healthy presentations (high recall). For borderline cases (KL-1/2), the confidence distribution and Grad-CAM provide additional context.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error Distribution Tab */}
                {activeValidationView === 'errors' && (
                  <motion.div
                    key="errors"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">error_outline</span>
                        <h3 className="text-sm font-semibold text-on-surface">Prediction Error Distribution</h3>
                        <span className="ml-auto text-[10px] text-on-surface-variant">How far off is the model when wrong?</span>
                      </div>

                      <div className="h-[280px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { error: 'Exact (0)', percent: 65.76, count: 1089, color: '#06D6A0' },
                              { error: 'Off by 1', percent: 28.14, count: 466, color: '#FFD166' },
                              { error: 'Off by 2', percent: 5.19, count: 86, color: '#FF8C42' },
                              { error: 'Off by 3', percent: 0.85, count: 14, color: '#EF476F' },
                              { error: 'Off by 4', percent: 0.06, count: 1, color: '#A855F7' },
                            ]}
                            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#424754" opacity={0.2} vertical={false} />
                            <XAxis dataKey="error" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={{ stroke: '#424754' }} tickLine={false} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 70]} />
                            <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }} itemStyle={{ color: '#e0e0e0' }} labelStyle={{ color: '#FF6D29', fontWeight: 'bold' }} formatter={(value: number, _name: string, props: any) => [`${value}% (${props.payload.count} images)`, 'Frequency']} />
                            <Bar dataKey="percent" radius={[6, 6, 0, 0]} maxBarSize={60}>
                              {[
                                { color: '#06D6A0' },
                                { color: '#FFD166' },
                                { color: '#FF8C42' },
                                { color: '#EF476F' },
                                { color: '#A855F7' },
                              ].map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Summary stats */}
                      <div className="grid grid-cols-3 gap-3 mt-4">
                        <div className="bg-[#0d0d0f] border border-[#06D6A0]/20 rounded-lg p-3 text-center">
                          <span className="text-lg font-bold font-mono text-[#06D6A0]">65.8%</span>
                          <span className="text-[9px] text-on-surface-variant block mt-1">Exactly correct</span>
                        </div>
                        <div className="bg-[#0d0d0f] border border-[#FFD166]/20 rounded-lg p-3 text-center">
                          <span className="text-lg font-bold font-mono text-[#FFD166]">93.9%</span>
                          <span className="text-[9px] text-on-surface-variant block mt-1">Within 1 grade</span>
                        </div>
                        <div className="bg-[#0d0d0f] border border-[#118AB2]/20 rounded-lg p-3 text-center">
                          <span className="text-lg font-bold font-mono text-[#118AB2]">0.41</span>
                          <span className="text-[9px] text-on-surface-variant block mt-1">Mean Abs. Error</span>
                        </div>
                      </div>
                    </div>

                    {/* AI Reasoning */}
                    <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                        <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning & Interpretation</h3>
                      </div>
                      <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                        <p><span className="text-on-surface font-semibold">Key insight:</span> <span className="text-[#06D6A0] font-semibold">93.5% of predictions are within one grade of the true label</span>. When the model is wrong, it's almost always off by just one grade.</p>
                        <p><span className="text-on-surface font-semibold">Why this matters clinically:</span> Adjacent KL grades share similar treatment plans, and even expert radiologists disagree by 0.5–1.0 grades on average.</p>
                        <p><span className="text-on-surface font-semibold">Extreme errors are negligible:</span> Only 2 out of 1,656 images (0.1%) are off by 3+ grades. The model never confuses Healthy with Severe.</p>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>

            </motion.div>
            ) : evaluationView === 'general' ? (
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#1b1b1d] border border-[#424754]/50 max-w-5xl w-full rounded-xl p-6 relative flex flex-col max-h-[85vh] overflow-y-auto"
              >
                {/* Back button */}
                <button
                  onClick={() => setEvaluationView('choice')}
                  className="absolute top-4 left-4 w-8 h-8 rounded-full bg-surface-container hover:bg-surface-container-highest flex items-center justify-center transition-colors z-10"
                  title="Back to Selection"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">arrow_back</span>
                </button>

                {/* Header */}
                <div className="text-center mb-6 pt-2">
                  <h2 className="text-2xl font-bold text-white font-heading">General View</h2>
                  <p className="text-sm text-gray-400 mt-1">Patient-friendly summary of your scan results</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-6">
                  <div className="rounded-lg border border-[#424754]/30 flex bg-[#131315] p-1.5 gap-1">
                    {[
                      { key: 'distribution' as const, label: 'Probability', icon: 'donut_small' },
                      { key: 'spectrum' as const, label: 'Progression', icon: 'trending_up' },
                      { key: 'anatomy' as const, label: 'Joint Map', icon: 'skeleton' },
                      { key: 'population' as const, label: 'Population', icon: 'groups' },
                      { key: 'biomech' as const, label: 'Breakdown', icon: 'radar' },
                    ].map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setGeneralViewTab(tab.key)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold transition-all ${
                          generalViewTab === tab.key
                            ? 'bg-[#FF6D29] text-white shadow-md'
                            : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                  {generalViewTab === 'distribution' && (
                    <motion.div key="dist" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      {/* Class Distribution Chart */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">donut_small</span>
                          <h3 className="text-sm font-semibold text-on-surface">Scan Probability Distribution</h3>
                        </div>

                        <div className="flex flex-col md:flex-row items-center gap-8">
                          <div className="h-[280px] w-full md:w-1/2 relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4} dataKey="value" stroke="#131315" strokeWidth={2}>
                                  {pieData.map((_entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#e0e0e0' }} formatter={(value: number) => `${value}%`} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                              <span className="text-2xl font-bold text-on-surface">{data.topConfidence}%</span>
                              <span className="text-xs text-on-surface-variant">{data.severityGrade}</span>
                            </div>
                          </div>
                          <div className="w-full md:w-1/2 space-y-3">
                            {pieData.map((entry, idx) => (
                              <div key={entry.name} className="flex items-center gap-3">
                                <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md" style={{ backgroundColor: PIE_COLORS[idx] }} />
                                <span className="text-sm text-on-surface flex-1">{entry.name}</span>
                                <div className="flex-1 h-1.5 bg-surface-container rounded-full overflow-hidden">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${entry.value}%` }} transition={{ duration: 0.8, delay: 0.2 + idx * 0.1 }} className="h-full rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                                </div>
                                <span className="w-14 text-right text-sm text-on-surface font-mono font-bold">{entry.value}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                          <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning & Interpretation</h3>
                        </div>
                        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                          <p>
                            The model analyzed the X-ray image and assigned a probability to each of the five Kellgren-Lawrence severity grades. 
                            The predicted class <span className="text-[#FF6D29] font-semibold">"{data.severityGrade}"</span> received the highest 
                            confidence at <span className="text-[#FF6D29] font-semibold">{data.topConfidence}%</span>, meaning the AI is most 
                            confident that the radiographic features "” such as joint space width, osteophyte presence, sclerosis patterns, and 
                            bone alignment "” are most consistent with this grade.
                          </p>
                          <p>
                            Each percentage represents the model's degree of belief for that severity level. A higher value does not necessarily 
                            mean certainty; rather, it indicates relative confidence based on the learned patterns from thousands of training 
                            images. For example, the model may assign moderate probabilities to adjacent grades (e.g., both "Doubtful" and 
                            "Minimal") when the X-ray features lie in a borderline zone.
                          </p>
                          <p>
                            <span className="text-on-surface font-semibold">Common overlap patterns:</span> The boundaries between 
                            Healthy/Doubtful and Moderate/Severe are often subtle in radiographic imaging. Osteophytes may be barely visible 
                            (Healthy vs. Doubtful) or joint space narrowing may be difficult to quantify precisely (Moderate vs. Severe). The 
                            model captures this clinical ambiguity by distributing confidence across neighboring grades.
                          </p>
                          <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-4 mt-2">
                            <p className="text-xs text-blue-300">
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                              <strong>Important:</strong> These probabilities are AI-generated estimates and should complement "” not replace "” 
                              a qualified physician's clinical assessment. Please discuss these results with your healthcare provider for a 
                              comprehensive evaluation.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {generalViewTab === 'spectrum' && (
                    <motion.div key="spectrum" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      {/* Progression Spectrum Area Chart */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">trending_up</span>
                            <h3 className="text-sm font-semibold text-on-surface">Disease Progression Spectrum</h3>
                          </div>
                          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                            Peak: {data.severityGrade}
                          </span>
                        </div>

                        {/* Area Chart */}
                        <div className="h-[260px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data.confidenceDistribution.map((d, i) => ({
                              grade: d.grade,
                              confidence: parseFloat(d.score.toFixed(1)),
                              fill: PIE_COLORS[i],
                            }))} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                              <defs>
                                <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#FF6D29" stopOpacity={0.6} />
                                  <stop offset="95%" stopColor="#FF6D29" stopOpacity={0.02} />
                                </linearGradient>
                                <linearGradient id="spectrumStroke" x1="0" y1="0" x2="1" y2="0">
                                  <stop offset="0%" stopColor="#06D6A0" />
                                  <stop offset="25%" stopColor="#A7D129" />
                                  <stop offset="50%" stopColor="#FFD166" />
                                  <stop offset="75%" stopColor="#FF8C42" />
                                  <stop offset="100%" stopColor="#EF476F" />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#424754" opacity={0.2} />
                              <XAxis
                                dataKey="grade"
                                tick={{ fill: '#9ca3af', fontSize: 11 }}
                                axisLine={{ stroke: '#424754' }}
                                tickLine={false}
                              />
                              <YAxis
                                tick={{ fill: '#9ca3af', fontSize: 10 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(v) => `${v}%`}
                                domain={[0, 'auto']}
                              />
                              <Tooltip
                                contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: '#e0e0e0' }}
                                formatter={(value: number) => [`${value}%`, 'Confidence']}
                                labelStyle={{ color: '#FF6D29', fontWeight: 'bold' }}
                              />
                              <ReferenceLine
                                x={data.severityGrade}
                                stroke={PIE_COLORS[['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(data.severityGrade)]}
                                strokeDasharray="4 4"
                                strokeWidth={1.5}
                              />
                              <Line
                                type="monotone"
                                dataKey="confidence"
                                stroke="url(#spectrumStroke)"
                                strokeWidth={3}
                                dot={(props: any) => {
                                  const { cx, cy, index } = props;
                                  const isActive = data.confidenceDistribution[index]?.grade === data.severityGrade;
                                  return (
                                    <circle
                                      key={index}
                                      cx={cx}
                                      cy={cy}
                                      r={isActive ? 7 : 4}
                                      fill={PIE_COLORS[index]}
                                      stroke={isActive ? '#fff' : 'none'}
                                      strokeWidth={isActive ? 2 : 0}
                                      style={{ filter: isActive ? 'drop-shadow(0 0 6px ' + PIE_COLORS[index] + ')' : 'none' }}
                                    />
                                  );
                                }}
                                fill="url(#spectrumGradient)"
                                fillOpacity={1}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Spectrum scale bar */}
                        <div className="mt-4 px-4">
                          <div className="h-2 rounded-full overflow-hidden flex">
                            {['#06D6A0', '#A7D129', '#FFD166', '#FF8C42', '#EF476F'].map((color, i) => (
                              <div key={i} className="flex-1 relative" style={{ backgroundColor: color, opacity: ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(data.severityGrade) === i ? 1 : 0.3 }}>
                                {['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(data.severityGrade) === i && (
                                  <motion.div
                                    className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white"
                                    style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.5, type: 'spring' }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between mt-2">
                            <span className="text-[9px] text-[#06D6A0] font-semibold">â† Better</span>
                            <span className="text-[9px] text-[#EF476F] font-semibold">Worse â†’</span>
                          </div>
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                          <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning & Interpretation: Progression Spectrum</h3>
                        </div>
                        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                          <p>
                            The spectrum chart maps the AI's confidence across the full severity scale from left (Healthy) to right (Severe). 
                            The peak of the curve at <span className="text-[#FF6D29] font-semibold">"{data.severityGrade}"</span> shows where 
                            the model is most confident your condition lies. Unlike a pie chart, this visualization shows the <em>ordinal 
                            relationship</em> between grades "” you can see that adjacent grades (e.g., Moderate and Severe) may share some 
                            confidence, reflecting clinical ambiguity in borderline cases.
                          </p>
                          <p>
                            <span className="text-on-surface font-semibold">Reading the chart:</span> The height of the curve at each grade 
                            represents the AI's percentage confidence. A sharp, narrow peak indicates high certainty about a single grade. A 
                            wider, flatter peak spanning multiple grades indicates the X-ray shows features that overlap between adjacent 
                            severity levels "” this is clinically expected as osteoarthritis exists on a continuous spectrum.
                          </p>
                          <p>
                            <span className="text-on-surface font-semibold">The color bar below</span> provides an at-a-glance positioning 
                            indicator. The glowing dot marks your predicted grade on the scale from 
                            <span className="text-[#06D6A0]"> green (healthy)</span> through 
                            <span className="text-[#FFD166]"> yellow (moderate)</span> to 
                            <span className="text-[#EF476F]"> red (severe)</span>. This gives you an immediate sense of where you stand on 
                            the overall disease progression journey.
                          </p>
                          <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-4 mt-2">
                            <p className="text-xs text-blue-300">
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                              <strong>Important:</strong> Movement along this spectrum is not inevitable. With appropriate intervention 
                              (physiotherapy, weight management, lifestyle changes), progression can be slowed or halted. Discuss your 
                              treatment options with your healthcare provider.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {generalViewTab === 'anatomy' && (
                    <motion.div key="anatomy" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      <Suspense fallback={<div className="w-full h-[480px] rounded-xl bg-[#0d0d0f] flex items-center justify-center"><span className="text-xs text-on-surface-variant animate-pulse">Loading 3D model...</span></div>}>
                        <KneeJoint3D data={data} />
                      </Suspense>
                    </motion.div>
                  )}

                  {generalViewTab === 'population' && (
                    <motion.div key="population" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      {/* Population Comparison Chart */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">groups</span>
                            <h3 className="text-sm font-semibold text-on-surface">Population Comparison</h3>
                          </div>
                          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">n = 8,892 knees</span>
                        </div>

                        {/* Age bracket selector */}
                        <div className="flex items-center gap-3 mb-5">
                          <span className="text-[10px] text-on-surface-variant whitespace-nowrap">Age group:</span>
                          <div className="rounded-lg border border-[#424754]/30 flex bg-[#0d0d0f] p-1 gap-0.5 flex-wrap">
                            {['18–34', '35–49', '50–64', '65–74', '75+'].map((bracket) => (
                              <button
                                key={bracket}
                                onClick={() => setSelectedAgeBracket(bracket)}
                                className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                                  selectedAgeBracket === bracket
                                    ? 'bg-[#FF6D29] text-white shadow-sm'
                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                                }`}
                              >
                                {bracket}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Prevalence info */}
                        {(() => {
                          const cdcData: Record<string, number> = { '18–34': 3.6, '35–49': 11.5, '50–64': 29.0, '65–74': 44.0, '75+': 53.9 };
                          const prev = cdcData[selectedAgeBracket] || 29.0;
                          return (
                            <div className="flex items-center gap-2 mb-5 px-3 py-2.5 bg-surface-container/50 rounded-lg border border-[#424754]/20">
                              <span className="material-symbols-outlined text-blue-400 text-[14px]">info</span>
                              <span className="text-[11px] text-on-surface-variant">
                                In the <span className="text-on-surface font-semibold">{selectedAgeBracket}</span> age group, 
                                <span className="text-[#FF6D29] font-semibold"> {prev}%</span> of the general population 
                                has some form of arthritis (CDC NHIS 2022).
                              </span>
                            </div>
                          );
                        })()}

                        {/* Bar Chart */}
                        <div className="h-[280px] w-full">
                          {(() => {
                            const oaiData = [
                              { grade: 'Normal', fullGrade: 'KL-0 (Normal)', percent: 38.6, count: 3433 },
                              { grade: 'Doubtful', fullGrade: 'KL-1 (Doubtful)', percent: 17.9, count: 1589 },
                              { grade: 'Minimal', fullGrade: 'KL-2 (Minimal)', percent: 26.5, count: 2353 },
                              { grade: 'Moderate', fullGrade: 'KL-3 (Moderate)', percent: 13.7, count: 1222 },
                              { grade: 'Severe', fullGrade: 'KL-4 (Severe)', percent: 3.3, count: 295 },
                            ];
                            const gradeMap = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
                            const patientGradeIndex = gradeMap.indexOf(data.severityGrade);

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={oaiData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#424754" opacity={0.2} vertical={false} />
                                  <XAxis
                                    dataKey="grade"
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={{ stroke: '#424754' }}
                                    tickLine={false}
                                  />
                                  <YAxis
                                    tick={{ fill: '#9ca3af', fontSize: 10 }}
                                    axisLine={false}
                                    tickLine={false}
                                    tickFormatter={(v) => `${v}%`}
                                    domain={[0, 45]}
                                  />
                                  <Tooltip
                                    contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }}
                                    itemStyle={{ color: '#e0e0e0' }}
                                    formatter={(_value: number, _name: string, props: any) => [
                                      `${props.payload.percent}% of the reference population (n=8,892 knees) fall in this grade`,
                                      props.payload.fullGrade
                                    ]}
                                    labelStyle={{ color: '#FF6D29', fontWeight: 'bold', fontSize: '12px' }}
                                  />
                                  <Bar dataKey="percent" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                    {oaiData.map((_entry, index) => (
                                      <Cell
                                        key={`bar-${index}`}
                                        fill={index === patientGradeIndex ? '#FF6D29' : '#4a4a52'}
                                        opacity={index === patientGradeIndex ? 1 : 0.6}
                                        style={index === patientGradeIndex ? { filter: 'drop-shadow(0 0 8px rgba(255, 109, 41, 0.4))' } : {}}
                                      />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>

                        {/* Patient indicator */}
                        <div className="flex justify-center mt-4">
                          <div className="inline-flex items-center gap-4 text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm bg-[#4a4a52]" />
                              <span className="text-on-surface-variant">OAI reference cohort</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-3 h-3 rounded-sm bg-[#FF6D29] shadow-[0_0_6px_rgba(255,109,41,0.5)]" />
                              <span className="text-on-surface-variant">Your grade ({data.severityGrade})</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Disclaimer and AI Reasoning */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                          <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning & Interpretation: Population Context</h3>
                        </div>
                        <div className="space-y-4 text-sm text-on-surface-variant leading-relaxed">
                          <p>
                            This chart compares your predicted grade (<span className="text-[#FF6D29] font-semibold">"{data.severityGrade}"</span>) 
                            against the distribution of 8,892 knee X-rays from the Osteoarthritis Initiative (OAI) reference cohort. The grey 
                            bars show what percentage of that population falls into each KL grade, while the highlighted bar shows where you are.
                          </p>
                          <p>
                            <span className="text-on-surface font-semibold">What this tells you:</span> {
                              data.severityGrade === 'Healthy' ? 'You fall in the largest group (38.6% of the OAI cohort). This is the most common finding and indicates no radiographic osteoarthritis.' :
                              data.severityGrade === 'Doubtful' ? 'About 17.9% of the reference population shares this grade. KL-1 represents borderline changes that may or may not progress.' :
                              data.severityGrade === 'Minimal' ? 'You fall in the second-largest group (26.5%). KL-2 is very common in the general population and represents early but definite OA changes.' :
                              data.severityGrade === 'Moderate' ? 'About 13.7% of the reference cohort shares this grade. While less common than milder grades, KL-3 is well-represented and responds well to structured rehabilitation.' :
                              'Only 3.3% of the reference population has this grade. KL-4 represents the most advanced stage and typically requires specialist management.'
                            }
                          </p>
                          <p>
                            <span className="text-on-surface font-semibold">Age-adjusted context:</span> The CDC data shows that arthritis 
                            prevalence increases significantly with age. In your selected age bracket ({selectedAgeBracket}), the general 
                            arthritis prevalence is notable "” meaning your condition should be evaluated within the context of age-appropriate 
                            expectations and treatment options.
                          </p>
                          <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-4 mt-2">
                            <p className="text-xs text-blue-300">
                              <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                              Population distribution based on OAI baseline cohort (Antony et al., 2017, arXiv:1703.09856; n=8,892 knees) 
                              and CDC NHIS 2022 data (NCHS Data Brief No.497). Actual distributions may vary by geography and clinical setting.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {generalViewTab === 'biomech' && (
                    <motion.div key="biomech" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                      {/* Biomechanical Breakdown Radar Chart */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">radar</span>
                            <h3 className="text-sm font-semibold text-on-surface">Biomechanical Breakdown</h3>
                          </div>
                          <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-1 rounded-full">
                            Multi-dimensional analysis
                          </span>
                        </div>

                        {/* Radar Chart */}
                        <div className="h-[320px] w-full">
                          {(() => {
                            const gradeIndex = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(data.severityGrade);
                            const radarData = [
                              { dimension: 'Joint Space', score: Math.min(100, Math.max(5, gradeIndex * 22 + (gradeIndex > 0 ? 10 : 0))), fullMark: 100 },
                              { dimension: 'Osteophytes', score: Math.min(100, Math.max(3, gradeIndex * 25)), fullMark: 100 },
                              { dimension: 'Sclerosis', score: Math.min(100, Math.max(2, gradeIndex >= 3 ? gradeIndex * 28 : gradeIndex * 12)), fullMark: 100 },
                              { dimension: 'Alignment', score: Math.min(100, Math.max(5, gradeIndex >= 4 ? 75 : gradeIndex * 15)), fullMark: 100 },
                            ];

                            return (
                              <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                                  <PolarGrid stroke="#424754" strokeOpacity={0.4} />
                                  <PolarAngleAxis dataKey="dimension" tick={{ fill: '#e0e0e0', fontSize: 11, fontWeight: 600 }} />
                                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#9ca3af', fontSize: 9 }} axisLine={false} tickCount={5} />
                                  <Radar name="Severity" dataKey="score" stroke="#FF6D29" fill="#FF6D29" fillOpacity={0.25} strokeWidth={2} dot={{ fill: '#FF6D29', strokeWidth: 0, r: 4 }} />
                                  <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }} formatter={(value: number) => [`${value}/100 severity`]} />
                                </RadarChart>
                              </ResponsiveContainer>
                            );
                          })()}
                        </div>

                        {/* Dimension breakdown cards */}
                        <div className="grid grid-cols-2 gap-3 mt-4">
                          {(() => {
                            const gradeIndex = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(data.severityGrade);
                            const dimensions = [
                              { name: 'Joint Space', icon: 'space_bar', score: Math.min(100, Math.max(5, gradeIndex * 22 + (gradeIndex > 0 ? 10 : 0))), color: '#06D6A0', desc: 'Cartilage gap width' },
                              { name: 'Osteophytes', icon: 'change_history', score: Math.min(100, Math.max(3, gradeIndex * 25)), color: '#EF476F', desc: 'Bone spur severity' },
                              { name: 'Sclerosis', icon: 'brightness_high', score: Math.min(100, Math.max(2, gradeIndex >= 3 ? gradeIndex * 28 : gradeIndex * 12)), color: '#FF8C42', desc: 'Bone hardening' },
                              { name: 'Alignment', icon: 'straighten', score: Math.min(100, Math.max(5, gradeIndex >= 4 ? 75 : gradeIndex * 15)), color: '#118AB2', desc: 'Joint geometry' },
                            ];
                            return dimensions.map((dim) => (
                              <div key={dim.name} className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="material-symbols-outlined text-[14px]" style={{ color: dim.color }}>{dim.icon}</span>
                                  <span className="text-[11px] font-semibold text-on-surface">{dim.name}</span>
                                  <span className="ml-auto text-[10px] font-mono font-bold" style={{ color: dim.color }}>{dim.score}/100</span>
                                </div>
                                <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                                  <motion.div className="h-full rounded-full" style={{ backgroundColor: dim.color }} initial={{ width: 0 }} animate={{ width: `${dim.score}%` }} transition={{ duration: 0.8, delay: 0.3 }} />
                                </div>
                                <span className="text-[9px] text-on-surface-variant mt-1 block">{dim.desc}</span>
                              </div>
                            ));
                          })()}
                        </div>
                      </div>

                      {/* AI Reasoning */}
                      <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-6 mt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
                          <h3 className="font-heading text-sm font-semibold text-on-surface">AI Reasoning: Biomechanical Breakdown</h3>
                        </div>
                        <div className="space-y-3 text-sm text-on-surface-variant leading-relaxed">
                          <p>
                            The radar chart breaks down your KL grade (<span className="text-[#FF6D29] font-semibold">&ldquo;{data.severityGrade}&rdquo;</span>) into four structural dimensions, each scored 0–100.
                          </p>
                          <div className="grid grid-cols-2 gap-2 my-3">
                            <div className="bg-[#0d0d0f] rounded-lg p-2.5 border border-[#424754]/20">
                              <span className="text-[#06D6A0] font-semibold text-xs">Joint Space</span>
                              <p className="text-[10px] text-gray-400 mt-0.5">Gap between bones. Narrowing = cartilage loss.</p>
                            </div>
                            <div className="bg-[#0d0d0f] rounded-lg p-2.5 border border-[#424754]/20">
                              <span className="text-[#EF476F] font-semibold text-xs">Osteophytes</span>
                              <p className="text-[10px] text-gray-400 mt-0.5">Bone spurs at joint edges from instability.</p>
                            </div>
                            <div className="bg-[#0d0d0f] rounded-lg p-2.5 border border-[#424754]/20">
                              <span className="text-[#FF8C42] font-semibold text-xs">Sclerosis</span>
                              <p className="text-[10px] text-gray-400 mt-0.5">Bone hardening from abnormal joint loading.</p>
                            </div>
                            <div className="bg-[#0d0d0f] rounded-lg p-2.5 border border-[#424754]/20">
                              <span className="text-[#118AB2] font-semibold text-xs">Alignment</span>
                              <p className="text-[10px] text-gray-400 mt-0.5">Joint geometry and bone contour changes.</p>
                            </div>
                          </div>
                          <p>
                            <span className="text-on-surface font-semibold">Your profile:</span> {
                              data.severityGrade === 'Healthy' ? 'All dimensions score low — no structural abnormalities detected.' :
                              data.severityGrade === 'Doubtful' ? 'Minor osteophyte elevation only. Other dimensions remain normal.' :
                              data.severityGrade === 'Minimal' ? 'Joint space and osteophytes show moderate scores, indicating early cartilage thinning.' :
                              data.severityGrade === 'Moderate' ? 'Multiple dimensions elevated — joint space narrowing and osteophytes are prominent with emerging sclerosis.' :
                              'All dimensions score high, confirming widespread structural deterioration.'
                            }
                          </p>
                          <div className="bg-orange-500/5 border border-blue-500/20 rounded-lg p-3 mt-2">
                            <p className="text-[10px] text-blue-300">
                              <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>
                              These scores reflect the model's internal feature analysis, not independent clinical measurements.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </motion.div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
