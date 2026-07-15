import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoadmapPageProps {
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile') => void;
  severityGrade?: string;
  userName?: string;
}

const MILESTONES = [
  {
    phase: 'Month 1',
    pillColor: 'bg-[#3B82F6]',
    title: 'Baseline Unloading & Inflammation Control',
    bullets: [
      'Switch to zero-impact aquatic therapy.',
      'Reduce daily step count by 15% to limit friction.',
      'Begin daily seated isometric quad contractions.',
    ],
  },
  {
    phase: 'Month 3',
    pillColor: 'bg-[#3B82F6]',
    title: 'Targeted Muscle Hypertrophy',
    bullets: [
      'Re-evaluate pain scale (Target: < 4/10).',
      'Introduce light resistance band therapy.',
      '5% body mass reduction target achieved.',
    ],
  },
  {
    phase: 'Month 6',
    pillColor: 'bg-[#8B5CF6]',
    title: 'Follow-Up Grad-CAM Assessment',
    bullets: [
      'Schedule new radiograph scan.',
      'System will run comparative Grad-CAM analysis to verify halted joint space narrowing.',
      'Orthopaedic surgical consultation triage (if necessary).',
    ],
  },
  {
    phase: 'Month 9',
    pillColor: 'bg-[#8B5CF6]',
    title: 'Progressive Load Reintroduction',
    bullets: [
      'Gradual return to low-impact weight-bearing activities.',
      'Biometric re-evaluation of quadriceps strength index.',
      'AI-adjusted exercise intensity based on 6-month trajectory data.',
    ],
  },
  {
    phase: 'Month 12',
    pillColor: 'bg-[#8B5CF6]',
    title: 'Annual Comprehensive Review',
    bullets: [
      'Full radiographic comparison with baseline scan.',
      'Long-term cartilage preservation assessment via Grad-CAM overlay.',
      'Clinical decision: maintain protocol or escalate to specialist referral.',
    ],
  },
];

