import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RadialGlowBackground } from '../../components/ui/radial-glow-background';
import { supabase } from '../../lib/supabase';

interface RoutinePageProps {
  patientKLGrade: string;
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile') => void;
  userName?: string;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

// ─── KL Grade Mapping & Clinical Query Logic ──────────────────────────────────

const GRADE_MAP: Record<string, number> = {
  'Healthy': 0,
  'Doubtful': 1,
  'Minimal': 2,
  'Moderate': 3,
  'Severe': 4,
};

function getKLGradeNumber(grade: string): number {
  return GRADE_MAP[grade] ?? 3;
}

function getGradeLabel(grade: string): { label: string; color: string } {
  const num = getKLGradeNumber(grade);
  if (num <= 1) return { label: `KL Grade ${num} (${grade})`, color: '#10B981' };
  if (num <= 3) return { label: `KL Grade ${num} (${grade})`, color: '#F59E0B' };
  return { label: `KL Grade ${num} (${grade})`, color: '#EF4444' };
}

function getClinicalQuery(grade: string): string {
  const num = getKLGradeNumber(grade);
  if (num <= 2) return 'knee osteoarthritis mild physical therapy exercises';
  return 'knee osteoarthritis severe seated gentle mobility -impact';
}

function getRoutineDescription(grade: string): string {
  const num = getKLGradeNumber(grade);
  if (num <= 2) return 'Routine optimized for mild-stage strengthening and mobility preservation.';
  return 'Routine auto-adjusted for joint unloading and gentle seated mobility.';
}

// ─── AI Exercise Guidance ─────────────────────────────────────────────────────

function getExerciseGuide(videoTitle: string, grade: string): { sets: number; reps: string; restSeconds: number; instructions: string[] } {
  const num = getKLGradeNumber(grade);
  if (num <= 2) {
    return {
      sets: 3,
      reps: '10-12 reps',
      restSeconds: 30,
      instructions: [
        'Warm up with 2 minutes of gentle knee bending while seated.',
        'Follow the video form carefully — focus on slow, controlled movements.',
        'Keep your core engaged throughout the exercise for stability.',
        'If you feel sharp pain (not muscle fatigue), stop immediately.',
        'Breathe out on exertion, breathe in on the return phase.',
      ],
    };
  }
  return {
    sets: 2,
    reps: '8 reps (gentle)',
    restSeconds: 45,
    instructions: [
      'Begin with a 3-minute seated warm-up: gentle ankle pumps and toe raises.',
      'Perform movements slowly — no sudden or jerky motions.',
      'Keep your affected knee in a pain-free range of motion only.',
      'Use a chair or wall for balance support if needed.',
      'Stop if pain exceeds 3/10 on VAS scale. Rest and apply ice if needed.',
    ],
  };
}

// ─── Clinical PDF Resources (5 real resources) ───────────────────────────────

const PDF_RESOURCES = [
  {
    title: 'Arthritis Foundation Exercise Guide',
    description: 'Comprehensive exercise recommendations for osteoarthritis, including safe movement patterns and intensity guidelines.',
    url: 'https://www.arthritis.org/health-wellness/healthy-living/physical-activity/getting-started/exercise-guide',
    icon: 'menu_book',
  },
  {
    title: 'Versus Arthritis — Joint Protection',
    description: 'Evidence-based joint protection strategies and energy conservation techniques for daily activity management.',
    url: 'https://www.versusarthritis.org/about-arthritis/managing-symptoms/joint-protection/',
    icon: 'shield_with_heart',
  },
  {
    title: 'OrthoInfo — Knee Exercises',
    description: 'AAOS-approved therapeutic knee exercises with illustrated step-by-step guides for safe home rehabilitation.',
    url: 'https://orthoinfo.aaos.org/en/recovery/knee-conditioning-program/',
    icon: 'fitness_center',
  },
  {
    title: 'NHS — Knee Pain Management',
    description: 'National Health Service clinical guidance on managing knee osteoarthritis including self-care and when to seek help.',
    url: 'https://www.nhs.uk/conditions/knee-pain/',
    icon: 'local_hospital',
  },
  {
    title: 'Mayo Clinic — Osteoarthritis Self-Care',
    description: 'Expert overview of osteoarthritis lifestyle management, physical therapy approaches, and pain relief strategies.',
    url: 'https://www.mayoclinic.org/diseases-conditions/osteoarthritis/diagnosis-treatment/drc-20351930',
    icon: 'clinical_notes',
  },
];

// Iron Routine avatar from Mastery Page
const IRON_ROUTINE_AVATAR = 'https://lh3.googleusercontent.com/aida-public/AB6AXuAx7viH_eQuQlt8VYTFSEzCN0qN_IdQoDUxwBrHV_jawoj_eVa-y5P0RjiB9vdzuZx02NvHywIk7axx9AAcNl82zodTuu0sWVu7HyC8GyLKgA5GAure3GxoMYTXy8LpSCwJGPqkghPw7oYnd-NELGcDaUkxqJZJIgU8mRZtldv5tNQdqVJ1kgCSY-0DWJndTDdx_2rn9m9YhtCTIcefNkVl8tzrkmrNxFpSpY2-AvMRQxSB1H4yKkUh01GcN8j3jVBXKlbw9htPFSI';

// ─── Component ───────────────────────────────────────────────────────────────

export default function RoutinePage({ patientKLGrade, onNavigate, userName = 'Guest' }: RoutinePageProps) {
  // ── Video State ──────────────────────────────────────────────────────────────
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [shorts, setShorts] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [loadingShorts, setLoadingShorts] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Timer Modal State ────────────────────────────────────────────────────────
  const [activeModalVideoIdx, setActiveModalVideoIdx] = useState<number | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(300);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [completedVideos, setCompletedVideos] = useState<Set<number>>(new Set());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // ── Mastery/Gamification State ───────────────────────────────────────────────
  const [userXP, setUserXP] = useState(0);
  const [xpAnimating, setXpAnimating] = useState(false);
  const [weeklyLocked, setWeeklyLocked] = useState(false);
  const [daysUntilUnlock, setDaysUntilUnlock] = useState(0);

  // ── Tier System ──────────────────────────────────────────────────────────────
  const TIERS = [
    { name: 'Iron Routine', min: 0 },
    { name: 'Bronze Discipline', min: 1000 },
    { name: 'Silver Momentum', min: 2000 },
    { name: 'Gold Resilience', min: 3000 },
    { name: 'Platinum Mastery', min: 4000 },
  ];
  const currentTier = Math.min(5, TIERS.filter(t => userXP >= t.min).length);
  const tierName = TIERS[currentTier - 1]?.name || 'Iron Routine';
  const xpInTier = userXP % 1000;
  const xpToNextTier = 1000;

  // ── Fetch Real XP + Weekly Lock Check ────────────────────────────────────────
  React.useEffect(() => {
    const fetchXPAndCheckLock = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      // Fetch total XP
      const { data: xpData } = await supabase
        .from('exercise_sessions')
        .select('xp_earned')
        .eq('user_id', session.user.id);
      if (xpData) setUserXP(xpData.reduce((sum, r) => sum + (r.xp_earned || 0), 0));

      // Check if user already completed a video this week
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
      const monday = new Date(now);
      monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      monday.setHours(0, 0, 0, 0);

      const { data: sessionsThisWeek } = await supabase
        .from('exercise_sessions')
        .select('id')
        .eq('user_id', session.user.id)
        .gte('completed_at', monday.toISOString())
        .limit(1);

      if (sessionsThisWeek && sessionsThisWeek.length > 0) {
        setWeeklyLocked(true);
        // Calculate days until next Monday
        const nextMonday = new Date(monday);
        nextMonday.setDate(monday.getDate() + 7);
        const diffDays = Math.ceil((nextMonday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        setDaysUntilUnlock(diffDays);
      }
    };
    fetchXPAndCheckLock();
  }, []);

  // ── Animation Variants ───────────────────────────────────────────────────────
  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  };

  // ── YouTube API Fetch ────────────────────────────────────────────────────────
  const fetchYouTubeVideos = useCallback(async () => {
    const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
    if (!apiKey) {
      setError('YouTube API key is not configured. Please refer to the Clinical PDF Guides below.');
      setLoadingVideos(false);
      setLoadingShorts(false);
      return;
    }
    const query = getClinicalQuery(patientKLGrade);

    try {
      const videoUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=2&q=${encodeURIComponent(query)}&key=${apiKey}`;
      const videoRes = await fetch(videoUrl);
      if (!videoRes.ok) throw new Error(`YouTube API error: ${videoRes.status}`);
      const videoData = await videoRes.json();
      setVideos((videoData.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        channelTitle: item.snippet.channelTitle,
      })));
    } catch (err) {
      console.error('Failed to fetch videos:', err);
      setError('Unable to load video routines at this time. Please refer to the Clinical PDF Guides below.');
    } finally {
      setLoadingVideos(false);
    }

    try {
      const shortsQuery = `${query} #shorts`;
      const shortsUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoDuration=short&maxResults=4&q=${encodeURIComponent(shortsQuery)}&key=${apiKey}`;
      const shortsRes = await fetch(shortsUrl);
      if (!shortsRes.ok) throw new Error(`YouTube API error: ${shortsRes.status}`);
      const shortsData = await shortsRes.json();
      setShorts((shortsData.items || []).map((item: any) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
        channelTitle: item.snippet.channelTitle,
      })));
    } catch (err) {
      console.error('Failed to fetch shorts:', err);
    } finally {
      setLoadingShorts(false);
    }
  }, [patientKLGrade]);

  useEffect(() => { fetchYouTubeVideos(); }, [fetchYouTubeVideos]);

  // ── Audio Helper ─────────────────────────────────────────────────────────────
  const playTickSound = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch { /* fail silently */ }
  }, [isMuted]);

  const playCompletionSound = useCallback(() => {
    if (isMuted) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      // Play a pleasant two-tone chime
      [880, 1100].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.25, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.5);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.5);
      });
    } catch { /* fail silently */ }
  }, [isMuted]);

  // ── Timer Effect ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isTimerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsTimerRunning(false);
            playCompletionSound();
            return 0;
          }
          // Tick sound every 10 seconds
          if ((prev - 1) % 10 === 0 && prev > 1) playTickSound();
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTimerRunning, timerSeconds, playTickSound, playCompletionSound]);

  // ── Timer Modal Handlers ─────────────────────────────────────────────────────
  const openTimerModal = (videoIdx: number) => {
    setActiveModalVideoIdx(videoIdx);
    setTimerSeconds(300);
    setIsTimerRunning(false);
  };

  const closeTimerModal = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setActiveModalVideoIdx(null);
    setTimerSeconds(300);
  };

  const handleStart = () => setIsTimerRunning(true);
  const handleStop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
  };
  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsTimerRunning(false);
    setTimerSeconds(300);
  };

  const handleMarkComplete = async (videoIdx: number) => {
    // ── Guard: prevent duplicate logging ──
    if (completedVideos.has(videoIdx)) return;
    if (weeklyLocked) return; // Already completed this week

    // ── Update local UI state immediately ──
    setCompletedVideos((prev) => new Set(prev).add(videoIdx));
    setXpAnimating(true);
    setUserXP((prev) => prev + 50);
    setTimeout(() => setXpAnimating(false), 800);
    closeTimerModal();
    setWeeklyLocked(true); // Lock after completion

    // ── Persist to backend (streak + adherence + XP) ──
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const video = videos[videoIdx];
        await fetch('http://localhost:8000/api/progress/log-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: session.user.id,
            video_title: video?.title || `Exercise ${videoIdx + 1}`,
            xp_earned: 50,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to log exercise session:', err);
    }
  };

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ── Derived Data ─────────────────────────────────────────────────────────────
  const gradeInfo = getGradeLabel(patientKLGrade);
  const gradeNum = getKLGradeNumber(patientKLGrade);
  const badgeStyle: React.CSSProperties = {
    backgroundColor: gradeNum <= 1 ? 'rgba(16,185,129,0.1)' : gradeNum <= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)',
    color: gradeInfo.color,
    borderColor: gradeNum <= 1 ? 'rgba(16,185,129,0.2)' : gradeNum <= 3 ? 'rgba(245,158,11,0.2)' : 'rgba(239,68,68,0.2)',
  };

  // Current active video for modal context
  const activeVideo = activeModalVideoIdx !== null ? videos[activeModalVideoIdx] : null;
  const exerciseGuide = activeVideo ? getExerciseGuide(activeVideo.title, patientKLGrade) : null;
  const timerProgress = ((300 - timerSeconds) / 300) * 100;

  return (
    <div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">
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
            background-color: rgba(19, 19, 21, 0.85);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.filled {
            font-variation-settings: 'FILL' 1;
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-shimmer {
          background: linear-gradient(90deg, #1b1b1d 25%, #2a2a2e 50%, #1b1b1d 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes xp-flash {
          0% { box-shadow: 0 0 0 0 rgba(255, 109, 41, 0.6); }
          50% { box-shadow: 0 0 20px 4px rgba(255, 109, 41, 0.4); }
          100% { box-shadow: 0 0 0 0 rgba(255, 109, 41, 0); }
        }
        .xp-gain-flash { animation: xp-flash 0.8s ease-out; }
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 15px rgba(255, 109, 41, 0.5); }
          50% { box-shadow: 0 0 25px rgba(255, 109, 41, 0.7); }
        }
        .glow-active { animation: glow-pulse 1.5s ease-in-out infinite; }
        @keyframes timer-ring-pulse {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255, 109, 41, 0.4)); }
          50% { filter: drop-shadow(0 0 14px rgba(255, 109, 41, 0.7)); }
        }
        .timer-ring-glow { animation: timer-ring-pulse 2s ease-in-out infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #131315; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #555; }
      `}</style>
      
      {/* Side Navigation Shell */}
      <aside className="flex flex-col h-full py-8 px-4 gap-2 fixed left-0 top-0 z-50 bg-[#0A0A0C] border-r border-white/5 hidden md:flex w-64">
        <div className="px-4 mb-8 mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">SteadyGerak</h1>
          <p className="text-xs tracking-widest text-gray-500 uppercase mt-1 font-semibold">Clinical Rehab</p>
        </div>
        <nav className="flex flex-col gap-2">
          <button onClick={() => onNavigate('action_dashboard')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">dashboard</span>
            <span className="text-sm font-medium">Main Dashboard</span>
          </button>
          <button className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 transition-all shadow-[0_0_15px_rgba(255,109,41,0.1)] w-full text-left">
            <span className="material-symbols-outlined filled">event_repeat</span>
            <span className="text-sm">Routine</span>
          </button>
          <button onClick={() => onNavigate('mastery')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">insights</span>
            <span className="text-sm font-medium">Mastery & Progress</span>
          </button>
          <button onClick={() => onNavigate('care_network')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">groups_2</span>
            <span className="text-sm font-medium">Care Network</span>
          </button>
          <button onClick={() => onNavigate('diagnostics')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">biotech</span>
            <span className="text-sm font-medium">Diagnostics</span>
          </button>
          <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg mt-auto mb-4 w-full text-left">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm font-medium">Profile & Biometrics</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 flex flex-col overflow-x-hidden">
        {/* Top Navigation Bar */}
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
        <div className="p-4 md:p-10 max-w-7xl mx-auto w-full space-y-8 flex-grow">
          
          {/* Page Header */}
          <motion.section initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-3">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Weekly Clinical Routine</h2>
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs font-bold px-3 py-1.5 rounded-full tracking-wider uppercase border" style={badgeStyle}>
                Current Diagnosis: {gradeInfo.label}
              </span>
              <span className="text-sm text-gray-400 font-medium">{getRoutineDescription(patientKLGrade)}</span>
            </div>
          </motion.section>

          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
            
            {/* ═══ Featured Exercise Videos ═══ */}
            <motion.section variants={itemVariants} className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#FF6D29]">play_circle</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Featured Exercises</h3>
                </div>
                <span className="text-[10px] text-[#FF6D29] font-bold tracking-[0.2em] uppercase">AI-Curated Videos</span>
              </div>

              {/* Error State */}
              {error && !loadingVideos && videos.length === 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bento-card p-6 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#EF4444]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[#EF4444]">cloud_off</span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white mb-1">Video Content Unavailable</p>
                    <p className="text-sm text-gray-400">{error}</p>
                  </div>
                </motion.div>
              )}

              {/* Loading Skeletons */}
              {loadingVideos && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[0, 1].map((i) => (
                    <div key={i} className="bento-card overflow-hidden">
                      <div className="aspect-video skeleton-shimmer rounded-t-xl" />
                      <div className="p-5 space-y-3">
                        <div className="h-4 skeleton-shimmer rounded w-3/4" />
                        <div className="h-3 skeleton-shimmer rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Rendered Videos — BOTH have Start Session */}
              {!loadingVideos && videos.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {videos.map((video, idx) => (
                    <motion.div
                      key={video.id}
                      whileHover={{ y: -4 }}
                      className={`bento-card overflow-hidden group cursor-pointer transition-all duration-500 ${
                        completedVideos.has(idx) ? 'border-emerald-500/50' : ''
                      }`}
                    >
                      <div className="aspect-video rounded-t-xl overflow-hidden border-b border-[#424754]/30">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.id}?rel=0`}
                          title={video.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                      <div className="p-5 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex flex-col gap-1">
                            <h4 className="text-sm font-bold text-white line-clamp-2 leading-snug group-hover:text-[#FF6D29] transition-colors">
                              {video.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                            </h4>
                            <div className="flex items-center gap-2">
                              <span className="material-symbols-outlined text-gray-500 text-[14px]">account_circle</span>
                              <span className="text-xs text-gray-400">{video.channelTitle}</span>
                            </div>
                          </div>
                          {completedVideos.has(idx) && (
                            <div className="shrink-0 w-7 h-7 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <span className="material-symbols-outlined filled text-emerald-400 text-[16px]">check_circle</span>
                            </div>
                          )}
                        </div>

                        {/* Start Session / Completed state */}
                        <div className="pt-2 border-t border-white/5">
                          {!completedVideos.has(idx) ? (
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              onClick={() => openTimerModal(idx)}
                              className="w-full py-3 bg-[#FF6D29] hover:bg-[#FF8D59] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-[0_0_20px_rgba(255,109,41,0.3)]"
                            >
                              <span className="material-symbols-outlined filled text-[18px]">play_arrow</span>
                              Start Session (5 Mins)
                            </motion.button>
                          ) : (
                            <div className="w-full py-3 bg-emerald-500/10 text-emerald-400 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/30">
                              <span className="material-symbols-outlined filled text-[18px]">verified</span>
                              Session Logged & Verified
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

            {/* ═══ Quick Form Checks — Shorts/Reels ═══ */}
            <motion.section variants={itemVariants} className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#A855F7]">slow_motion_video</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Quick Form Checks</h3>
                </div>
                <span className="text-[10px] text-[#A855F7] font-bold tracking-[0.2em] uppercase">Shorts & Reels</span>
              </div>

              {loadingShorts && (
                <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="shrink-0 w-40 h-72 rounded-xl skeleton-shimmer" />
                  ))}
                </div>
              )}

              {!loadingShorts && shorts.length > 0 && (
                <div className="flex overflow-x-auto space-x-4 pb-2 scrollbar-hide">
                  {shorts.map((short) => (
                    <motion.div key={short.id} whileHover={{ y: -4, scale: 1.02 }} className="shrink-0 w-40 h-72 rounded-xl overflow-hidden border border-[#424754]/30 relative group cursor-pointer bg-[#1b1b1d]">
                      <iframe src={`https://www.youtube.com/embed/${short.id}?rel=0`} title={short.title} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-3 pointer-events-none">
                        <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">
                          {short.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-1">{short.channelTitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {!loadingShorts && shorts.length === 0 && !error && (
                <div className="bento-card p-5 flex items-center gap-3">
                  <span className="material-symbols-outlined text-gray-500">videocam_off</span>
                  <p className="text-sm text-gray-400">No short-form content available for the current clinical query.</p>
                </div>
              )}
            </motion.section>

            {/* ═══ Recovery Mastery — SDT Widget with Iron Routine Avatar ═══ */}
            <motion.section variants={itemVariants}>
              <div className={`bento-card p-6 md:p-8 relative ${xpAnimating ? 'xp-gain-flash' : ''}`}>
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FF6D29]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
                  {/* Left: Iron Routine Avatar + Title */}
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#FF6D29]/30 shadow-[0_0_15px_rgba(255,109,41,0.15)]">
                      <img src={IRON_ROUTINE_AVATAR} alt="Iron Routine Badge" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-white tracking-tight">Recovery Mastery</h4>
                      <p className="text-xs text-[#A855F7] font-bold tracking-widest uppercase mt-0.5">Tier {currentTier}: {tierName}</p>
                    </div>
                  </div>

                  {/* Right: XP Bar */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-white font-mono">{xpInTier}</span>
                        <span className="text-sm text-gray-400">/ {xpToNextTier} XP</span>
                      </div>
                      <span className="text-xs text-gray-500 font-medium">{currentTier < 5 ? `to unlock Tier ${currentTier + 1}` : 'Max tier reached'}</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF6D29] to-[#A855F7]"
                        initial={{ width: '0%' }}
                        animate={{ width: `${Math.min((xpInTier / xpToNextTier) * 100, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        style={{ boxShadow: '0 0 12px rgba(255, 109, 41, 0.4)' }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                      <span>Beginner</span>
                      <span className={xpInTier >= 250 ? 'text-[#FF6D29]' : ''}>250 XP</span>
                      <span className={xpInTier >= 500 ? 'text-[#A855F7]' : ''}>500 XP</span>
                      <span className={xpInTier >= 750 ? 'text-emerald-400' : ''}>750 XP</span>
                    </div>

                    {/* Tier Roadmap — hover to reveal */}
                    <div className="group relative mt-2">
                      <div className="flex items-center gap-1 cursor-default text-[10px] text-gray-500 hover:text-gray-300 transition-colors">
                        <span className="material-symbols-outlined text-[12px]">info</span>
                        <span>Hover to see tier progression</span>
                      </div>
                      <div className="absolute top-full left-0 mt-2 w-72 bg-[#0d0d0f] border border-[#424754]/40 rounded-xl p-3 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                        <p className="text-[10px] text-gray-400 font-semibold mb-2 uppercase tracking-wider">Tier Progression (50 XP per exercise)</p>
                        <div className="space-y-1.5">
                          {TIERS.map((t, i) => (
                            <div key={t.name} className={`flex items-center justify-between text-[10px] px-2 py-1 rounded ${i + 1 === currentTier ? 'bg-[#FF6D29]/10 border border-[#FF6D29]/20' : ''}`}>
                              <span className={i + 1 <= currentTier ? 'text-white font-semibold' : 'text-gray-500'}>Tier {i + 1}: {t.name}</span>
                              <span className={i + 1 <= currentTier ? 'text-[#FF6D29] font-mono' : 'text-gray-600 font-mono'}>{t.min}+ XP</span>
                            </div>
                          ))}
                        </div>
                        <p className="text-[9px] text-gray-600 mt-2 border-t border-[#424754]/20 pt-2">Complete 1 exercise per week to earn 50 XP. Total XP: {userXP}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* XP Gain Toast */}
                {xpAnimating && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="absolute top-4 right-4 bg-[#FF6D29] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    +50 XP ✨
                  </motion.div>
                )}
              </div>
            </motion.section>

            {/* ═══ Clinical Reference Guides (5 resources) ═══ */}
            <motion.section variants={itemVariants} className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#10B981]">library_books</span>
                  <h3 className="text-xl font-bold text-white tracking-tight">Clinical Reference Guides</h3>
                </div>
                <span className="text-[10px] text-[#10B981] font-bold tracking-[0.2em] uppercase">Recommended Resources</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PDF_RESOURCES.map((resource) => (
                  <motion.a
                    key={resource.title}
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ y: -2, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="bg-[#1b1b1d] p-4 rounded-xl border border-[#424754]/30 flex items-center gap-4 group hover:border-[#FF6D29]/40 transition-all cursor-pointer"
                  >
                    <div className="w-11 h-11 rounded-xl bg-[#FF6D29]/10 flex items-center justify-center shrink-0 group-hover:bg-[#FF6D29]/20 transition-colors">
                      <span className="material-symbols-outlined text-[#FF6D29] text-[22px]">{resource.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FF6D29] transition-colors leading-tight">{resource.title}</h4>
                      <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 leading-relaxed">{resource.description}</p>
                    </div>
                    <div className="shrink-0 opacity-50 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[#FF6D29] text-[18px]">open_in_new</span>
                    </div>
                  </motion.a>
                ))}
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
          <button className="flex flex-col items-center gap-1 text-[#FF6D29]">
            <span className="material-symbols-outlined filled">event_repeat</span>
            <span className="text-[10px] font-bold">Routine</span>
          </button>
          <button onClick={() => onNavigate('mastery')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">leaderboard</span>
            <span className="text-[10px] font-medium">Data</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">person</span>
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      </main>

      {/* ═══ TIMER MODAL — Rendered via Portal to document.body ═══ */}
      {createPortal(
        <AnimatePresence>
          {activeModalVideoIdx !== null && activeVideo && exerciseGuide && (
            <motion.div
              key="timer-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999 }}
              className="flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
              onClick={closeTimerModal}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                onClick={(e) => e.stopPropagation()}
                style={{ width: '100%', maxWidth: '28rem', minWidth: '320px' }}
                className="bg-[#1b1b1d] border border-[#424754]/50 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center"
              >
                {/* Session Header */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="material-symbols-outlined text-[#FF6D29] text-[20px]">timer</span>
                  <h3 className="text-base font-bold text-white">Exercise Session</h3>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-6 max-w-[90%] truncate">
                  {activeVideo.title.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")}
                </p>

                {/* Circular Timer */}
                <div className={`relative mb-4 ${isTimerRunning ? 'timer-ring-glow' : ''}`} style={{ width: '192px', height: '192px' }}>
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                    <circle cx="100" cy="100" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                    <circle
                      cx="100" cy="100" r="85" fill="none"
                      stroke={timerSeconds === 0 ? '#10B981' : '#FF6D29'}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 85}
                      strokeDashoffset={2 * Math.PI * 85 * (1 - timerProgress / 100)}
                      className="transition-all duration-500 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-6xl font-bold tracking-widest mb-2 font-mono ${timerSeconds === 0 ? 'text-emerald-400' : 'text-white'}`}>
                      {formatTime(timerSeconds)}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">
                      {timerSeconds === 0 ? 'Complete!' : isTimerRunning ? 'In Progress' : 'Ready'}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-4 rounded-full mt-6 mb-8 overflow-hidden" style={{ backgroundColor: '#2a2a2e' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${timerProgress}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: timerSeconds === 0 ? '#10B981' : '#FF6D29' }}
                  />
                </div>

                {/* Sets & Reps */}
                <div className="w-full grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                    <span className="text-lg font-bold text-[#FF6D29] font-mono">{exerciseGuide.sets}</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">Sets</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                    <span className="text-sm font-bold text-white">{exerciseGuide.reps}</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">Per Set</p>
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl p-3 text-center">
                    <span className="text-lg font-bold text-[#A855F7] font-mono">{exerciseGuide.restSeconds}s</span>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mt-0.5">Rest</p>
                  </div>
                </div>

                {/* Control Buttons */}
                <div className="flex items-center gap-3 w-full justify-center mb-6">
                  {timerSeconds > 0 && !isTimerRunning && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleStart}
                      className="px-6 py-2.5 bg-[#FF6D29] hover:bg-[#FF8D59] text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(255,109,41,0.3)]"
                    >
                      <span className="material-symbols-outlined filled text-[18px]">play_arrow</span>
                      Start
                    </motion.button>
                  )}
                  {isTimerRunning && (
                    <motion.button
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={handleStop}
                      className="px-6 py-2.5 bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">pause</span>
                      Pause
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={handleReset}
                    className="px-6 py-2.5 bg-white/5 text-gray-400 hover:text-white border border-white/10 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">refresh</span>
                    Reset
                  </motion.button>
                </div>

                {/* Complete Button */}
                {timerSeconds === 0 ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    onClick={() => handleMarkComplete(activeModalVideoIdx!)}
                    className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-[#FF6D29] hover:bg-[#FF8D59] text-white glow-active flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined filled text-[20px]">check_circle</span>
                    Mark as Complete (+50 XP)
                  </motion.button>
                ) : (
                  <button disabled className="w-full py-4 rounded-xl font-bold text-lg transition-all bg-white/5 text-gray-500 opacity-50 cursor-not-allowed border border-white/10 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-[20px]">lock_clock</span>
                    Complete — Finish Timer First
                  </button>
                )}

                {/* Cancel Session */}
                <button
                  onClick={closeTimerModal}
                  className="text-sm text-gray-400 hover:text-white mt-4 cursor-pointer transition-colors"
                >
                  Cancel Session
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
