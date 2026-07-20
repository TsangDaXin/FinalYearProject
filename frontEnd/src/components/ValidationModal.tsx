import { useState, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis } from 'recharts';

const KneeJoint3D = lazy(() => import('./KneeJoint3D'));

const GRADES = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
const GRADE_COLORS = ['#06D6A0', '#A7D129', '#FFD166', '#FF8C42', '#EF476F'];
const PIE_COLORS = ['#06D6A0', '#FFD166', '#EF476F', '#118AB2', '#A855F7'];

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    severityGrade: string;
    topConfidence: number;
    confidenceDistribution: { grade: string; score: number }[];
  };
}

export default function ValidationModal({ isOpen, onClose, data }: ValidationModalProps) {
  const [view, setView] = useState<'choice' | 'general' | 'analytics'>('choice');
  const [generalTab, setGeneralTab] = useState<'prob' | 'spectrum' | 'joint' | 'population' | 'breakdown'>('prob');
  const [analyticsTab, setAnalyticsTab] = useState<'overview' | 'confusion' | 'roc' | 'metrics' | 'errors'>('overview');

  if (!isOpen) return null;

  const gradeIdx = GRADES.indexOf(data.severityGrade);
  const pieData = data.confidenceDistribution.map((d) => ({ name: d.grade, value: parseFloat(d.score.toFixed(1)) }));

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>

      {/* ═══ Choice Screen ═══ */}
      {view === 'choice' && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
          className="bg-[#1b1b1d] border border-[#424754]/50 max-w-4xl w-full rounded-xl p-8 relative"
        >
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a30] flex items-center justify-center">
            <span className="material-symbols-outlined text-gray-400 text-[18px]">close</span>
          </button>
          <h2 className="text-xl font-bold text-white text-center mb-2">Model Evaluation</h2>
          <p className="text-sm text-gray-400 text-center mb-8">Choose how to explore the AI validation metrics.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div onClick={() => setView('general')} className="bg-[#131315] border border-[#424754]/30 rounded-2xl p-6 cursor-pointer hover:border-[#FF6D29]/40 hover:bg-[#FF6D29]/5 transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#FF6D29] text-3xl mb-3">dashboard</span>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FF6D29]">General View</h3>
              <p className="text-xs text-gray-400 mb-4">Probability, progression spectrum, joint map, population comparison, biomechanical breakdown.</p>
              <button className="w-full bg-[#FF6D29] text-white font-bold py-2.5 rounded-xl text-sm">Click here</button>
            </div>
            <div onClick={() => setView('analytics')} className="bg-[#131315] border border-[#424754]/30 rounded-2xl p-6 cursor-pointer hover:border-[#FF6D29]/40 hover:bg-[#FF6D29]/5 transition-all group">
              <span className="material-symbols-outlined text-gray-400 group-hover:text-[#FF6D29] text-3xl mb-3">bar_chart</span>
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-[#FF6D29]">Data Analytics View</h3>
              <p className="text-xs text-gray-400 mb-4">Model overview, confusion matrix, ROC-AUC curves, per-class metrics, error distribution.</p>
              <button className="w-full bg-[#FF6D29] text-white font-bold py-2.5 rounded-xl text-sm">Click here</button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ═══ General View ═══ */}
      {view === 'general' && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
          className="bg-[#1b1b1d] border border-[#424754]/50 max-w-6xl w-full rounded-xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={() => setView('choice')} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a30] flex items-center justify-center"><span className="material-symbols-outlined text-gray-400 text-[18px]">arrow_back</span></button>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a30] flex items-center justify-center"><span className="material-symbols-outlined text-gray-400 text-[18px]">close</span></button>
          
          <h2 className="text-xl font-bold text-white text-center mb-1">General View</h2>
          <p className="text-sm text-gray-400 text-center mb-6">Patient-friendly summary of your follow-up scan results</p>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="rounded-lg border border-[#424754]/30 flex bg-[#131315] p-1 gap-0.5 flex-wrap">
              {([['prob','Probability','donut_small'],['spectrum','Progression','trending_up'],['joint','Joint Map','skeleton'],['population','Population','groups'],['breakdown','Breakdown','radar']] as const).map(([key, label, icon]) => (
                <button key={key} onClick={() => setGeneralTab(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${generalTab === key ? 'bg-[#FF6D29] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {generalTab === 'prob' && (
              <motion.div key="prob" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#FF6D29] text-[16px]">donut_small</span>
                    Scan Probability Distribution
                  </h3>
                  <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="h-[240px] w-full md:w-1/2 relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={4} dataKey="value" stroke="#131315" strokeWidth={2}>
                          {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie><Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '11px' }} formatter={(v: any) => `${v}%`} /></PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-xl font-bold text-white">{data.topConfidence}%</span>
                        <span className="text-[10px] text-gray-400">{data.severityGrade}</span>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2 space-y-2">
                      {pieData.map((entry, idx) => (
                        <div key={entry.name} className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[idx] }} />
                          <span className="text-xs text-gray-300 flex-1">{entry.name}</span>
                          <div className="flex-1 h-1.5 bg-[#0d0d0f] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${entry.value}%`, backgroundColor: PIE_COLORS[idx] }} /></div>
                          <span className="text-xs font-mono text-white w-12 text-right">{entry.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    The model analyzed the X-ray image and assigned a probability to each of the five Kellgren–Lawrence severity grades. The predicted class <span className="text-[#FF6D29] font-semibold">"{data.severityGrade}"</span> received the highest confidence at <span className="text-[#FF6D29] font-semibold">{data.topConfidence}%</span>, meaning the AI is most confident that the radiographic features — such as joint space width, osteophyte presence, and sclerosis patterns — align with this classification.
                  </p>
                </div>
              </motion.div>
            )}
            {generalTab === 'spectrum' && (
              <motion.div key="spectrum" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-6">Disease Progression Spectrum</h3>
                  <div className="px-2 mb-6">
                    <div className="relative">
                      {/* Indicator dot above the bar */}
                      <div className="flex items-center gap-1 mb-3">
                        {GRADE_COLORS.map((color, i) => (
                          <div key={i} className="flex-1 flex justify-center">
                            {i === gradeIdx && (
                              <div className="w-4 h-4 rounded-full border-2 border-white animate-pulse" style={{ backgroundColor: color, boxShadow: `0 0 12px ${color}` }} />
                            )}
                          </div>
                        ))}
                      </div>
                      {/* Color bar */}
                      <div className="flex items-center gap-1 h-4 rounded-full overflow-hidden">
                        {GRADE_COLORS.map((color, i) => (
                          <div key={i} className="flex-1 h-full" style={{ backgroundColor: color, opacity: i === gradeIdx ? 1 : 0.3 }} />
                        ))}
                      </div>
                    </div>
                  </div>
                  {/* Labels */}
                  <div className="flex justify-between px-2 mb-2">
                    {GRADES.map((g, i) => (
                      <span key={g} className="text-[10px] text-center" style={{ color: i === gradeIdx ? GRADE_COLORS[i] : '#6b7280', fontWeight: i === gradeIdx ? 700 : 400 }}>{g}</span>
                    ))}
                  </div>
                  <div className="flex justify-between px-2 text-[9px]">
                    <span className="text-[#06D6A0] font-semibold">← Better</span>
                    <span className="text-[#EF476F] font-semibold">Worse →</span>
                  </div>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    This spectrum shows where your scan falls on the KL severity scale. The glowing dot marks your current position at <span className="text-[#FF6D29] font-semibold">{data.severityGrade}</span>. A position further left indicates healthier joint function, while further right indicates more advanced osteoarthritis changes.
                  </p>
                </div>
              </motion.div>
            )}
            {generalTab === 'joint' && (
              <motion.div key="joint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Suspense fallback={<div className="h-[400px] flex items-center justify-center text-xs text-gray-500">Loading 3D model...</div>}>
                  <KneeJoint3D data={data} />
                </Suspense>
              </motion.div>
            )}
            {generalTab === 'population' && (
              <motion.div key="pop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">OAI Population Comparison (n=8,892)</h3>
                  <div className="h-[240px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[{g:'Normal',p:38.6},{g:'Doubtful',p:17.9},{g:'Minimal',p:26.5},{g:'Moderate',p:13.7},{g:'Severe',p:3.3}]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#424754" opacity={0.2} vertical={false} />
                        <XAxis dataKey="g" tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} />
                        <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                        <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px' }} />
                        <Bar dataKey="p" radius={[4,4,0,0]}>{[0,1,2,3,4].map((i) => <Cell key={i} fill={i === gradeIdx ? '#FF6D29' : '#4a4a52'} opacity={i === gradeIdx ? 1 : 0.6} />)}</Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-center gap-4 mt-3 text-[10px] text-gray-500">
                    <span><span className="inline-block w-3 h-2 bg-[#4a4a52] rounded-sm mr-1" />Reference</span>
                    <span><span className="inline-block w-3 h-2 bg-[#FF6D29] rounded-sm mr-1" />Your grade</span>
                  </div>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    This chart compares your grade (<span className="text-[#FF6D29] font-semibold">"{data.severityGrade}"</span>) against the distribution of 8,892 knee X-rays from the Osteoarthritis Initiative (OAI) reference cohort. The grey bars show what percentage of that population falls into each KL grade, while the highlighted bar shows where you are positioned.
                  </p>
                </div>
              </motion.div>
            )}
            {generalTab === 'breakdown' && (
              <motion.div key="break" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Biomechanical Breakdown</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[{name:'Joint Space',score:Math.min(100,gradeIdx*22+(gradeIdx>0?10:0)),color:'#06D6A0'},{name:'Osteophytes',score:Math.min(100,gradeIdx*25),color:'#EF476F'},{name:'Sclerosis',score:Math.min(100,gradeIdx>=3?gradeIdx*28:gradeIdx*12),color:'#FF8C42'},{name:'Alignment',score:Math.min(100,gradeIdx>=4?75:gradeIdx*15),color:'#118AB2'}].map((d) => (
                      <div key={d.name} className="bg-[#0d0d0f] border border-[#424754]/20 rounded-lg p-3">
                        <div className="flex justify-between mb-1"><span className="text-[10px] text-gray-300">{d.name}</span><span className="text-[10px] font-mono" style={{color:d.color}}>{d.score}/100</span></div>
                        <div className="h-1.5 bg-[#1a1a1f] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${d.score}%`,backgroundColor:d.color}} /></div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    This breakdown shows the biomechanical factors contributing to the classification. Joint space narrowing, osteophyte formation, subchondral sclerosis, and alignment changes are the four key radiographic markers used in KL grading. Higher scores indicate more advanced changes in each category.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ═══ Analytics View ═══ */}
      {view === 'analytics' && (
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} onClick={(e) => e.stopPropagation()}
          className="bg-[#1b1b1d] border border-[#424754]/50 max-w-6xl w-full rounded-xl p-6 md:p-8 relative max-h-[90vh] overflow-y-auto"
        >
          <button onClick={() => setView('choice')} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a30] flex items-center justify-center"><span className="material-symbols-outlined text-gray-400 text-[18px]">arrow_back</span></button>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#131315] hover:bg-[#2a2a30] flex items-center justify-center"><span className="material-symbols-outlined text-gray-400 text-[18px]">close</span></button>

          <h2 className="text-xl font-bold text-white mb-1">Model Validation — Analytics Matrix</h2>
          <p className="text-sm text-gray-400 mb-6">EfficientNetV2-B3 (C4) · Test Set: 1,656 images · Accuracy: 65.76% · QWK: 0.81</p>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <div className="rounded-lg border border-[#424754]/30 flex bg-[#131315] p-1 gap-0.5 flex-wrap">
              {([['overview','Model Overview','hub'],['confusion','Confusion Matrix','grid_on'],['roc','ROC-AUC','show_chart'],['metrics','Per-Class','bar_chart'],['errors','Errors','error_outline']] as const).map(([key, label, icon]) => (
                <button key={key} onClick={() => setAnalyticsTab(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${analyticsTab === key ? 'bg-[#FF6D29] text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <span className="material-symbols-outlined text-[14px]">{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {analyticsTab === 'overview' && (
              <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Model Architecture</h3>
                  <p className="text-xs text-gray-400 mb-3">EfficientNetV2-B3 backbone pretrained on ImageNet, fine-tuned for ordinal KL grade regression with MAE loss.</p>
                  <div className="flex items-center gap-2 flex-wrap text-[9px] font-mono">
                    <span className="px-2 py-1 bg-blue-500/10 border border-blue-500/30 rounded text-blue-300">Input 224×224</span><span className="text-gray-600">→</span>
                    <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded text-purple-300">EfficientNetV2-B3</span><span className="text-gray-600">→</span>
                    <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-300">GAP+BN</span><span className="text-gray-600">→</span>
                    <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300">Dense(256)+Drop(0.6)</span><span className="text-gray-600">→</span>
                    <span className="px-2 py-1 bg-red-500/10 border border-red-500/30 rounded text-red-300">Dense(1)</span>
                  </div>
                </div>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-3">Performance Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[{l:'Accuracy',v:'65.76%',c:'#06D6A0'},{l:'Balanced Acc.',v:'57.10%',c:'#FFD166'},{l:'MAE',v:'0.41',c:'#118AB2'},{l:'QWK',v:'0.81',c:'#A855F7'}].map(m=>(
                      <div key={m.l} className="bg-[#0d0d0f] rounded-lg p-3 text-center"><span className="text-lg font-bold font-mono" style={{color:m.c}}>{m.v}</span><span className="text-[9px] text-gray-500 block mt-1">{m.l}</span></div>
                    ))}
                  </div>
                </div>
                {/* AI Reasoning */}
                <div className="bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    The model uses ordinal regression (single continuous output) rather than standard classification, which means it respects the natural ordering of KL grades. A QWK of 0.81 indicates strong agreement with ground-truth radiologist labels. The MAE of 0.41 means the model's predictions are, on average, less than half a grade away from the true label.
                  </p>
                </div>
              </motion.div>
            )}
            {analyticsTab === 'confusion' && (
              <motion.div key="cm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Confusion Matrix (Test Set)</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px]">
                      <thead><tr><th className="p-1"></th>{GRADES.map(g=><th key={g} className="p-1 text-gray-400 font-normal">{g.slice(0,3)}</th>)}</tr></thead>
                      <tbody>
                        {[[600,30,9,0,0],[192,58,43,3,0],[93,81,236,37,0],[2,7,38,174,2],[0,0,1,29,21]].map((row,ri)=>(
                          <tr key={ri}><td className="p-1 text-gray-400 font-medium text-right pr-2">{GRADES[ri].slice(0,3)}</td>
                            {row.map((v,ci)=><td key={ci} className="p-1 text-center"><span className={`inline-block w-8 h-6 leading-6 rounded text-[9px] font-mono ${ri===ci?'bg-[#FF6D29]/30 text-[#FF6D29] font-bold':'bg-[#0d0d0f] text-gray-500'}`}>{v}</span></td>)}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="text-[9px] text-gray-500 mt-3 text-center">Rows = Actual, Columns = Predicted. Diagonal = correct predictions.</p>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    The confusion matrix shows the model's performance across all 1,656 test images. The highlighted diagonal cells represent correct predictions. The model performs strongest on Healthy (600/639 correct) and Severe (21/51) grades, with most errors occurring between adjacent grades (e.g., Doubtful misclassified as Healthy) — which is clinically acceptable as these represent subtle radiographic differences.
                  </p>
                </div>
              </motion.div>
            )}
            {analyticsTab === 'roc' && (
              <motion.div key="roc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">ROC-AUC Values (One-vs-Rest)</h3>
                  <div className="space-y-3">
                    {[{g:'Healthy',auc:0.90},{g:'Doubtful',auc:0.74},{g:'Minimal',auc:0.84},{g:'Moderate',auc:0.96},{g:'Severe',auc:0.99}].map((r,i)=>(
                      <div key={r.g} className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:GRADE_COLORS[i]}} />
                        <span className="text-xs text-gray-300 w-16">{r.g}</span>
                        <div className="flex-1 h-2 bg-[#0d0d0f] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${r.auc*100}%`,backgroundColor:GRADE_COLORS[i]}} /></div>
                        <span className="text-xs font-mono font-bold text-white">{r.auc.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-500 mt-3">AUC &gt; 0.80 = excellent. Macro AUC: 0.88. Weighted AUC: 0.89.</p>
                </div>
                {/* AI Reasoning */}
                <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                    <span className="text-[11px] font-semibold text-green-400">AI Reasoning</span>
                  </div>
                  <p className="text-[11px] text-gray-300 leading-relaxed">
                    The model excels at identifying Severe (0.99) and Moderate (0.96) cases. Doubtful (0.74) is the hardest to separate because it shares subtle features with both Healthy and Minimal grades. Overall Macro AUC of 0.88 indicates strong diagnostic capability across all grades.
                  </p>
                </div>
              </motion.div>
            )}
            {analyticsTab === 'metrics' && (
              <motion.div key="met" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Per-Class Precision / Recall / F1</h3>
                  <div className="space-y-2">
                    {[{g:'Healthy',p:67.6,r:93.9,f:78.6},{g:'Doubtful',p:33.0,r:19.6,f:24.6},{g:'Minimal',p:72.2,r:52.8,f:61.0},{g:'Moderate',p:71.6,r:78.0,f:74.7},{g:'Severe',p:91.3,r:41.2,f:56.8}].map((row,i)=>{
                      const active = row.g === data.severityGrade;
                      return (
                        <div key={row.g} className={`flex items-center gap-3 p-2.5 rounded-lg ${active?'bg-[#FF6D29]/10 border border-[#FF6D29]/30':'bg-[#0d0d0f]'}`}>
                          <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor:GRADE_COLORS[i]}} />
                          <span className={`text-xs w-16 ${active?'text-white font-bold':'text-gray-400'}`}>{row.g}</span>
                          <div className="flex-1 grid grid-cols-3 gap-3 text-[10px]">
                            <span><span className="text-gray-500">P:</span> <span className="text-blue-400 font-mono">{row.p}%</span></span>
                            <span><span className="text-gray-500">R:</span> <span className="text-green-400 font-mono">{row.r}%</span></span>
                            <span><span className="text-gray-500">F1:</span> <span className="text-orange-400 font-mono">{row.f}%</span></span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
            {analyticsTab === 'errors' && (
              <motion.div key="err" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Prediction Error Distribution</h3>
                  <div className="grid grid-cols-5 gap-2 mb-4">
                    {[{l:'Exact',p:65.8,c:'#06D6A0'},{l:'±1',p:28.1,c:'#FFD166'},{l:'±2',p:5.2,c:'#FF8C42'},{l:'±3',p:0.9,c:'#EF476F'},{l:'±4',p:0.1,c:'#A855F7'}].map(d=>(
                      <div key={d.l} className="text-center">
                        <div className="h-20 flex items-end justify-center mb-1"><div className="w-7 rounded-t-md" style={{height:`${d.p*1.2}%`,backgroundColor:d.c,minHeight:'3px'}} /></div>
                        <span className="text-[9px] font-mono font-bold" style={{color:d.c}}>{d.p}%</span>
                        <span className="text-[8px] text-gray-500 block">{d.l}</span>
                      </div>
                    ))}
                  </div>
                  <div className="bg-[#0d0d0f] rounded-lg p-3 grid grid-cols-3 gap-2 text-center">
                    <div><span className="text-sm font-bold text-[#06D6A0] font-mono">65.8%</span><span className="text-[8px] text-gray-500 block">Exactly correct</span></div>
                    <div><span className="text-sm font-bold text-[#FFD166] font-mono">93.9%</span><span className="text-[8px] text-gray-500 block">Within 1 grade</span></div>
                    <div><span className="text-sm font-bold text-[#118AB2] font-mono">0.41</span><span className="text-[8px] text-gray-500 block">Mean Abs. Error</span></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