export default function RoadmapPage({ onNavigate, severityGrade = 'Severe', userName = 'Mr. Owen' }: RoadmapPageProps) {
  const klNum = { Healthy: 0, Doubtful: 1, Minimal: 2, Moderate: 3, Severe: 4 }[severityGrade] ?? 4;

  // Chatbot state
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Hi ${userName}! I can answer questions about your recovery roadmap. Ask me about any phase, timeline, or exercise recommendations.` },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, chatLoading]);

  const sendChatMessage = async () => {
    const trimmed = chatInput.trim();
    if (!trimmed || chatLoading) return;
    const userMsg = { role: 'user' as const, content: trimmed };
    setChatMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Roadmap Context: Patient ${userName}, KL Grade ${klNum} (${severityGrade}). Recovery phases: Month 1 - Baseline Unloading, Month 3 - Muscle Hypertrophy, Month 6 - Grad-CAM Follow-up, Month 9 - Load Reintroduction, Month 12 - Annual Review] Question: ${trimmed}`,
          severity_grade: severityGrade,
          top_confidence: null,
          history: [...chatMessages, userMsg].slice(-6),
        }),
      });
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch {
      setChatMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
  };

  return (
    <div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#3B82F6] selection:text-white">
      {/* Top Bar */}
      <header className="flex justify-between items-center w-full px-6 md:px-10 h-16 sticky top-0 z-40 glass-nav">
        <div className="flex items-center gap-4">
          <span className="md:hidden material-symbols-outlined text-[#FF6D29] cursor-pointer">menu</span>
          <button
            onClick={() => onNavigate('action_dashboard')}
            className="hidden md:flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Back to Dashboard
          </button>
        </div>
        <div className="flex items-center gap-5">
          <span className="text-xs text-gray-500 font-semibold uppercase tracking-widest hidden md:block">Orionix AI</span>
          <button className="text-gray-400 hover:text-white transition-colors relative">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div className="h-8 w-[1px] bg-white/10 mx-2"></div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-300">{userName}</span>
            <div className="w-8 h-8 rounded-full bg-gray-700 border border-white/20 flex items-center justify-center text-xs font-bold">{(userName || 'U').charAt(0).toUpperCase()}</div>
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="font-['Plus_Jakarta_Sans'] text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            The Roadmap
          </h1>
          <p className="font-['Inter'] text-sm md:text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Generated by Orionix AI: Customizing a zero-impact cartilage preservation timeline for{' '}
            <span className="text-white font-semibold">{userName}</span>, prioritizing joint unloading to counteract{' '}
            <span className="text-[#3B82F6] font-semibold">Grade {klNum}</span> mechanical stress.
          </p>
        </motion.div>

        {/* Timeline Container */}
        <div className="relative">
          {/* Central Axis Line */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[2px] bg-[#424754]/50 hidden md:block"></div>

          {/* Milestones */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-12 md:space-y-16"
          >
            {MILESTONES.map((milestone, idx) => {
              const isLeft = idx % 2 === 0;

              return (
                <motion.div
                  key={milestone.phase}
                  variants={itemVariants}
                  className="relative"
                >
                  {/* Mobile Layout (stacked) */}
                  <div className="md:hidden">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`${milestone.pillColor} text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg`}>
                        {milestone.phase}
                      </span>
                    </div>
                    <div className="bg-[#1b1b1d] rounded-xl p-6 border border-[#424754]/30 hover:bg-[#202124] transition-colors">
                      <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white mb-3">{milestone.title}</h3>
                      <ul className="space-y-2">
                        {milestone.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="flex items-start gap-2 font-['Inter'] text-sm text-gray-400 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]/60 mt-2 shrink-0"></span>
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Desktop Layout (alternating) */}
                  <div className="hidden md:flex items-center">
                    {/* Left Card */}
                    {isLeft ? (
                      <div className="w-[45%] pr-8 text-right">
                        <div className="bg-[#1b1b1d] rounded-xl p-6 border border-[#424754]/30 hover:bg-[#202124] transition-colors inline-block text-left w-full">
                          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white mb-3">{milestone.title}</h3>
                          <ul className="space-y-2">
                            {milestone.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2 font-['Inter'] text-sm text-gray-400 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]/60 mt-2 shrink-0"></span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="w-[45%]"></div>
                    )}

                    {/* Center Node (Pill) */}
                    <div className="w-[10%] flex justify-center relative z-10">
                      <span className={`${milestone.pillColor} text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg whitespace-nowrap`}>
                        {milestone.phase}
                      </span>
                    </div>

                    {/* Right Card */}
                    {!isLeft ? (
                      <div className="w-[45%] pl-8 text-left">
                        <div className="bg-[#1b1b1d] rounded-xl p-6 border border-[#424754]/30 hover:bg-[#202124] transition-colors w-full">
                          <h3 className="font-['Plus_Jakarta_Sans'] text-base font-bold text-white mb-3">{milestone.title}</h3>
                          <ul className="space-y-2">
                            {milestone.bullets.map((bullet, bIdx) => (
                              <li key={bIdx} className="flex items-start gap-2 font-['Inter'] text-sm text-gray-400 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]/60 mt-2 shrink-0"></span>
                                {bullet}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ) : (
                      <div className="w-[45%]"></div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center mt-16 pb-8"
        >
          <p className="text-xs text-gray-500 italic mb-4">
            This roadmap is AI-generated and will adapt based on your progress data and follow-up scans.
          </p>
          <button
            onClick={() => onNavigate('action_dashboard')}
            className="px-6 py-3 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] text-white font-bold text-sm transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
          >
            Return to Dashboard
          </button>
        </motion.div>
      </main>

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="absolute bottom-16 right-0 w-80 h-[420px] bg-[#1b1b1d] border border-[#424754]/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Chat Header */}
              <div className="p-4 border-b border-[#424754]/30 bg-[#3B82F6]/5 flex items-center gap-3 shrink-0">
                <div className="w-7 h-7 rounded-full bg-[#3B82F6] flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[14px]">smart_toy</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-white">Roadmap Assistant</h3>
                  <p className="text-[10px] text-green-400">Online</p>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center shrink-0 mt-1">
                        <span className="material-symbols-outlined text-[#3B82F6] text-[12px]">smart_toy</span>
                      </div>
                    )}
                    <div className={`max-w-[75%] p-2.5 rounded-xl text-xs whitespace-pre-wrap ${msg.role === 'user' ? 'bg-[#3B82F6]/20 text-white rounded-tr-sm' : 'bg-white/5 text-gray-300 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#3B82F6]/20 flex items-center justify-center shrink-0 mt-1">
                      <span className="material-symbols-outlined text-[#3B82F6] text-[12px]">smart_toy</span>
                    </div>
                    <div className="bg-white/5 p-2.5 rounded-xl rounded-tl-sm">
                      <span className="inline-flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-[#424754]/30 shrink-0">
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); sendChatMessage(); } }}
                    placeholder="Ask about your roadmap..."
                    disabled={chatLoading}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-2 pl-4 pr-9 text-xs text-white focus:outline-none focus:border-[#3B82F6]/50 transition-colors disabled:opacity-50 placeholder-gray-500"
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="absolute right-1.5 top-1.5 w-6 h-6 rounded-full bg-[#3B82F6] hover:bg-[#2563EB] text-white flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-[12px]">send</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB Button */}
        <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${isChatOpen ? 'bg-gray-700 hover:bg-gray-600' : 'bg-[#3B82F6] hover:bg-[#2563EB] shadow-[0_0_25px_rgba(59,130,246,0.4)]'}`}
        >
          <span className="material-symbols-outlined text-white text-[24px]">
            {isChatOpen ? 'close' : 'chat'}
          </span>
        </button>
      </div>
    </div>
  );
}
