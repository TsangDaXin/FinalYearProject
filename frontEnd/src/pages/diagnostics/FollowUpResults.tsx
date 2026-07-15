import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Paperclip, Link, Code, Mic, Send, Info } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface ScanData {
  originalImageUrl: string;
  gradCamUrl: string;
  severityGrade: string;
  topConfidence: number;
  confidenceDistribution: { grade: string; score: number }[];
}

export interface FollowUpResultsProps {
  previousData: ScanData;
  newData: ScanData;
  onBack: () => void;
  onConfirm?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
const GRADES = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
const GRADE_COLORS = ['#06D6A0', '#A7D129', '#FFD166', '#FF8C42', '#EF476F'];

function getGradeIndex(grade: string): number {
  return GRADES.findIndex((g) => g.toLowerCase() === grade.toLowerCase());
}

// ─── Component ─────────────────────────────────────────────────────────────────
export default function FollowUpResults({ previousData, newData, onBack, onConfirm }: FollowUpResultsProps) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: `I've compared your baseline and follow-up scans. Your previous grade was "${previousData.severityGrade}" (${previousData.topConfidence}% confidence) and your new grade is "${newData.severityGrade}" (${newData.topConfidence}% confidence). Feel free to ask me anything about your progression, treatment options, or next steps.`,
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [gradCamOpacity, setGradCamOpacity] = useState(0.7);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
          message: `[Follow-up context: Previous grade was ${previousData.severityGrade}, new grade is ${newData.severityGrade}] ${trimmed}`,
          severity_grade: newData.severityGrade,
          top_confidence: newData.topConfidence,
          history: [...messages, userMessage].slice(-6),
        }),
      });
      if (!response.ok) throw new Error('Failed');
      const result = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: result.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Progression analysis
  const prevIdx = getGradeIndex(previousData.severityGrade);
  const newIdx = getGradeIndex(newData.severityGrade);
  const diff = prevIdx - newIdx;
  const progressionStatus = diff > 0 ? 'improved' : diff === 0 ? 'stable' : 'progressed';
  const progressionColor = diff > 0 ? '#06D6A0' : diff === 0 ? '#FFD166' : '#EF476F';
  const progressionLabel = diff > 0 ? 'Improved' : diff === 0 ? 'Stable' : 'Progressed';

  return (
    <div className={`min-h-screen bg-[#0A0A0C] text-white px-4 md:px-8 py-8 overflow-y-auto ${onConfirm ? 'pb-32' : ''}`}>
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header with buttons */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Follow-Up Comparative Analysis</h1>
            <p className="text-sm text-gray-400 mt-1">12-Week Rehabilitation Progress Assessment</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => window.print()} className="px-4 py-2 rounded-lg bg-[#131315] border border-[#424754]/30 text-sm font-medium text-gray-200 hover:bg-[#1a1a1f] transition-colors flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">print</span>
              Print PDF
            </button>
            <button onClick={onBack} className="px-4 py-2 rounded-lg border border-[#424754]/30 text-sm text-gray-300 hover:bg-[#1a1a1f] transition-colors">
              ← Back
            </button>
          </div>
        </motion.div>

        {/* Progression Badge */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
          className="flex items-center justify-center gap-4 py-4 px-6 rounded-xl border"
          style={{ borderColor: progressionColor + '40', backgroundColor: progressionColor + '10' }}
        >
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: progressionColor }} />
          <span className="text-lg font-bold" style={{ color: progressionColor }}>{progressionLabel}</span>
          <span className="text-sm text-gray-400">
            {previousData.severityGrade} → {newData.severityGrade}
            {diff !== 0 && ` (${Math.abs(diff)} grade${Math.abs(diff) > 1 ? 's' : ''} ${diff > 0 ? 'better' : 'worse'})`}
          </span>
        </motion.div>

        {/* Side-by-Side Grad-CAM Comparison */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {/* Previous */}
          <div className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Previous (Baseline)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: GRADE_COLORS[prevIdx] + '20', color: GRADE_COLORS[prevIdx] }}>
                {previousData.severityGrade}
              </span>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-black/50 mb-3 relative z-10">
              <img src={previousData.gradCamUrl} alt="Previous Grad-CAM" className="w-full h-full object-contain" />
            </div>
            <div className="flex justify-between text-xs text-gray-400 relative z-10">
              <span>KL Grade {prevIdx}</span>
              <span>{previousData.topConfidence}% confidence</span>
            </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </div>

          {/* New */}
          <div className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-[#22c55e]/50 shadow-2xl rounded-xl p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-3 relative z-10">
              <span className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider">Follow-Up (Today)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: GRADE_COLORS[newIdx] + '20', color: GRADE_COLORS[newIdx] }}>
                {newData.severityGrade}
              </span>
            </div>
            <div className="aspect-square rounded-lg overflow-hidden bg-black/50 mb-3 relative z-10">
              <img src={newData.originalImageUrl} alt="X-Ray" className="w-full h-full object-contain absolute inset-0" />
              <img src={newData.gradCamUrl} alt="New Grad-CAM" className="w-full h-full object-contain absolute inset-0" style={{ opacity: gradCamOpacity }} />
            </div>
            {/* Grad-CAM slider */}
            <div className="flex items-center gap-2 mb-3 relative z-10">
              <span className="text-[9px] text-gray-500">X-Ray</span>
              <input type="range" min="0" max="100" value={gradCamOpacity * 100}
                onChange={(e) => setGradCamOpacity(Number(e.target.value) / 100)}
                className="flex-1 h-1 bg-zinc-700 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#FF6D29]"
              />
              <span className="text-[9px] text-gray-500">Heatmap</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 relative z-10">
              <span>KL Grade {newIdx}</span>
              <span>{newData.topConfidence}% confidence</span>
            </div>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
          </div>
        </motion.div>

        {/* AI Progression Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl overflow-hidden flex flex-col"
        >
          <div className="p-5 border-b border-[#424754]/30 bg-[#1a1a1f]/50 flex items-center gap-2">
            <span className="material-symbols-outlined text-green-400 text-[20px]">psychology</span>
            <h2 className="font-heading text-sm font-semibold text-white">AI Clinical Assessment <span className="text-xs text-gray-400 ml-2 font-normal">(AI Generated)</span></h2>
          </div>
          <div className="p-6 text-sm text-gray-300 leading-relaxed">
            {progressionStatus === 'improved' && (
              <p>Your follow-up scan shows <span className="text-[#06D6A0] font-bold">positive improvement</span> — grading decreased from <span className="text-white font-semibold">{previousData.severityGrade}</span> to <span className="text-[#06D6A0] font-semibold">{newData.severityGrade}</span> ({Math.abs(diff)} grade{Math.abs(diff) > 1 ? 's' : ''} better). This suggests your rehabilitation programme is having a measurable structural impact on your knee joint. The AI model detected reduced radiographic severity indicators. Continue your current protocol and discuss with your healthcare provider.</p>
            )}
            {progressionStatus === 'stable' && (
              <p>Your follow-up scan shows <span className="text-[#FFD166] font-bold">stable condition</span> — grading remains at <span className="text-white font-semibold">{newData.severityGrade}</span>. This is not uncommon at 12 weeks, as structural cartilage changes take time to manifest radiographically. The positive sign is that there is no progression. Continue your physiotherapy programme for continued stabilization and discuss next steps with your clinician.</p>
            )}
            {progressionStatus === 'progressed' && (
              <p>Your follow-up scan shows <span className="text-[#EF476F] font-bold">slight progression</span> — grading changed from <span className="text-white font-semibold">{previousData.severityGrade}</span> to <span className="text-[#EF476F] font-semibold">{newData.severityGrade}</span>. This does not necessarily indicate treatment failure — factors like imaging angle, positioning, weight-bearing status, and natural day-to-day variability can affect readings. Discuss with your healthcare provider for a comprehensive assessment and potential plan adjustment.</p>
            )}
          </div>
          {/* Floating Overlay */}
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none"
            style={{ 
              background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
            }}
          ></div>
        </motion.div>

        {/* Two-column: Distribution + Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          {/* Confidence Distribution Comparison */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
            className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 overflow-hidden flex flex-col"
          >
            <h3 className="text-sm font-semibold mb-3">Grade Distribution Comparison</h3>

            {/* Summary Header — Shows overall grade change */}
            {(() => {
              const prevIdx = getGradeIndex(previousData.severityGrade);
              const newIdx = getGradeIndex(newData.severityGrade);
              const diff = prevIdx - newIdx; // positive = improved (lower grade)
              const improved = diff > 0;
              const worsened = diff < 0;
              return (
                <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 border ${improved ? 'bg-[#06D6A0]/5 border-[#06D6A0]/20' : worsened ? 'bg-[#EF476F]/5 border-[#EF476F]/20' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 flex-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[prevIdx] }} />
                    <span className="text-xs font-semibold text-white">{previousData.severityGrade}</span>
                    <span className="material-symbols-outlined text-[16px] text-gray-500">arrow_forward</span>
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: GRADE_COLORS[newIdx] }} />
                    <span className="text-xs font-semibold text-white">{newData.severityGrade}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded ${improved ? 'bg-[#06D6A0]/20 text-[#06D6A0]' : worsened ? 'bg-[#EF476F]/20 text-[#EF476F]' : 'bg-white/10 text-gray-400'}`}>
                    {improved ? `↓ ${Math.abs(diff)} grade improvement` : worsened ? `↑ ${Math.abs(diff)} grade worsened` : 'No change'}
                  </span>
                </div>
              );
            })()}

            {/* Compact Grouped Bars */}
            <div className="space-y-2">
              {GRADES.map((grade, i) => {
                const prevScore = previousData.confidenceDistribution.find(d => d.grade === grade)?.score || 0;
                const newScore = newData.confidenceDistribution.find(d => d.grade === grade)?.score || 0;
                const change = newScore - prevScore;
                const isRelevant = Math.abs(change) > 1;
                const isPrevGrade = grade === previousData.severityGrade;
                const isNewGrade = grade === newData.severityGrade;

                return (
                  <div key={grade} className={`px-2.5 py-2 rounded-lg transition-all ${(isPrevGrade || isNewGrade) ? 'bg-[#0d0d0f] border border-[#424754]/30' : 'opacity-50'}`}>
                    {/* Grade label + change badge inline */}
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: GRADE_COLORS[i] }} />
                      <span className="text-[10px] font-medium text-white flex-1">{grade}</span>
                      {isPrevGrade && <span className="text-[7px] px-1 py-0.5 rounded bg-[#3B82F6]/20 text-[#3B82F6] font-semibold">BASELINE</span>}
                      {isNewGrade && <span className="text-[7px] px-1 py-0.5 rounded bg-[#FF6D29]/20 text-[#FF6D29] font-semibold">CURRENT</span>}
                      {isRelevant && (
                        <span className={`text-[8px] font-bold ${change < 0 ? 'text-[#06D6A0]' : 'text-[#EF476F]'}`}>
                          {change > 0 ? '+' : ''}{change.toFixed(1)}%
                        </span>
                      )}
                    </div>
                    {/* Two bars side by side */}
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 flex flex-col gap-1">
                        <div className="relative h-2 bg-[#1a1a1f] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${prevScore}%` }} transition={{ duration: 0.8, delay: i * 0.05 }} className="absolute inset-y-0 left-0 rounded-full bg-[#3B82F6]/70" />
                        </div>
                        <div className="relative h-2 bg-[#1a1a1f] rounded-full overflow-hidden">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${newScore}%` }} transition={{ duration: 0.8, delay: i * 0.05 + 0.1 }} className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: GRADE_COLORS[i] }} />
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 w-10">
                        <span className="text-[8px] text-gray-500 font-mono">{prevScore.toFixed(1)}%</span>
                        <span className="text-[8px] font-mono font-bold" style={{ color: GRADE_COLORS[i] }}>{newScore.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[#424754]/20 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded-sm bg-[#3B82F6]/70" />
                <span className="text-[10px] text-gray-500">Baseline Scan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-2 rounded-sm bg-[#FF6D29]" />
                <span className="text-[10px] text-gray-500">Follow-Up Scan</span>
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

        {/* SteadyGerak Assistant Chat */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="relative flex flex-col rounded-xl bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl overflow-hidden min-h-[500px]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-zinc-700/50">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-medium text-zinc-400">SteadyGerak Assistant</span>
            </div>
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
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              rows={2}
              className="w-full px-4 py-3 bg-transparent border-none outline-none resize-none text-sm text-zinc-100 placeholder-zinc-500 scrollbar-none"
              placeholder="Ask about your progression..."
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
                  <div className="flex items-center gap-1.5 p-1 bg-zinc-800/40 rounded-xl border border-zinc-700/50">
                    <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 hover:scale-105 hover:-rotate-3 transform">
                      <Paperclip className="w-3.5 h-3.5" />
                    </button>
                    <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-105 hover:rotate-6 transform">
                      <Link className="w-3.5 h-3.5" />
                    </button>
                    <button className="group relative p-2 bg-transparent border-none rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-green-400 hover:bg-zinc-800/80 hover:scale-105 hover:rotate-3 transform">
                      <Code className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button className="group relative p-2 bg-transparent border border-zinc-700/30 rounded-lg cursor-pointer transition-all duration-300 text-zinc-500 hover:text-[#FF6D29] hover:bg-zinc-800/80 hover:scale-110 hover:rotate-2 transform hover:border-[#FF6D29]/30">
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-medium text-zinc-500 hidden sm:block">
                    <span>{chatInput.length}</span>/<span className="text-zinc-400">2000</span>
                  </div>
                  <button 
                    onClick={sendMessage}
                    disabled={isLoading || !chatInput.trim()}
                    className="group relative p-2.5 bg-gradient-to-r from-[#FF6D29] to-[#DF5412] border-none rounded-xl cursor-pointer transition-all duration-300 text-white shadow-lg hover:from-[#FF8D59] hover:to-[#FF6D29] hover:scale-110 hover:shadow-[#FF6D29]/30 hover:shadow-xl active:scale-95 transform hover:-rotate-2 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:rotate-0"
                    style={{ boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 0 rgba(255, 109, 41, 0.4)' }}
                  >
                    <Send className="w-4 h-4 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:rotate-12 group-hover:scale-110" />
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
        </div>

        {/* Disclaimer */}
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
          <p className="text-[11px] text-blue-300 leading-relaxed">
            <span className="material-symbols-outlined text-[12px] align-middle mr-1">info</span>
            <strong>Important:</strong> This comparative analysis is AI-generated based on radiographic features only. It does not account for clinical symptoms, physical examination, or patient history. Always discuss results with your healthcare provider for a comprehensive evaluation and treatment planning.
          </p>
        </div>

      </div>

      {/* Fixed Footer for Confirm Result */}
      {onConfirm && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0A0A0C]/90 backdrop-blur-md border-t border-[#FF6D29]/20 p-4 md:p-6 flex justify-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
          <div className="max-w-6xl w-full flex justify-between items-center px-4">
            <div className="text-sm text-gray-400 hidden md:flex items-center">
              <span className="material-symbols-outlined text-[18px] text-[#FF6D29] mr-2">info</span>
              Review the comparative analysis carefully before finalizing.
            </div>
            <button 
              onClick={onConfirm} 
              className="w-full md:w-auto px-10 py-3.5 rounded-xl bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#FF6D29] text-base font-bold text-white transition-all shadow-[0_0_20px_rgba(255,109,41,0.4)] hover:shadow-[0_0_30px_rgba(255,109,41,0.6)] flex items-center justify-center gap-3 transform hover:-translate-y-1"
            >
              <span className="material-symbols-outlined text-[20px]">task_alt</span>
              Confirm Result
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
