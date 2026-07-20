import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { RadialGlowBackground } from '../../components/ui/radial-glow-background';
import { supabase } from '../../lib/supabase';
import WeeklyCheckInModal from '../../components/WeeklyCheckInModal';

interface DashboardProps {
  userName?: string;
  imageUrl?: string;
  severityGrade: string;
  topConfidence: number;
  confidenceDistribution: { grade: string; score: number }[];
  userStreak?: number;
  onboardingDate?: string | null;
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile' | 'diagnostics') => void;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
}

const GRADE_COLORS: Record<string, string> = {
  'Healthy': '#10b981',
  'Doubtful': '#fde047',
  'Minimal': '#f97316',
  'Moderate': '#ef4444',
  'Severe': '#7f1d1d'
};

function getYouTubeQuery(grade: string): string {
  const num = { Healthy: 0, Doubtful: 1, Minimal: 2, Moderate: 3, Severe: 4 }[grade] ?? 3;
  if (num <= 2) return 'knee osteoarthritis mild strengthening exercises physiotherapy';
  return 'knee osteoarthritis gentle seated mobility exercises -impact';
}

export default function DailyActionDashboard({ userName = "Guest", imageUrl, severityGrade, confidenceDistribution, userStreak = 0, onboardingDate, onNavigate }: DashboardProps) {
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);

  // Calculate days since onboarding
  const daysSinceOnboarding = (() => {
    if (!onboardingDate) return 1;
    const start = new Date(onboardingDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);
  })();

  // Generate dynamic subtitle based on day count
  const getDayDescription = () => {
    if (daysSinceOnboarding <= 1) return "Establishing your baseline and personalized trajectory.";
    if (daysSinceOnboarding <= 7) return "Building your rehabilitation foundation. Keep showing up.";
    if (daysSinceOnboarding <= 14) return "Consistency is forming. Your body is adapting to the routine.";
    if (daysSinceOnboarding <= 30) return "Momentum building. Early patterns suggest positive adaptation.";
    if (daysSinceOnboarding <= 60) return "Strong adherence. Your joint mobility data is taking shape.";
    if (daysSinceOnboarding <= 84) return "Approaching your next scan window. Stay the course.";
    return "Long-term rehabilitation in progress. Your commitment is paying off.";
  };

  // Quick Stats data
  const [latestPain, setLatestPain] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState(0);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Calculate current week number
      const now = new Date();
      const onboard = onboardingDate ? new Date(onboardingDate) : now;
      const diffDays = Math.floor((now.getTime() - onboard.getTime()) / (1000 * 60 * 60 * 24));
      const currentWeek = Math.max(1, Math.floor(diffDays / 7) + 1);

      // Get latest pain from current week check-in or most recent previous week
      const { data: existingCheckin } = await supabase
        .from('weekly_checkins')
        .select('current_pain_level')
        .eq('user_id', session.user.id)
        .eq('check_in_week_number', currentWeek)
        .maybeSingle();

      if (existingCheckin) {
        setLatestPain(existingCheckin.current_pain_level);
      } else {
        const { data: latestData } = await supabase
          .from('weekly_checkins')
          .select('current_pain_level')
          .eq('user_id', session.user.id)
          .order('check_in_week_number', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (latestData) setLatestPain(latestData.current_pain_level);
      }

      // Fetch total XP
      const { data: xpData } = await supabase
        .from('exercise_sessions')
        .select('xp_earned')
        .eq('user_id', session.user.id);
      if (xpData) setTotalXp(xpData.reduce((sum, row) => sum + (row.xp_earned || 0), 0));
    };
    fetchStats();
  }, [onboardingDate]);

  // Calculate next scan countdown
  const daysUntilNextScan = useMemo(() => {
    const totalDaysInCycle = 84; // 12 weeks
    const daysIntoCurrentCycle = ((daysSinceOnboarding - 1) % totalDaysInCycle);
    return totalDaysInCycle - daysIntoCurrentCycle;
  }, [daysSinceOnboarding]);

  // AI Insight of the Day — rotates daily based on severity grade
  const aiInsight = useMemo(() => {
    const insights: Record<string, string[]> = {
      Healthy: [
        "Maintain your current activity level. Light resistance training 3x/week helps preserve cartilage health.",
        "Joint-friendly activities like cycling or swimming help maintain synovial fluid production.",
        "Focus on balanced nutrition — Omega-3 fatty acids support joint membrane integrity.",
        "Stretching before and after activity reduces risk of micro-trauma to healthy cartilage.",
        "Weight management within a healthy BMI range reduces joint load by up to 4x per kg lost.",
        "Proprioception exercises (balance boards, single-leg stands) help prevent future joint issues.",
        "Regular low-impact cardio keeps joints well-nourished through improved blood flow.",
      ],
      Doubtful: [
        "Early-stage changes respond well to consistent low-impact exercise. Walking 30 min/day can slow progression.",
        "Isometric quad strengthening (wall sits, leg extensions) protects the knee joint without high load.",
        "Consider glucosamine supplementation — evidence suggests modest benefit at early stages.",
        "Avoid prolonged kneeling or squatting — these positions increase cartilage compression forces.",
        "Warm up for 5–10 minutes before any exercise to increase synovial fluid viscosity.",
        "Stationary cycling at low resistance is one of the best exercises for doubtful OA findings.",
        "Focus on hamstring flexibility — tight hamstrings increase patellofemoral joint stress.",
      ],
      Minimal: [
        "Aquatic exercises reduce joint load by 50% while building strength. Try pool walking or water aerobics.",
        "Heat therapy (warm towel, 15 min) before exercise can reduce stiffness and improve session quality.",
        "Short frequent walks (10 min, 3x/day) are better than one long session for minimal OA.",
        "Strengthening the VMO (inner quad) helps stabilize the kneecap and reduces grinding.",
        "Low-impact yoga poses like Warrior II and Tree Pose build stability without joint stress.",
        "Ice after exercise (15 min) can manage inflammation and prevent post-activity flare-ups.",
        "Maintain consistent daily exercise — irregular patterns can trigger inflammation cycles.",
      ],
      Moderate: [
        "Low-impact swimming 2x/week can reduce stiffness by 30% for moderate OA while building muscle.",
        "Seated leg raises and ankle pumps maintain circulation and strength without bearing weight.",
        "Break up sitting time every 30 minutes — brief movement prevents joint stiffening.",
        "Gentle range-of-motion exercises in the morning can reduce the 'first step' pain significantly.",
        "A wedge insole may reduce medial knee compartment load by 5–10% during walking.",
        "Focus on eccentric quad exercises — slow controlled lowering builds strength with less joint stress.",
        "Night-time joint stiffness is normal. Sleeping with a pillow between knees reduces morning pain.",
      ],
      Severe: [
        "Gentle seated exercises maintain joint mobility without overloading damaged cartilage surfaces.",
        "Chair-based quad sets (tightening thigh muscles while seated) preserve muscle without standing.",
        "Use assistive devices (cane on the opposite side) to reduce joint load by up to 25%.",
        "Warm water therapy (33–36°C) is especially beneficial — buoyancy eliminates 90% of body weight.",
        "Focus on pain-free range of motion. Never push through sharp pain — it indicates tissue stress.",
        "Ankle circles and toe raises can be done from any position and help maintain lower limb circulation.",
        "Short, gentle stretching sessions (5 min, 4x/day) are better than one long intensive session.",
      ],
    };
    const gradeInsights = insights[severityGrade] || insights['Moderate'];
    // Rotate based on day of year
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    return gradeInsights[dayOfYear % gradeInsights.length];
  }, [severityGrade]);

  // YouTube API fetch
  const fetchVideos = useCallback(async () => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) { setLoadingVideos(false); return; }
    try {
      const query = getYouTubeQuery(severityGrade);
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('API error');
      const data = await res.json();
      setVideos((data.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'"),
        thumbnail: item.snippet.thumbnails?.medium?.url || '',
      })));
    } catch { /* silent */ }
    finally { setLoadingVideos(false); }
  }, [severityGrade]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  // Pie chart data
  const pieData = confidenceDistribution.map((d) => ({ name: d.grade, value: parseFloat(d.score.toFixed(1)) }));

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.12 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } } };

  return (
    <div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">
      <WeeklyCheckInModal
        onboardingDate={onboardingDate ?? null}
        onCheckInComplete={(painLevel) => setLatestPain(painLevel)}
        onDismiss={() => {}}
      />
      <RadialGlowBackground />
      <style>{`
        .glass-nav { background-color: rgba(19,19,21,0.85); backdrop-filter: blur(16px); border-bottom: 1px solid rgba(255,255,255,0.05); }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        .material-symbols-outlined.filled { font-variation-settings: 'FILL' 1; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #131315; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
      `}</style>

      {/* Side Navigation */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 bg-[#0A0A0C] border-r border-white/5 hidden md:flex flex-col py-8 px-4">
        <div className="px-4 mb-8 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">SteadyGerak</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-1 font-semibold">Clinical Portal</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 w-full text-left">
            <span className="material-symbols-outlined filled">home</span>
            <span className="text-sm">Main Dashboard</span>
          </button>
          <button onClick={() => onNavigate('routine')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">fitness_center</span>
            <span className="text-sm font-medium">Routine</span>
          </button>
          <button onClick={() => onNavigate('mastery')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">emoji_events</span>
            <span className="text-sm font-medium">Mastery & Progress</span>
          </button>
          <button onClick={() => onNavigate('care_network')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">medical_services</span>
            <span className="text-sm font-medium">Care Network</span>
          </button>
          <button onClick={() => onNavigate('diagnostics')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">biotech</span>
            <span className="text-sm font-medium">Diagnostics</span>
          </button>
          <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm font-medium">Profile & Biometrics</span>
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 flex flex-col overflow-x-hidden">
        {/* Top Nav */}
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

        {/* Page Content */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8 flex-grow">

          {/* Task 1: Personalized Header */}
          <motion.section variants={itemVariants}>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Welcome back, {userName}.</h1>
            <p className="text-base text-gray-400">Day {daysSinceOnboarding}: {getDayDescription()}</p>
          </motion.section>

          {/* ═══ Quick Stats Row ═══ */}
          <motion.section variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Streak */}
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6D29]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#FF6D29] text-xl">local_fire_department</span>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none">{userStreak}</p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Day Streak</p>
              </div>
            </div>
            {/* Total XP */}
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#8B5CF6] text-xl">star</span>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none">{totalXp.toLocaleString()}</p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Total XP</p>
              </div>
            </div>
            {/* Latest Pain */}
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ef4444]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#ef4444] text-xl">favorite</span>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none">{latestPain !== null ? latestPain : '—'}<span className="text-xs text-gray-500 font-normal">/10</span></p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Latest Pain</p>
              </div>
            </div>
            {/* Days to Scan */}
            <div className="bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#22c55e] text-xl">radiology</span>
              </div>
              <div>
                <p className="text-xl font-black text-white leading-none">{daysUntilNextScan}</p>
                <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Days to Scan</p>
              </div>
            </div>
          </motion.section>

          {/* Main Grid: Left (wider) + Right (narrower) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ═══ LEFT COLUMN (2/3) ═══ */}
            <div className="lg:col-span-2 space-y-6">

              {/* Task 2: Scan Probability Distribution */}
              <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-[#FF6D29]">analytics</span>
                  <h2 className="text-base font-bold text-white">Scan Probability Distribution</h2>
                  <span className="ml-auto text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-full">KL Grade: {severityGrade}</span>
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-center">
                  {/* Donut Chart */}
                  <div className="w-48 h-48 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value" stroke="none">
                          {pieData.map((_entry, index) => (
                            <Cell key={`cell-${index}`} fill={GRADE_COLORS[_entry.name] || '#FF6D29'} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: '#1b1b1d', border: '1px solid #424754', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#e0e0e0' }} formatter={(value: any) => `${value}%`} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Horizontal Bars */}
                  <div className="flex-1 w-full space-y-3">
                    {confidenceDistribution.map((d, idx) => (
                      <div key={d.grade} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">{d.grade}</span>
                          <span className="text-white font-mono font-bold">{d.score.toFixed(1)}%</span>
                        </div>
                        <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${d.score}%` }}
                            transition={{ duration: 0.8, delay: 0.3 + idx * 0.1 }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: GRADE_COLORS[d.grade] || '#FF6D29' }}
                          />
                        </div>
                      </div>
                    ))}
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

              {/* Task 3: Dynamic Action Plan (YouTube) */}
              <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 overflow-hidden">
                <div className="flex items-center gap-2 mb-5">
                  <span className="material-symbols-outlined text-[#FF6D29]">play_circle</span>
                  <h2 className="text-base font-bold text-white">Today's Action Plan</h2>
                  <span className="ml-auto text-[10px] text-[#FF6D29] font-bold tracking-widest uppercase">AI-Curated</span>
                </div>

                {loadingVideos ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex gap-4 animate-pulse">
                        <div className="w-32 h-20 bg-white/5 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2 py-2">
                          <div className="h-4 bg-white/5 rounded w-3/4" />
                          <div className="h-3 bg-white/5 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : videos.length > 0 ? (
                  <div className="space-y-4">
                    {videos.map((video, idx) => (
                      <div key={video.id} className="flex gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-[#FF6D29]/30 transition-all group">
                        <div className="w-32 h-20 rounded-lg overflow-hidden shrink-0 border border-white/10">
                          <iframe
                            src={`https://www.youtube.com/embed/${video.id}?rel=0`}
                            title={video.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <h4 className="text-sm font-semibold text-white line-clamp-2 group-hover:text-[#FF6D29] transition-colors">{video.title}</h4>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-bold text-[#FF6D29] bg-[#FF6D29]/10 px-2 py-0.5 rounded-full">+50 XP</span>
                            <span className="text-[10px] text-gray-500">Exercise {idx + 1}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    <span className="material-symbols-outlined text-3xl mb-2 block">cloud_off</span>
                    Video content unavailable. Check your YouTube API key.
                  </div>
                )}

                <button
                  onClick={() => onNavigate('routine')}
                  className="w-full mt-6 py-3.5 bg-[#FF6D29] hover:bg-[#FF8D59] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                >
                  <span className="material-symbols-outlined filled text-[18px]">play_arrow</span>
                  Start Today's Session
                </button>
            {/* Floating Overlay */}
            <div 
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{ 
                background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.05), transparent, rgba(147, 51, 234, 0.05))' 
              }}
            ></div>
              </motion.div>
            </div>

            {/* ═══ RIGHT COLUMN (1/3) — Recovery Path ═══ */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-6 h-full flex flex-col overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D29]">timeline</span>
                <h2 className="text-base font-bold text-white">Your Recovery Path</h2>
              </div>

              {/* Timeline list — grows to fill space, distributes evenly */}
              <div className="flex-1 flex flex-col mt-4 pb-4">

                {/* Phase 1: Completed */}
                <div className="flex gap-4 flex-1 relative">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#FF6D29] flex items-center justify-center shrink-0 relative z-10">
                      <span className="material-symbols-outlined filled text-white text-[16px]">check</span>
                    </div>
                    <div className="absolute top-8 bottom-0 w-0.5 bg-[#FF6D29]/50"></div>
                  </div>
                  <div className="pb-6">
                    <h4 className="text-sm font-bold text-white mb-1">Baseline X-Ray Uploaded</h4>
                    <p className="text-xs text-gray-400 mb-2">Initial scan processed and analyzed by AI.</p>
                    {imageUrl && (
                      <div className="w-48 h-48 rounded-xl overflow-hidden border border-white/10 mb-3 shadow-lg group relative cursor-pointer">
                        <img src={imageUrl} alt="X-Ray" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                          <span className="material-symbols-outlined text-white text-3xl">zoom_in</span>
                        </div>
                      </div>
                    )}
                    <span className="inline-block text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">Completed</span>
                  </div>
                </div>

                {/* Phase 2: In Progress */}
                <div className="flex gap-4 flex-1 relative">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#FF6D29]/20 border-2 border-[#FF6D29] flex items-center justify-center shrink-0 relative z-10">
                      <span className="material-symbols-outlined text-[#FF6D29] text-[14px]">trending_up</span>
                    </div>
                    <div className="absolute top-8 bottom-0 w-0.5 bg-white/10"></div>
                  </div>
                  <div className="pb-6">
                    <h4 className="text-sm font-bold text-white mb-1">7-Day Exercise Streak</h4>
                    <p className="text-xs text-gray-400 mb-3">Complete daily sessions to build consistency.</p>
                    <div className="w-full h-4 bg-black/40 rounded-full overflow-hidden mb-2 border border-white/10 shadow-inner">
                      <div className="h-full bg-gradient-to-r from-[#FF6D29]/70 to-[#FF6D29] rounded-full shadow-[0_0_15px_rgba(255,109,41,0.5)]" style={{ width: `${Math.min(Math.round((userStreak / 7) * 100), 100)}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">{Math.min(userStreak, 7)} / 7 Days</span>
                    {userStreak >= 7 ? (
                      <span className="inline-block ml-3 text-[10px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-full">Completed</span>
                    ) : (
                      <span className="inline-block ml-3 text-[10px] font-bold text-[#eab308] bg-[#eab308]/10 px-2 py-0.5 rounded-full">In Progress</span>
                    )}
                  </div>
                </div>

                {/* Phase 3: Locked */}
                <div className="flex gap-4 flex-1 relative">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0 relative z-10">
                      <span className="material-symbols-outlined text-gray-500 text-[14px]">lock</span>
                    </div>
                    <div className="absolute top-8 bottom-0 w-0.5 bg-white/5"></div>
                  </div>
                  <div className="pb-6">
                    <h4 className="text-sm font-bold text-gray-500 mb-1">Week 12 Checkup</h4>
                    <p className="text-xs text-gray-600 mb-2">Next X-Ray upload required to evaluate joint space stability.</p>
                    <span className="inline-block text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Locked</span>
                  </div>
                </div>

                {/* Phase 4: Long-Term (anchors bottom) */}
                <div className="flex gap-4 relative">
                  <div className="flex flex-col items-center w-8 shrink-0">
                    <div className="w-8 h-8 rounded-full bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center shrink-0 relative z-10">
                      <span className="material-symbols-outlined text-[#8B5CF6] text-[14px]">shield</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-500 mb-1">Long-Term Joint Preservation</h4>
                    <p className="text-xs text-gray-600 mb-2">Maintain healthy BMI and consistent mobility.</p>
                    <span className="inline-block text-[10px] font-bold text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">Locked</span>
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

          {/* ═══ Bottom Row: Scan Countdown + AI Insight ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Next Scan Countdown */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 overflow-hidden flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-2 mb-4 w-full">
                <span className="material-symbols-outlined text-[#22c55e] text-lg">radiology</span>
                <h3 className="text-sm font-bold text-white">Next Scan Window</h3>
              </div>
              {/* Circular Progress */}
              <div className="relative w-28 h-28 mb-3">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="50" cy="50" r="42" fill="none"
                    stroke="#22c55e"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 42}`}
                    strokeDashoffset={`${2 * Math.PI * 42 * (daysUntilNextScan / 84)}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black text-white">{daysUntilNextScan}</span>
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Days Left</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Week <span className="text-white font-semibold">{((Math.ceil(daysSinceOnboarding / 7) - 1) % 12) + 1}</span> of 12 in Cycle <span className="text-white font-semibold">{Math.ceil(Math.ceil(daysSinceOnboarding / 7) / 12)}</span>
              </p>
              <div className="w-full mt-3 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#22c55e]/50 to-[#22c55e] rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, ((84 - daysUntilNextScan) / 84) * 100)}%` }}
                />
              </div>
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.03), transparent)' }}></div>
            </motion.div>

            {/* AI Insight of the Day */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 shadow-2xl rounded-xl p-5 overflow-hidden flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined text-[#FF6D29] text-lg">lightbulb</span>
                <h3 className="text-sm font-bold text-white">AI Insight of the Day</h3>
                <span className="ml-auto text-[9px] text-gray-600 font-semibold uppercase tracking-widest">For {severityGrade} OA</span>
              </div>
              <div className="flex-1 flex items-center">
                <p className="text-sm text-gray-300 leading-relaxed">
                  {aiInsight}
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF6D29] text-sm">auto_awesome</span>
                <span className="text-[10px] text-gray-500 font-medium">Personalized to your KL Grade {({ Healthy: 0, Doubtful: 1, Minimal: 2, Moderate: 3, Severe: 4 }[severityGrade] ?? 3)} diagnosis</span>
              </div>
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.03), transparent)' }}></div>
            </motion.div>

          </div>

        </motion.div>
      </main>
    </div>
  );
}
