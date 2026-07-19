import React from 'react';
import { motion } from 'framer-motion';
import { RadialGlowBackground } from '../../components/ui/radial-glow-background';
import WeeklyCheckInModal from '../../components/WeeklyCheckInModal';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface MasteryPageProps {
  userStreak?: number;
  severityGrade?: string;
  onboardingDate?: string | null;
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile' | 'diagnostics') => void;
  userName?: string;
  userId?: string | null;
}

export default function MasteryPage({ userStreak = 0, onboardingDate, onNavigate, userName = 'Guest', userId = null }: MasteryPageProps) {
  // Time filter state
  const [timeFilter, setTimeFilter] = React.useState<'weekly' | '3-week' | 'monthly'>('weekly');
  // Cycle selector for multi-scan progression
  const [selectedCycle, setSelectedCycle] = React.useState<number>(0); // 0 = latest

  // ── Real-time chart data from database ─────────────────────────────────────
  const [rawChartData, setRawChartData] = React.useState<{ week: number; mobility: number | null; pain: number | null; stiffness: number | null; notes: string | null }[]>([]);
  const [_isLoadingChart, setIsLoadingChart] = React.useState(false);
  const [showHistory, setShowHistory] = React.useState(false);
  const [historyCycle, setHistoryCycle] = React.useState(0);
  const [showCheckinReminder, setShowCheckinReminder] = React.useState(false);
  const [showCheckinModal, setShowCheckinModal] = React.useState(false);

  React.useEffect(() => {
    if (!userId) return;
    setIsLoadingChart(true);
    fetch(`http://localhost:8000/api/progress/chart/combined/${userId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.weeks) {
          const merged = data.weeks.map((w: number, i: number) => ({
            week: w,
            mobility: data.mobility?.[i] ?? null,
            pain: data.pain?.[i] ?? null,
            stiffness: data.stiffness?.[i] ?? null,
            notes: data.notes?.[i] ?? null,
          }));
          setRawChartData(merged);
        }
      })
      .catch(err => console.error('Chart fetch error:', err))
      .finally(() => setIsLoadingChart(false));

    // Check if weekly check-in is missing for current week
    const checkMissingCheckin = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;

        const now = new Date();
        const onboard = onboardingDate ? new Date(onboardingDate) : now;
        const diffDays = Math.floor((now.getTime() - onboard.getTime()) / (1000 * 60 * 60 * 24));
        const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);

        const { data: existing } = await supabase
          .from('weekly_checkins')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('check_in_week_number', currentWeek)
          .maybeSingle();

        if (!existing) setShowCheckinReminder(true);
      } catch {}
    };
    checkMissingCheckin();
  }, [userId, onboardingDate]);

  // Calculate days since onboarding
  const daysSinceOnboarding = (() => {
    if (!onboardingDate) return 1;
    const start = new Date(onboardingDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  })();

  // Calculate total number of 12-week cycles the user has been through
  const weeksSinceOnboarding = Math.max(1, Math.floor(daysSinceOnboarding / 7));
  const totalCycles = Math.max(1, Math.ceil(weeksSinceOnboarding / 12));

  // Latest week with actual data from database (fallback to time-based if no data)
  const latestDataWeek = rawChartData.length > 0
    ? Math.max(...rawChartData.map(d => d.week))
    : weeksSinceOnboarding;

  // Generate dynamic subtitle for mastery page
  const getMasteryDescription = () => {
    if (latestDataWeek <= 1) return { prefix: "Week 1:", text: "Baseline established.", suffix: "Your data will populate here as you complete weekly check-ins." };
    if (latestDataWeek <= 2) return { prefix: `Week ${latestDataWeek}:`, text: "Early data collecting.", suffix: "Continue weekly check-ins to build your recovery profile." };
    if (latestDataWeek <= 4) return { prefix: `Week ${latestDataWeek}:`, text: "Foundation forming.", suffix: "Your initial patterns are emerging from check-in data." };
    if (latestDataWeek <= 8) return { prefix: `Week ${latestDataWeek}:`, text: "Data taking shape.", suffix: "Trends are becoming visible in your mobility and pain metrics." };
    if (latestDataWeek <= 12) return { prefix: `Week ${latestDataWeek}:`, text: "Active tracking.", suffix: "Your progression data shows meaningful rehabilitation trends." };
    return { prefix: `Week ${latestDataWeek}:`, text: "Long-term monitoring.", suffix: `${totalCycles} scan cycle${totalCycles > 1 ? 's' : ''} tracked in your rehabilitation journey.` };
  };

  const masteryDesc = getMasteryDescription();


  
  const chartData = React.useMemo(() => {
    // Use only real data from the database
    if (rawChartData.length > 0) {
      return rawChartData.map(d => ({
        week: `W${d.week}`,
        weekNum: d.week,
        mobility: d.mobility ?? 0,
        pain: d.pain ?? 0,
      }));
    }
    // No data yet — return empty array (chart will show empty state)
    return [];
  }, [rawChartData]);

  const maxWeeks = Math.max(1, Math.floor(userStreak / 7));

  // Apply time filter — within the selected cycle's 12-week window
  const filteredChartData = React.useMemo(() => {
    // Split data into 12-week cycles
    const cycleStart = selectedCycle * 12;
    const cycleEnd = cycleStart + 12;
    const cycleData = chartData.filter(d => d.weekNum > cycleStart && d.weekNum <= cycleEnd);
    
    // If no data for this cycle, return empty array (shows empty state)
    if (cycleData.length === 0) return [];
    
    if (timeFilter === 'weekly') return cycleData;
    if (timeFilter === '3-week') {
      const grouped = [];
      for (let i = 0; i < cycleData.length; i += 3) {
        const chunk = cycleData.slice(i, i + 3);
        grouped.push({
          week: `W${chunk[0].weekNum}-${chunk[chunk.length - 1].weekNum}`,
          weekNum: chunk[0].weekNum,
          mobility: Math.round(chunk.reduce((s, d) => s + d.mobility, 0) / chunk.length),
          pain: Math.round(chunk.reduce((s, d) => s + d.pain, 0) / chunk.length),
        });
      }
      return grouped;
    }
    // monthly (4-week blocks)
    const grouped = [];
    for (let i = 0; i < cycleData.length; i += 4) {
      const chunk = cycleData.slice(i, i + 4);
      grouped.push({
        week: `Month ${Math.floor(i / 4) + 1}`,
        weekNum: chunk[0].weekNum,
        mobility: Math.round(chunk.reduce((s, d) => s + d.mobility, 0) / chunk.length),
        pain: Math.round(chunk.reduce((s, d) => s + d.pain, 0) / chunk.length),
      });
    }
    return grouped;
  }, [chartData, timeFilter, selectedCycle]);

  const displayChartData = filteredChartData;
  // Animation Variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 260,
        damping: 20
      }
    },
  };

  return (
    <div className="font-sans overflow-x-hidden bg-[#050505] text-[#F3F4F6] min-h-screen selection:bg-[#FF6D29] selection:text-white flex relative">
      <RadialGlowBackground />
      <style>{`
        .bento-card {
            background: linear-gradient(to bottom right, rgba(39, 39, 42, 0.8), rgba(24, 24, 27, 0.9));
            border: 1px solid rgba(113, 113, 122, 0.5);
            border-radius: 12px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
        }
        .bento-card::before {
            content: '';
            position: absolute;
            inset: 0;
            border-radius: inherit;
            background: linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05));
            pointer-events: none;
        }
        .bento-card:hover {
            border-color: rgba(255, 109, 41, 0.4);
            box-shadow: 0 8px 30px rgba(255, 109, 41, 0.15);
        }
        .glass-nav {
            background-color: rgba(5, 5, 5, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .glass-panel {
            background: rgba(15, 15, 17, 0.7);
            backdrop-filter: blur(12px);
            -webkit-backdrop-filter: blur(12px);
        }
        .chart-projection-line {
            stroke-dasharray: 4 4;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.filled {
            font-variation-settings: 'FILL' 1;
        }
        
        /* Custom scrollbar for webkit */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #050505; 
        }
        ::-webkit-scrollbar-thumb {
          background: #333; 
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #555; 
        }
      `}</style>

      {/* Side Navigation Shell */}
      <aside className="flex flex-col h-full py-8 px-4 gap-2 fixed left-0 top-0 z-50 bg-[#0A0A0C] border-r border-white/5 hidden md:flex w-64">
        <div className="px-4 mb-8 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">SteadyGerak</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-1 font-semibold">Clinical Rehab</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button
            onClick={() => onNavigate('action_dashboard')}
            className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left"
          >
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Main Dashboard</span>
          </button>
          <button
            onClick={() => onNavigate('routine')}
            className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left"
          >
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="text-sm font-medium">Routine</span>
          </button>
          <button
            className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 transition-all shadow-[0_0_15px_rgba(255,109,41,0.1)] w-full text-left"
          >
            <span className="material-symbols-outlined filled">military_tech</span>
            <span className="text-sm">Mastery & Progress</span>
          </button>
          <button
            onClick={() => onNavigate('care_network')}
            className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left"
          >
            <span className="material-symbols-outlined">groups_2</span>
            <span className="text-sm font-medium">Care Network</span>
          </button>
          <button onClick={() => onNavigate('diagnostics')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">biotech</span>
            <span className="text-sm font-medium">Diagnostics</span>
          </button>
          <a onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg mt-auto mb-4 cursor-pointer">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm font-medium">Profile & Biometrics</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* TopNavBar Anchor */}
        <header className="flex justify-between items-center w-full px-6 md:px-10 h-16 sticky top-0 z-40 glass-nav">
          <div className="flex items-center gap-4">
            <span className="md:hidden material-symbols-outlined text-[#FF6D29] cursor-pointer">menu</span>
          </div>
          <div className="flex items-center gap-5">
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

        {/* Content Canvas */}
        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8 flex-grow">
          {/* Header Section */}
          <motion.section
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col gap-3"
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Recovery Mastery Analytics</h2>
            <p className="text-base text-gray-400 max-w-2xl leading-relaxed">
              {masteryDesc.prefix} <span className="text-[#FF6D29] font-semibold">{masteryDesc.text}</span> {masteryDesc.suffix}
            </p>
          </motion.section>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">

            {/* Weekly Check-In Reminder Banner */}
            {showCheckinReminder && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between gap-4 px-5 py-3 bg-[#FF6D29]/10 border border-[#FF6D29]/20 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">notification_important</span>
                  <div>
                    <p className="text-sm text-white font-medium">Weekly check-in pending</p>
                    <p className="text-[11px] text-gray-400">Submit your pain and stiffness levels to keep your progression chart up to date.</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowCheckinModal(true)}
                    className="px-3 py-1.5 bg-[#FF6D29] hover:bg-[#FF8D59] text-white text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Complete Check-In
                  </button>
                  <button
                    onClick={() => setShowCheckinReminder(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Competence Engine (Top Card) */}
            <motion.section variants={itemVariants} className="bento-card overflow-hidden relative group">
              <div className="p-6 md:p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-white">Rehabilitation Cycle Progression</h3>
                  <p className="text-sm text-gray-400 mt-1">Weekly self-reported joint health data per 12-week rehabilitation cycle. Composite mobility score is derived from pain and stiffness inputs; pain level is reported directly.</p>
                </div>
                {userStreak >= 7 && (
                  <div className="flex items-center gap-3">
                    {/* Cycle selector — chevron navigation */}
                    {totalCycles > 1 && (
                      <div className="flex items-center gap-2 bg-[#131315] border border-[#424754]/30 rounded-lg px-2 py-1.5">
                        <button
                          onClick={() => setSelectedCycle(Math.max(0, selectedCycle - 1))}
                          disabled={selectedCycle === 0}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                        </button>
                        <span className="text-[10px] font-semibold text-white min-w-[80px] text-center">
                          Cycle {selectedCycle + 1} of {totalCycles}
                        </span>
                        <button
                          onClick={() => setSelectedCycle(Math.min(totalCycles - 1, selectedCycle + 1))}
                          disabled={selectedCycle === totalCycles - 1}
                          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                        </button>
                      </div>
                    )}
                    <div className="flex items-center gap-1 bg-[#131315] border border-[#424754]/30 rounded-lg p-1">
                      {[
                        { key: 'weekly' as const, label: 'Per Week' },
                        { key: '3-week' as const, label: '3 Weeks' },
                        { key: 'monthly' as const, label: 'Monthly' },
                      ].map((f) => (
                        <button
                          key={f.key}
                          onClick={() => setTimeFilter(f.key)}
                          className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                            timeFilter === f.key
                              ? 'bg-[#FF6D29] text-white shadow-sm'
                              : 'text-gray-400 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="min-h-[780px] py-6 relative w-full p-4 md:p-8 overflow-hidden flex items-center justify-center">
                {/* Locked Graph Background - Subtle Placeholder Grid */}
                <svg className="absolute inset-0 w-full h-full px-8 py-10 opacity-30" preserveAspectRatio="none" viewBox="0 0 1000 400">
                  {/* Subtle Grid Lines */}
                  <line className="text-white/5" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="350" y2="350"></line>
                  <line className="text-white/5" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="250" y2="250"></line>
                  <line className="text-white/5" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150"></line>
                  <line className="text-white/5" stroke="currentColor" strokeWidth="1" x1="0" x2="1000" y1="50" y2="50"></line>
                  {/* Unpopulated Projection Line (Dotted - Very Subtle) */}
                  <path className="text-white/10 chart-projection-line" d="M 50 350 L 150 320 L 250 280 L 350 220 L 450 180 L 550 140 L 650 110 L 750 90 L 850 75 L 950 60" fill="none" stroke="currentColor" strokeWidth="2"></path>
                  {/* Baseline Point (Still Visible as Context) */}
                  <circle className="fill-[#FF6D29]/60" cx="50" cy="350" r="6"></circle>
                  <circle className="fill-[#FF6D29]/10" cx="50" cy="350" r="12"></circle>
                </svg>

                {/* Conditional Chart vs Locked Block */}
                <div className="relative z-10 flex items-center justify-center w-full h-auto min-h-[700px]">
                  {userStreak >= 7 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.8 }}
                      className="w-full h-full bg-black/40 backdrop-blur-sm border border-white/10 rounded-2xl p-4 md:p-6"
                    >
                      {displayChartData.length > 0 ? (
                      <>
                      <div className="mb-4">
                        <span className="inline-block text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full mb-2">Unlocked Status Active</span>
                        <h4 className="text-white font-bold text-lg">Joint Mobility Progression</h4>
                      </div>
                      <div className="w-full h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={displayChartData} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
                            <defs>
                              <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22C55E" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#22C55E" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#A855F7" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="#A855F7" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#ffffff08" strokeDasharray="3 3" horizontal={true} vertical={false} />
                            <XAxis dataKey="week" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} dy={8} />
                            <YAxis yAxisId="left" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                            <YAxis yAxisId="right" orientation="right" stroke="rgba(255,255,255,0.3)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} tickFormatter={(v) => `${v}/10`} />
                            <RechartsTooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-[#0B0C10]/95 border border-white/10 rounded-xl p-3 shadow-2xl backdrop-blur-md">
                                    <p className="text-xs text-gray-400 font-medium mb-1.5">Week {label}</p>
                                    {payload.map((entry: any, i: number) => (
                                      <p key={i} className="text-sm font-bold text-white flex items-center gap-2">
                                        <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                                        {entry.name}: <span style={{ color: entry.color }}>{entry.value}{entry.dataKey === 'mobility' ? '%' : '/10'}</span>
                                      </p>
                                    ))}
                                  </div>
                                );
                              }}
                            />
                            <Area yAxisId="left" type="monotone" name="Composite Mobility Score" dataKey="mobility" stroke="#22C55E" strokeWidth={3} fill="url(#colorBaseline)" dot={{ stroke: '#22C55E', strokeWidth: 2, r: 4, fill: '#1b1b1d' }} activeDot={{ r: 6, fill: '#22C55E', stroke: '#fff', strokeWidth: 2 }} />
                            <Area yAxisId="right" type="monotone" name="Self-Reported Pain" dataKey="pain" stroke="#A855F7" strokeWidth={2} strokeDasharray="5 3" fill="url(#colorProjected)" dot={{ stroke: '#A855F7', strokeWidth: 1.5, r: 3, fill: '#1b1b1d' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Legend */}
                      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-[3px] rounded-full bg-[#22C55E]" />
                          <span className="text-[10px] text-gray-400">Composite Mobility Score (↑ better)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-[3px] rounded-full bg-[#A855F7]" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #A855F7 0px, #A855F7 4px, transparent 4px, transparent 7px)' }} />
                          <span className="text-[10px] text-gray-400">Self-Reported Pain Level (↓ better)</span>
                        </div>
                      </div>

                      {/* Quick Guide */}
                      <div className="mt-4 bg-[#0d0d0f] border border-[#424754]/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="material-symbols-outlined text-[#FF6D29] text-[16px]">help_outline</span>
                          <span className="text-[11px] font-semibold text-white">How to Read This Chart</span>
                        </div>
                        <ul className="space-y-3 text-[10px] text-gray-400 leading-relaxed">
                          <li className="flex gap-2 items-start">
                            <span className="text-[#22C55E] mt-0.5">●</span>
                            <span><span className="text-[#22C55E] font-semibold">Green line</span> — Composite Mobility Score (0–100). Calculated weekly from your pain and stiffness inputs. Higher = better joint function.</span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="text-[#A855F7] mt-0.5">●</span>
                            <span><span className="text-[#A855F7] font-semibold">Purple dashed line</span> — Self-reported pain level (0–10) from your weekly check-in. Lower = less pain.</span>
                          </li>
                          <li className="flex gap-2 items-start">
                            <span className="text-gray-500 mt-0.5">●</span>
                            <span>Each <span className="text-white font-semibold">cycle</span> = 12-week rehabilitation window between X-Ray uploads.</span>
                          </li>
                        </ul>
                      </div>

                      {/* Progression Summary */}
                      <div className="mt-4 bg-[#0d0d0f] border border-green-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-green-400 text-[16px]">psychology</span>
                          <span className="text-[11px] font-semibold text-green-400">Progression Summary</span>
                        </div>
                        <p className="text-[11px] text-gray-300 leading-relaxed">
                          {maxWeeks >= 12 ? (
                            <>Based on your <span className="text-white font-semibold">12-week data</span>, your composite mobility score has improved from <span className="text-[#22C55E] font-semibold">{chartData[0]?.mobility}%</span> to <span className="text-[#22C55E] font-semibold">{chartData[11]?.mobility}%</span> — a <span className="text-[#22C55E] font-semibold">+{(chartData[11]?.mobility || 0) - (chartData[0]?.mobility || 0)} point</span> gain. Your reported pain has changed from <span className="text-[#A855F7] font-semibold">{chartData[0]?.pain}/10</span> to <span className="text-[#A855F7] font-semibold">{chartData[11]?.pain}/10</span>. This trajectory suggests strong adherence and positive clinical response. Continue your current protocol.</>
                          ) : maxWeeks >= 7 ? (
                            <>At <span className="text-white font-semibold">Week {maxWeeks}</span>, your composite mobility is at <span className="text-[#22C55E] font-semibold">{chartData[maxWeeks - 1]?.mobility}%</span>. Your reported pain is <span className="text-[#A855F7] font-semibold">{chartData[maxWeeks - 1]?.pain}/10</span>. You are <span className="text-[#FF6D29] font-semibold">{Math.round(((maxWeeks) / 12) * 100)}% through</span> your rehabilitation cycle. Maintain consistency for optimal results.</>
                          ) : (
                            <>You have completed <span className="text-white font-semibold">{maxWeeks} week{maxWeeks > 1 ? 's' : ''}</span> of your rehabilitation cycle. Early data shows composite mobility at <span className="text-[#22C55E] font-semibold">{chartData[maxWeeks - 1]?.mobility}%</span>. Continue daily exercises to build momentum — most patients see significant improvement after Week 4.</>
                          )}
                        </p>
                      </div>

                      {/* Weekly Check-In History — Expandable Table */}
                      <div className="mt-4 bg-[#0d0d0f] border border-[#424754]/20 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setShowHistory(!showHistory)}
                          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#FF6D29] text-[16px]">table_chart</span>
                            <span className="text-[11px] font-semibold text-white">Weekly Check-In History</span>
                            <span className="text-[9px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{rawChartData.length} weeks</span>
                          </div>
                          <span className={`material-symbols-outlined text-gray-400 text-[18px] transition-transform ${showHistory ? 'rotate-180' : ''}`}>expand_more</span>
                        </button>
                        {showHistory && rawChartData.length > 0 && (
                          <div className="px-4 pb-4">
                            {/* Cycle navigation for table */}
                            {totalCycles > 1 && (
                              <div className="flex items-center justify-center gap-2 mb-3 py-2 border-b border-[#424754]/20">
                                <button
                                  onClick={() => setHistoryCycle(Math.max(0, historyCycle - 1))}
                                  disabled={historyCycle === 0}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                                </button>
                                <span className="text-[10px] font-semibold text-white min-w-[80px] text-center">
                                  Cycle {historyCycle + 1} of {totalCycles}
                                </span>
                                <button
                                  onClick={() => setHistoryCycle(Math.min(totalCycles - 1, historyCycle + 1))}
                                  disabled={historyCycle === totalCycles - 1}
                                  className="w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                                </button>
                              </div>
                            )}
                            {/* Table */}
                            <table className="w-full text-[10px]">
                              <thead>
                                <tr className="border-b border-[#424754]/30">
                                  <th className="text-left py-2 px-2 text-gray-500 font-semibold uppercase tracking-wider">Week</th>
                                  <th className="text-center py-2 px-2 text-gray-500 font-semibold uppercase tracking-wider">Pain</th>
                                  <th className="text-center py-2 px-2 text-gray-500 font-semibold uppercase tracking-wider">Stiffness</th>
                                  <th className="text-center py-2 px-2 text-gray-500 font-semibold uppercase tracking-wider">Mobility</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const cycleStart = historyCycle * 12;
                                  const cycleEnd = cycleStart + 12;
                                  const cycleRows = rawChartData.filter(d => d.week > cycleStart && d.week <= cycleEnd);
                                  if (cycleRows.length === 0) {
                                    return (
                                      <tr><td colSpan={4} className="py-6 text-center text-gray-500 text-[11px]">No check-in data for this cycle yet.</td></tr>
                                    );
                                  }
                                  return [...cycleRows].reverse().map((row, i) => {
                                    const stiffLabel = row.stiffness === 1 ? 'Mild' : row.stiffness === 2 ? 'Moderate' : row.stiffness === 3 ? 'Severe' : '—';
                                    const mobColor = (row.mobility ?? 0) > 60 ? '#22C55E' : (row.mobility ?? 0) > 30 ? '#FFD166' : '#EF476F';
                                    return (
                                      <tr key={row.week} className={`border-b border-[#424754]/10 ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                                        <td className="py-2 px-2 text-white font-medium">W{row.week}</td>
                                        <td className="py-2 px-2 text-center text-[#A855F7] font-bold">{row.pain ?? '—'}/10</td>
                                        <td className="py-2 px-2 text-center text-gray-300">{stiffLabel} ({row.stiffness ?? '—'})</td>
                                        <td className="py-2 px-2 text-center font-bold" style={{ color: mobColor }}>{row.mobility ?? '—'}%</td>
                                      </tr>
                                    );
                                  });
                                })()}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                      </>
                      ) : (
                      <div className="w-full py-16 flex flex-col items-center justify-center text-center space-y-6 relative">
                        {/* Background grid pattern */}
                        <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 1000 400">
                          {[...Array(9)].map((_, i) => (
                            <line key={`h${i}`} x1="0" y1={i * 50} x2="1000" y2={i * 50} stroke="#FF6D29" strokeWidth="0.5" />
                          ))}
                          {[...Array(21)].map((_, i) => (
                            <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="400" stroke="#FF6D29" strokeWidth="0.5" />
                          ))}
                        </svg>

                        {/* Shield Badge */}
                        <div className="w-24 h-24 relative flex items-center justify-center">
                          <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D29]/20 to-[#C2410C]/20 rounded-full border-2 border-[#FF6D29]/40 shadow-[0_0_30px_rgba(255,109,41,0.5)]"></div>
                          <div className="relative z-10 w-full h-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-[#FF6D29] text-5xl drop-shadow-[0_0_10px_rgba(255,109,41,0.8)]">lock</span>
                          </div>
                          <div className="absolute inset-0 rounded-full border-2 border-[#FF6D29]/30 animate-pulse"></div>
                          <div className="absolute inset-[-4px] rounded-full border border-[#FF6D29]/15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                        </div>

                        {/* Title */}
                        <div>
                          <h4 className="text-xl font-bold text-white tracking-tight mb-2">Cycle {selectedCycle + 1} is Locked</h4>
                          <div className="w-14 h-0.5 bg-gradient-to-r from-transparent via-[#FF6D29] to-transparent mx-auto rounded-full"></div>
                        </div>

                        {/* Description */}
                        <div className="text-center space-y-1">
                          <p className="text-sm text-gray-300">This cycle's progression data is not yet available.</p>
                          <p className="text-sm text-gray-400">Complete your <span className="text-[#FF6D29] font-semibold">Week {selectedCycle * 12 + 1}</span> check-in to unlock.</p>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                          Each cycle unlocks after the previous 12-week period.
                        </p>
                      </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                      className="glass-panel border border-[#FF6D29]/20 rounded-2xl p-6 md:p-8 max-w-2xl w-full mx-4 text-center space-y-6 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(255,109,41,0.15)]"
                    >
                      {/* Stylized Unlock Avatar - Key & Lock in Shield Badge */}
                      <div className="w-20 h-20 mx-auto mb-2 relative flex items-center justify-center">
                        {/* Shield/Badge Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D29]/20 to-[#C2410C]/20 rounded-full border-2 border-[#FF6D29]/40 shadow-[0_0_25px_rgba(255,109,41,0.4)]"></div>

                        {/* Key & Lock Icon Composition */}
                        <div className="relative z-10 w-full h-full flex items-center justify-center">
                          <span className="material-symbols-outlined text-[#FF6D29] text-4xl drop-shadow-[0_0_8px_rgba(255,109,41,0.8)]">
                            key
                          </span>
                          {/* Lock Sub-Badge */}
                          <div className="absolute bottom-0 right-0 bg-[#0A0A0C] rounded-full p-1.5 border border-[#FF6D29]/40 shadow-[0_0_10px_rgba(255,109,41,0.3)] flex items-center justify-center z-20">
                            <span className="material-symbols-outlined text-[#FF8D59] text-[16px] drop-shadow-[0_0_6px_rgba(255,109,41,0.6)]">
                              lock
                            </span>
                          </div>
                        </div>

                        {/* Animated Glow Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-[#FF6D29]/30 animate-pulse"></div>
                        <div className="absolute inset-0 rounded-full border border-[#FF6D29]/20 scale-110 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                      </div>

                      {/* Title */}
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight mb-2">
                          Mastery Challenge
                        </h3>
                        <div className="w-16 h-1 bg-gradient-to-r from-transparent via-[#FF6D29] to-transparent mx-auto rounded-full"></div>
                      </div>

                      {/* Clean, Multi-Paragraph Description */}
                      <div className="text-sm md:text-base text-gray-300 leading-relaxed max-w-2xl mx-auto">
                        <p>
                          Your <span className="text-white font-semibold">longitudinal progress visualization</span> is currently locked.
                          Complete your <span className="text-[#FF6D29] font-semibold">first 7 consecutive days</span> of prescribed physiotherapy routines to unlock this monitoring ecosystem.
                          Once active, this chart will map your <span className="text-white font-semibold">daily exercise consistency</span> directly against your <span className="text-white font-semibold">joint mobility scores</span>—allowing you to visually track exactly how your effort translates into physical recovery.
                        </p>
                        <p className="text-xs text-gray-400 italic pt-4 mt-4 border-t border-white/5">
                          Consistency builds data. Data reveals your path forward.
                        </p>
                      </div>

                      {/* Primary Call-to-Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(255, 109, 41, 0.5)" }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onNavigate('routine')}
                        className="bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#C2410C] text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.4)] w-full text-base flex items-center justify-center gap-3 group"
                      >
                        <span className="material-symbols-outlined group-hover:scale-110 transition-transform">
                          play_arrow
                        </span>
                        Start Day 1 Session
                      </motion.button>

                      {/* Progress Indicator */}
                      <div className="pt-2 flex items-center justify-center gap-2 text-xs text-gray-500">
                        <span className="material-symbols-outlined text-sm">schedule</span>
                        <span>7 days to unlock • {Math.min(Math.round((userStreak / 7) * 100), 100)}% complete</span>
                      </div>
                    </motion.div>
                  )}
                </div>

              </div>
            </motion.section>

            {/* Trophy Case (Bottom Section) */}
            <motion.section variants={itemVariants} className="flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-white/5 pb-3">
                <h3 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF6D29]">workspace_premium</span>
                  Achievement & Awards
                </h3>
                <p className="text-sm text-gray-400">Unlock these milestone badges as you progress through your clinical rehabilitation journey.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Achievement 1: Journey Commenced (UNLOCKED) */}
                <div className="group relative w-full h-[320px] [perspective:2000px]">
                  <div className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700 group-hover:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <motion.div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(0deg)]">
                      <div className="bento-card border-[#FF6D29]/30 rounded-xl p-6 h-full flex flex-col justify-between shadow-[0_0_20px_rgba(255,109,41,0.05)] cursor-default">
                        <div className="absolute top-0 right-0 p-4">
                          <span className="material-symbols-outlined filled text-[#FF6D29] text-lg">check_circle</span>
                        </div>
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/5 border border-white/5 mb-4">
                          <img alt="Journey Commenced Badge" className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAa708k0PCbYA1_wIkMKvGGIjfB4EXbEK4SqyufmnrkNh_RD6qCCIeixdPmPtiT7JjUqYqSdFMhZs8sH6Q4G7pMetuUUnD2GpcCWzEXSG5ZUo2JPUwlnYsLLIk1mVsDQoaWYviR_tRuQRyLGcNSg57p5AOjHpiVuDgd6wbATI5oORafcuRcNzyulSC-HBPMSBkZp619bspR2pZscQ7c5xnIJkwY2e0BG-ImB5JXokH3uTwQXyR__beFJHcTYVcQVoVjyiLG5ztIu6g" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight mb-1">Journey Commenced</h4>
                          <p className="text-xs text-gray-400">Completed onboarding and uploaded baseline X-Ray.</p>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-[#FF6D29] uppercase tracking-widest bg-[#FF6D29]/10 px-2 py-1 rounded">Unlocked Today</span>
                        </div>
                      </div>
                    </motion.div>
                    {/* Back */}
                    <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="bento-card border-[#FF6D29]/30 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center shadow-[0_0_20px_rgba(255,109,41,0.05)]">
                        <span className="material-symbols-outlined text-[#FF6D29] text-4xl mb-4">flag</span>
                        <h4 className="text-lg font-bold text-white tracking-tight mb-2">Milestone Unlocked</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">You've taken the crucial first step. Baseline joint space width established. Keep logging your daily routines to unlock predictive modeling.</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievement 2: Iron Routine (IN PROGRESS) */}
                <div className="group relative w-full h-[320px] [perspective:2000px]">
                  <div className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700 group-hover:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(0deg)]">
                      <div className={`bento-card ${userStreak >= 7 ? 'border-[#FF6D29]/30' : 'border-dashed border-white/20'} rounded-xl p-6 h-full flex flex-col justify-between cursor-default`}>
                        {userStreak >= 7 && (
                          <div className="absolute top-0 right-0 p-4">
                            <span className="material-symbols-outlined filled text-[#FF6D29] text-lg">check_circle</span>
                          </div>
                        )}
                        <div className={`aspect-square w-full rounded-lg overflow-hidden bg-white/5 border border-white/5 mb-4 ${userStreak >= 7 ? '' : 'grayscale'}`}>
                          <img alt="Iron Routine Badge" className={`w-full h-full object-cover ${userStreak >= 7 ? 'opacity-100' : 'opacity-80'}`} src="https://lh3.googleusercontent.com/aida-public/AB6AXuAx7viH_eQuQlt8VYTFSEzCN0qN_IdQoDUxwBrHV_jawoj_eVa-y5P0RjiB9vdzuZx02NvHywIk7axx9AAcNl82zodTuu0sWVu7HyC8GyLKgA5GAure3GxoMYTXy8LpSCwJGPqkghPw7oYnd-NELGcDaUkxqJZJIgU8mRZtldv5tNQdqVJ1kgCSY-0DWJndTDdx_2rn9m9YhtCTIcefNkVl8tzrkmrNxFpSpY2-AvMRQxSB1H4yKkUh01GcN8j3jVBXKlbw9htPFSI" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-white tracking-tight mb-1">Iron Routine</h4>
                          <p className="text-xs text-gray-400">Achieve a 7-day unbroken physiotherapy streak.</p>
                        </div>
                        {userStreak >= 7 ? (
                          <div className="pt-2">
                            <span className="text-[10px] font-bold text-[#FF6D29] uppercase tracking-widest bg-[#FF6D29]/10 px-2 py-1 rounded">Unlocked</span>
                          </div>
                        ) : (
                          <div className="pt-2 space-y-2">
                            <div className="flex justify-between items-end">
                              <span className="text-xs font-semibold text-white">Day {userStreak} of 7</span>
                              <span className="text-xs font-bold text-[#FF6D29]">{Math.min(Math.round((userStreak / 7) * 100), 100)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div className="h-full bg-[#FF6D29] rounded-full shadow-[0_0_8px_rgba(255,109,41,0.5)]" style={{ width: `${Math.min(Math.round((userStreak / 7) * 100), 100)}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className={`bento-card ${userStreak >= 7 ? 'border-[#FF6D29]/30' : 'border-dashed border-white/20'} rounded-xl p-6 h-full flex flex-col items-center justify-center text-center`}>
                        <span className={`material-symbols-outlined text-4xl mb-4 ${userStreak >= 7 ? 'text-[#FF6D29]' : 'text-white'}`}>fitness_center</span>
                        <h4 className="text-lg font-bold text-white tracking-tight mb-2">{userStreak >= 7 ? 'Milestone Unlocked' : 'In Progress'}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">
                          {userStreak >= 7 
                            ? "You've successfully completed 7 consecutive days of prescribed exercises. Your AI Recovery Trajectory is now unlocked."
                            : "Consistency is key to rehabilitation. Complete 7 consecutive days of prescribed exercises to unlock the AI Recovery Trajectory."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Achievement 3: Cartilage Preservation (LOCKED) */}
                <div className="group relative w-full h-[320px] [perspective:2000px]">
                  <div className="relative h-full w-full [transform-style:preserve-3d] transition-transform duration-700 group-hover:[transform:rotateY(180deg)]">
                    {/* Front */}
                    <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(0deg)]">
                      <div className="bento-card border-white/5 rounded-xl p-6 h-full flex flex-col justify-between opacity-60 cursor-not-allowed">
                        <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none mb-10">
                          <div className="w-12 h-12 bg-[#050505]/80 backdrop-blur border border-white/10 rounded-full flex items-center justify-center">
                            <span className="material-symbols-outlined text-gray-400 text-xl">lock</span>
                          </div>
                        </div>
                        <div className="aspect-square w-full rounded-lg overflow-hidden bg-white/5 border border-white/5 mb-4 grayscale contrast-75">
                          <img alt="Cartilage Preservation Badge" className="w-full h-full object-cover opacity-50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHJthIFC48xj_Bg7Brum67itq3oKLoHyDt4qItaZGC2hoy1RszwKQsk9ZnxE5z1_g07BkMAcVi2oUcqApEXC1oEByjWfanGmUMMhjyN6X1HUfyJvbfkm9XqGb2MrzNTx7OUbbifKDAVPnNM2IBA7i5owpmaAVmnQEN1AMv9gjWD2on0qgr9ZzYyzGzMSmeFVJWn53VeP37cFa2umFASLmSppukYXWfXqeOwm1gM_4b3CStJIgis6EiCZEUbGi-vgRs5c7J9CTPwio" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-gray-300 tracking-tight mb-1">Cartilage Preservation</h4>
                          <p className="text-xs text-gray-500">AI-verified joint space stability via 6-month scan.</p>
                        </div>
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-2 py-1 rounded border border-white/5">Locked Stage 4</span>
                        </div>
                      </div>
                    </div>
                    {/* Back */}
                    <div className="absolute inset-0 h-full w-full [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="bento-card border-white/5 rounded-xl p-6 h-full flex flex-col items-center justify-center text-center opacity-60 cursor-not-allowed">
                        <span className="material-symbols-outlined text-gray-500 text-4xl mb-4">lock</span>
                        <h4 className="text-lg font-bold text-gray-300 tracking-tight mb-2">Requirements</h4>
                        <p className="text-sm text-gray-500 leading-relaxed">This milestone requires a 6-month clinical validation via Grad-CAM X-Ray scan showing halted cartilage degradation.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-nav border-t border-white/10 flex justify-around items-center px-4 z-50">
          <button onClick={() => onNavigate('action_dashboard')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button onClick={() => onNavigate('routine')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="text-[10px] font-medium">Routine</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#FF6D29]">
            <span className="material-symbols-outlined filled">military_tech</span>
            <span className="text-[10px] font-bold">Mastery</span>
          </button>
          <button onClick={() => onNavigate('care_network')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">groups_2</span>
            <span className="text-[10px] font-medium">Network</span>
          </button>
        </nav>
      </main>

      {/* Weekly Check-In Modal (on-demand, forceOpen mode) */}
      <WeeklyCheckInModal
        onboardingDate={onboardingDate ?? null}
        forceOpen={showCheckinModal}
        onCheckInComplete={() => {
          setShowCheckinModal(false);
          setShowCheckinReminder(false);
        }}
        onDismiss={() => setShowCheckinModal(false)}
      />
    </div>


  );
}
