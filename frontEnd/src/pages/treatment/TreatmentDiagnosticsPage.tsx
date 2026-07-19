import React, { useState } from 'react';
import { motion } from 'framer-motion';

import GeometricBackground from '../../components/ui/geometric';
import type { DiagnosticData } from '../diagnostics/DiagnosticResults';
import DiagnosticsUploadGuidelinesModal from '../diagnostics/DiagnosticsUploadGuidelinesModal';
import FollowUpResults from '../diagnostics/FollowUpResults';

interface TreatmentDiagnosticsPageProps {
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'diagnostics' | 'profile') => void;
  userStreak?: number;
  completedCheckInWeeks?: number;
  previousResult?: DiagnosticData | null;
  onNewResult?: (result: DiagnosticData) => void;
  userName?: string;
}

export default function TreatmentDiagnosticsPage({ onNavigate, userStreak: _userStreak = 0, completedCheckInWeeks = 0, previousResult, onNewResult, userName = 'Guest' }: TreatmentDiagnosticsPageProps) {
  // Cycle-based eligibility: user needs 12 weekly check-ins since their last follow-up scan.
  // If no follow-up exists, falls back to total check-ins >= 12.
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkInsSinceScan, setCheckInsSinceScan] = useState(0);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(0);
  const [lastScanWeek, setLastScanWeek] = useState(0); // 0 means no follow-up yet
  const [nextUnlockWeek, setNextUnlockWeek] = useState(12);
  const [isLoadingEligibility, setIsLoadingEligibility] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [comparisonResult, setComparisonResult] = useState<DiagnosticData | null>(null);
  const [showWrongImageModal, setShowWrongImageModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [showFullResults, setShowFullResults] = useState(false);
  const [baselineScan, setBaselineScan] = useState<DiagnosticData | null>(previousResult || null);
  const [pendingComparisonResult, setPendingComparisonResult] = useState<DiagnosticData | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null); // Keep file for confirm phase

  // ─── Eligibility Resolution: 12 check-ins since last follow-up scan ─────────
  React.useEffect(() => {
    const resolveEligibility = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setIsUnlocked(false);
          setIsLoadingEligibility(false);
          return;
        }

        // Get the most recent follow-up scan date
        const res = await fetch(`http://localhost:8000/scan-history/${session.user.id}`);
        let lastFollowUpWeek = 0; // 0 means no follow-up exists yet

        if (res.ok) {
          const { scans } = await res.json();
          const followUps = scans.filter((s: any) => s.scanType === 'followup');
          if (followUps.length > 0) {
            // Most recent follow-up (scans are ordered by scan_date DESC)
            const latestFollowUp = followUps[0];
            // Find which check_in_week_number corresponds to this scan date
            // by finding the highest week number with a date <= scan date
            const { data: weekData } = await supabase
              .from('weekly_checkins')
              .select('check_in_week_number')
              .eq('user_id', session.user.id)
              .lte('week_start_date', latestFollowUp.scanDate)
              .order('check_in_week_number', { ascending: false })
              .limit(1);
            
            if (weekData && weekData.length > 0) {
              lastFollowUpWeek = weekData[0].check_in_week_number;
            }
          }
        }

        // Count check-ins completed AFTER the last follow-up scan week
        const { count } = await supabase
          .from('weekly_checkins')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gt('check_in_week_number', lastFollowUpWeek);

        // Get the user's current week (highest check_in_week_number)
        const { data: latestWeekData } = await supabase
          .from('weekly_checkins')
          .select('check_in_week_number')
          .eq('user_id', session.user.id)
          .order('check_in_week_number', { ascending: false })
          .limit(1);

        const currentWk = latestWeekData?.[0]?.check_in_week_number ?? completedCheckInWeeks;
        setCurrentWeekNumber(currentWk);
        setLastScanWeek(lastFollowUpWeek);
        setNextUnlockWeek(lastFollowUpWeek + 12);

        const sinceLastScan = count ?? 0;
        setCheckInsSinceScan(sinceLastScan);
        setIsUnlocked(sinceLastScan >= 12);
      } catch (err) {
        console.error('Failed to resolve diagnostics eligibility:', err);
        // Fallback to the prop-based check
        setCheckInsSinceScan(completedCheckInWeeks);
        setIsUnlocked(completedCheckInWeeks >= 12);
      } finally {
        setIsLoadingEligibility(false);
      }
    };
    resolveEligibility();
  }, [completedCheckInWeeks]);

  // ─── Realtime: re-check eligibility when a new check-in is inserted ─────────
  React.useEffect(() => {
    let channel: any = null;
    const setupRealtime = async () => {
      const { supabase } = await import('../../lib/supabase');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      channel = supabase
        .channel('checkin-updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'weekly_checkins',
            filter: `user_id=eq.${session.user.id}`,
          },
          () => {
            // Re-fetch the check-in count when a new one is added
            const refetch = async () => {
              const { count } = await supabase
                .from('weekly_checkins')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', session.user.id)
                .gt('check_in_week_number', lastScanWeek);
              
              const newCount = count ?? 0;
              setCheckInsSinceScan(newCount);
              setIsUnlocked(newCount >= 12);
            };
            refetch();
          }
        )
        .subscribe();
    };
    setupRealtime();

    return () => {
      if (channel) {
        import('../../lib/supabase').then(({ supabase }) => {
          supabase.removeChannel(channel);
        });
      }
    };
  }, [lastScanWeek]);

  // Fetch baseline scan from scan_history on mount
  React.useEffect(() => {
    if (!isUnlocked) return;
    const fetchBaseline = async () => {
      try {
        const { supabase } = await import('../../lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        
        const res = await fetch(`http://localhost:8000/scan-history/${session.user.id}`);
        if (!res.ok) return;
        const { scans } = await res.json();
        
        // Find the most recent baseline scan
        const baseline = scans.find((s: any) => s.scanType === 'baseline');
        if (baseline) {
          const grades = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
          let dist = [];
          try { dist = JSON.parse(baseline.probabilityDistribution || '[]'); } catch {}
          
          setBaselineScan({
            originalImageUrl: baseline.xrayImageUrl || '',
            gradCamUrl: baseline.gradcamImageUrl || '',
            severityGrade: grades[baseline.klGrade] || 'Moderate',
            topConfidence: baseline.confidenceScore || 0,
            confidenceDistribution: dist,
          });
        }
      } catch (err) {
        console.error('Failed to fetch scan history:', err);
      }
    };
    fetchBaseline();
  }, [isUnlocked]);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    setUploadError('');
    setUploadedFile(file); // Store file for confirm phase
    
    // Capture previous data snapshot before any changes
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Get user_id for follow-up column update
    const { supabase } = await import('../../lib/supabase');
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      formData.append('user_id', session.user.id);
    }
    
    try {
      // Use /predict/followup endpoint - saves to followup columns, NOT overwriting baseline
      const res = await fetch('http://localhost:8000/predict/followup', { method: 'POST', body: formData });
      const data = await res.json();
      
      if (!res.ok) {
        if (data.error === 'not_knee_xray') {
          setShowWrongImageModal(true);
          setUploadError(data.message);
        } else {
          setUploadError(data.error || 'Upload failed');
        }
        setUploading(false);
        return;
      }
      
      const result: DiagnosticData = {
        originalImageUrl: data.originalImageUrl,
        gradCamUrl: data.gradCamUrl,
        severityGrade: data.severityGrade,
        topConfidence: data.topConfidence,
        confidenceDistribution: data.confidenceDistribution,
      };
      
      setComparisonResult(result);
      setPendingComparisonResult(result);
      setShowFullResults(true);
      
      // If baseline wasn't loaded yet, fetch it now
      if (!baselineScan && session?.user) {
        try {
          const histRes = await fetch(`http://localhost:8000/scan-history/${session.user.id}`);
          if (histRes.ok) {
            const { scans } = await histRes.json();
            const baseline = scans.find((s: any) => s.scanType === 'baseline');
            if (baseline) {
              const grades = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
              let dist: any[] = [];
              try { dist = JSON.parse(baseline.probabilityDistribution || '[]'); } catch {}
              setBaselineScan({
                originalImageUrl: baseline.xrayImageUrl || '',
                gradCamUrl: baseline.gradcamImageUrl || '',
                severityGrade: grades[baseline.klGrade] || 'Moderate',
                topConfidence: baseline.confidenceScore || 0,
                confidenceDistribution: dist,
              });
            }
          }
        } catch {}
      }
      
    } catch (err) {
      setUploadError('Connection error. Is the backend running?');
    }
    setUploading(false);
  };

  // Show nothing while eligibility is being resolved
  if (isLoadingEligibility) {
    return <div className="min-h-screen bg-[#0A0A0C]" />;
  }

  return (
    <>
    {showFullResults && comparisonResult && baselineScan ? (
      <FollowUpResults
        previousData={{
          originalImageUrl: baselineScan.originalImageUrl || '',
          gradCamUrl: baselineScan.gradCamUrl || '',
          severityGrade: baselineScan.severityGrade,
          topConfidence: baselineScan.topConfidence,
          confidenceDistribution: baselineScan.confidenceDistribution,
        }}
        newData={{
          originalImageUrl: comparisonResult.originalImageUrl || '',
          gradCamUrl: comparisonResult.gradCamUrl || '',
          severityGrade: comparisonResult.severityGrade,
          topConfidence: comparisonResult.topConfidence,
          confidenceDistribution: comparisonResult.confidenceDistribution,
        }}
        onBack={() => setShowConfirmModal(true)}
        onConfirm={() => setShowConfirmModal(true)}
      />
    ) : showFullResults && comparisonResult && !baselineScan ? (
      <div className="min-h-screen bg-[#0A0A0C] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-[#FF6D29]/30 border-t-[#FF6D29] animate-spin mx-auto" />
          <p className="text-sm text-gray-400">Loading baseline scan data...</p>
          <button onClick={() => { setShowFullResults(false); setComparisonResult(null); }} className="text-xs text-[#FF6D29] underline">Cancel</button>
        </div>
      </div>
    ) : (
    <div className="font-sans antialiased text-gray-200 selection:bg-[#FF6D29] selection:text-white min-h-screen relative w-full overflow-hidden">
      
      {/* Geometric Shape Background */}
      <GeometricBackground />

      <style>{`
        .glass-nav {
          background: rgba(10, 10, 12, 0.65);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
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
          <button onClick={() => onNavigate('routine')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">event_repeat</span>
            <span className="text-sm font-medium">Routine</span>
          </button>
          <button onClick={() => onNavigate('mastery')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">insights</span>
            <span className="text-sm font-medium">Mastery & Progress</span>
          </button>
          <button onClick={() => onNavigate('care_network')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">groups_2</span>
            <span className="text-sm font-medium">Care Network</span>
          </button>
          <button className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 transition-all shadow-[0_0_15px_rgba(255,109,41,0.1)] w-full text-left">
            <span className="material-symbols-outlined filled">biotech</span>
            <span className="text-sm">Diagnostics</span>
          </button>
          <button onClick={() => onNavigate('profile')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg mt-auto mb-4 w-full text-left">
            <span className="material-symbols-outlined">account_circle</span>
            <span className="text-sm font-medium">Profile & Biometrics</span>
          </button>
        </nav>
      </aside>

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen pb-20 md:pb-0 flex flex-col overflow-x-hidden relative z-10">
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

        {/* Content Area */}
        <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center">
          
          <motion.header
            className="w-full mb-12 flex flex-col items-center relative"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {isUnlocked && (
              <span className="inline-block text-[11px] font-bold text-[#22c55e] bg-[#22c55e]/10 px-4 py-1.5 rounded-full mb-4 border border-[#22c55e]/20">{checkInsSinceScan}-Week Cycle Complete</span>
            )}
            <h1 className="text-4xl md:text-5xl font-bold text-white mt-1 text-center tracking-tight">
              Follow-up Diagnostics
            </h1>
            <p className="text-lg text-gray-400 mt-4 text-center max-w-3xl">
              Upload new radiographic imaging to track cartilage density changes over your rehabilitation timeline.
            </p>
            {isUnlocked && (
              <button 
                onClick={() => setShowGuidelines(true)}
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FF6D29] bg-[#FF6D29]/10 px-6 py-3 rounded-xl border border-[#FF6D29]/30 hover:bg-[#FF6D29]/20 hover:border-[#FF6D29]/50 transition-all shadow-[0_0_15px_rgba(255,109,41,0.1)]"
              >
                <span className="material-symbols-outlined text-[18px]">menu_book</span>
                View Upload Guidelines
              </button>
            )}
          </motion.header>

          {!isUnlocked ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="glass-panel border border-[#FF6D29]/20 rounded-3xl p-8 md:p-10 max-w-3xl w-full mx-4 text-center space-y-7 shadow-[0_10px_40px_rgba(0,0,0,0.6),0_0_30px_rgba(255,109,41,0.15)]"
          >
            {/* Stylized Unlock Avatar - Key & Lock in Shield Badge */}
            <div className="w-24 h-24 mx-auto mb-3 relative flex items-center justify-center">
              {/* Shield/Badge Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF6D29]/20 to-[#C2410C]/20 rounded-full border-2 border-[#FF6D29]/40 shadow-[0_0_25px_rgba(255,109,41,0.4)]"></div>
              
              {/* Key & Lock Icon Composition */}
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-[#FF6D29] text-[48px] drop-shadow-[0_0_8px_rgba(255,109,41,0.8)]">
                  key
                </span>
                {/* Lock Sub-Badge */}
                <div className="absolute bottom-0 right-0 bg-[#0A0A0C] rounded-full p-1.5 border border-[#FF6D29]/40 shadow-[0_0_10px_rgba(255,109,41,0.3)] flex items-center justify-center z-20">
                  <span className="material-symbols-outlined text-[#FF8D59] text-[20px] drop-shadow-[0_0_6px_rgba(255,109,41,0.6)]">
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
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight mb-3">
                Diagnostics Locked
              </h3>
              <div className="w-20 h-1.5 bg-gradient-to-r from-transparent via-[#FF6D29] to-transparent mx-auto rounded-full"></div>
            </div>

            {/* Clean, Multi-Paragraph Description */}
            <div className="text-base md:text-lg text-gray-300 leading-relaxed max-w-2xl mx-auto">
              <p>
                {lastScanWeek > 0 ? (
                  <>You're currently in <span className="text-[#FF6D29] font-bold">Week {currentWeekNumber}</span>. Your last follow-up scan was at Week {lastScanWeek}. You need <span className="text-[#FF6D29] font-bold">12 weekly check-ins</span> after your last scan before you can upload a new follow-up X-ray — your next scan unlocks at <span className="text-[#FF6D29] font-bold">Week {nextUnlockWeek}</span>.</>
                ) : (
                  <>You're currently in <span className="text-[#FF6D29] font-bold">Week {currentWeekNumber}</span>. You need at least <span className="text-[#FF6D29] font-bold">12 weekly check-ins</span> before you can upload follow-up X-ray images for comparative AI analysis.</>
                )}
              </p>
              <p className="text-sm text-gray-400 italic pt-5 mt-5 border-t border-white/5">
                {lastScanWeek > 0
                  ? `${checkInsSinceScan} of 12 check-ins completed since your Week ${lastScanWeek} scan. ${12 - checkInsSinceScan} more to go.`
                  : `${checkInsSinceScan} of 12 check-ins completed. ${12 - checkInsSinceScan} more needed to unlock.`}
              </p>
            </div>

            {/* Primary Call-to-Action Button */}
            <motion.button 
              disabled={true}
              className="bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] opacity-50 cursor-not-allowed text-white font-bold px-10 py-4 rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.4)] w-full text-base md:text-lg flex items-center justify-center gap-3 pointer-events-none"
            >
              <span className="material-symbols-outlined text-xl">
                biotech
              </span>
              Start AI Analysis
            </motion.button>

            {/* Progress Indicator */}
            <div className="pt-2 flex items-center justify-center gap-2 text-sm text-gray-500">
              <span className="material-symbols-outlined text-base">schedule</span>
              <span>Week {currentWeekNumber} — {checkInsSinceScan} of 12 check-ins completed</span>
            </div>
          </motion.div>
          ) : (
          /* ═══ UNLOCKED: Re-upload Flow ═══ */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl w-full mx-4 space-y-6"
          >
            {/* Upload area */}
            {!comparisonResult ? (
              <div className="bg-[#131315] border-2 border-dashed border-[#FF6D29]/30 rounded-2xl p-8 text-center hover:border-[#FF6D29]/60 transition-all cursor-pointer relative"
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFileUpload(f); }}
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleFileUpload(f); }; input.click(); }}
              >
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-[#FF6D29]/30 border-t-[#FF6D29] animate-spin" />
                    <span className="text-sm text-gray-400">Analyzing X-ray with AI...</span>
                  </div>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[48px] text-[#FF6D29]/60 mb-3">upload_file</span>
                    <p className="text-white font-semibold">Drop your follow-up X-ray here or click to upload</p>
                    <p className="text-xs text-gray-500 mt-2">Supports JPG, PNG. The system will verify it is a knee X-ray.</p>
                  </>
                )}
              </div>
            ) : (
              /* ═══ Comparison Results ═══ */
              <div className="space-y-6">
                {/* Side-by-side images */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-[#131315] border border-[#424754]/30 rounded-xl p-4">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Previous Scan</span>
                    {previousResult?.originalImageUrl ? (
                      <img src={previousResult.originalImageUrl} alt="Previous X-ray" className="w-full h-48 object-contain rounded-lg bg-black/50" />
                    ) : (
                      <div className="w-full h-48 bg-black/50 rounded-lg flex items-center justify-center text-xs text-gray-500">No previous image</div>
                    )}
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Grade:</span>
                      <span className="text-sm font-bold text-white">{previousResult?.severityGrade || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="bg-[#131315] border border-[#22c55e]/30 rounded-xl p-4">
                    <span className="text-[10px] font-semibold text-[#22c55e] uppercase tracking-wider mb-2 block">New Scan (Today)</span>
                    <img src={comparisonResult.originalImageUrl} alt="New X-ray" className="w-full h-48 object-contain rounded-lg bg-black/50" />
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-xs text-gray-400">Grade:</span>
                      <span className="text-sm font-bold text-white">{comparisonResult.severityGrade}</span>
                    </div>
                  </div>
                </div>

                {/* Comparison Analysis */}
                <div className="bg-[#0d0d0f] border border-green-500/20 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-green-400 text-[18px]">psychology</span>
                    <span className="text-sm font-semibold text-green-400">AI Comparative Analysis</span>
                  </div>
                  {(() => {
                    const grades = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
                    const prevIdx = grades.indexOf(previousResult?.severityGrade || 'Moderate');
                    const newIdx = grades.indexOf(comparisonResult.severityGrade);
                    const diff = prevIdx - newIdx;
                    
                    if (diff > 0) {
                      return <p className="text-sm text-gray-300 leading-relaxed">Your new scan shows a <span className="text-[#22c55e] font-bold">positive improvement</span> — grading has decreased from <span className="text-white font-semibold">{previousResult?.severityGrade}</span> to <span className="text-[#22c55e] font-semibold">{comparisonResult.severityGrade}</span> ({diff} grade{diff > 1 ? 's' : ''} better). This suggests your rehabilitation programme is having a measurable structural impact. Continue your current protocol.</p>;
                    } else if (diff === 0) {
                      return <p className="text-sm text-gray-300 leading-relaxed">Your new scan shows <span className="text-[#FFD166] font-bold">stable condition</span> — grading remains at <span className="text-white font-semibold">{comparisonResult.severityGrade}</span>. This is not uncommon at 12 weeks, as structural changes take time. The positive sign is that there is no progression. Continue your physiotherapy programme for continued stabilization.</p>;
                    } else {
                      return <p className="text-sm text-gray-300 leading-relaxed">Your new scan shows a <span className="text-[#EF476F] font-bold">slight progression</span> — grading has changed from <span className="text-white font-semibold">{previousResult?.severityGrade}</span> to <span className="text-[#EF476F] font-semibold">{comparisonResult.severityGrade}</span>. This does not necessarily indicate treatment failure — factors like imaging angle, positioning, and natural variability can affect readings. Discuss with your healthcare provider for a comprehensive assessment.</p>;
                    }
                  })()}
                </div>

                {/* Reset button */}
                <button
                  onClick={() => setComparisonResult(null)}
                  className="w-full bg-white/5 border border-white/10 text-gray-300 font-medium px-6 py-3 rounded-xl hover:bg-white/10 transition-all text-sm"
                >
                  Upload Another Scan
                </button>
              </div>
            )}

            {/* Error messages */}
            {uploadError && !showWrongImageModal && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                <p className="text-sm text-red-300">{uploadError}</p>
              </div>
            )}

            {/* Wrong image modal */}
            {showWrongImageModal && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 text-center">
                <span className="material-symbols-outlined text-red-400 text-[32px] mb-2">warning</span>
                <h4 className="text-white font-bold mb-2">Invalid Image Detected</h4>
                <p className="text-sm text-red-300 mb-4">The system determined this is not a knee X-ray image. Please upload a valid knee radiograph.</p>
                <button onClick={() => { setShowWrongImageModal(false); setUploadError(''); }} className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-2 rounded-lg text-sm hover:bg-red-500/30 transition-all">
                  Try Again
                </button>
              </div>
            )}

            {/* Quick guide */}
            <div className="bg-[#131315] border border-[#424754]/20 rounded-xl p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[#FF6D29] text-[16px]">help_outline</span>
                <span className="text-[12px] font-semibold text-white">Upload Guidelines</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-center sm:items-start gap-3 sm:gap-12 text-[11px] text-gray-400">
                {/* Left Column - Left Aligned */}
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex gap-2 items-start"><span className="text-[#FF6D29] mt-0.5">•</span><span>Upload a standard AP knee X-ray image</span></div>
                  <div className="flex gap-2 items-start"><span className="text-[#FF6D29] mt-0.5">•</span><span>AI verifies it's a valid knee image first</span></div>
                </div>
                {/* Right Column - Right Aligned */}
                <div className="flex flex-col gap-2 text-right">
                  <div className="flex gap-2 items-start justify-end"><span>Predicts KL grade & compares with previous</span><span className="text-[#FF6D29] mt-0.5">•</span></div>
                  <div className="flex gap-2 items-start justify-end"><span>Supported: JPG, PNG (max 10MB)</span><span className="text-[#FF6D29] mt-0.5">•</span></div>
                </div>
              </div>
            </div>
          </motion.div>
          )}
        </div>

        {/* Bottom Navigation Bar (Mobile Only) */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 glass-nav border-t border-white/10 flex justify-around items-center px-4 z-50">
          <button onClick={() => onNavigate('action_dashboard')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">dashboard</span>
            <span className="text-[10px] font-medium">Dashboard</span>
          </button>
          <button onClick={() => onNavigate('routine')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">event_repeat</span>
            <span className="text-[10px] font-medium">Routine</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#FF6D29] transition-colors relative">
            <span className="material-symbols-outlined text-[20px] filled">biotech</span>
            <span className="text-[10px] font-medium">Diagnostics</span>
            <div className="absolute -top-3 w-1 h-1 bg-[#FF6D29] rounded-full shadow-[0_0_5px_#FF6D29]"></div>
          </button>
          <button onClick={() => onNavigate('care_network')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-white transition-colors">
            <span className="material-symbols-outlined text-[20px]">groups_2</span>
            <span className="text-[10px] font-medium">Network</span>
          </button>
        </nav>
      </main>

        {/* Guidelines Modal */}
        {isUnlocked && (
          <DiagnosticsUploadGuidelinesModal
            isOpen={showGuidelines}
            onClose={() => setShowGuidelines(false)}
          />
        )}
      </div>
    )}

    {/* Confirmation Modal */}
    {showConfirmModal && pendingComparisonResult && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#131315] border border-[#FF6D29]/30 rounded-3xl p-6 sm:p-10 max-w-2xl md:max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_40px_rgba(255,109,41,0.15)] relative"
        >
          {/* Subtle glow effect behind content */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-40 bg-gradient-to-b from-[#FF6D29]/10 to-transparent pointer-events-none" />

          <div className="relative z-10">
            {/* Header section */}
            <div className="flex items-start gap-4 mb-8 relative">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br from-[#FF6D29]/20 to-[#FF8D59]/5 border border-[#FF6D29]/20 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_0_20px_rgba(255,109,41,0.15)]">
                <span className="material-symbols-outlined text-[#FF6D29] text-[24px]">verified</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1 truncate">Confirm Follow-Up Result</h3>
                <p className="text-zinc-400 text-sm sm:text-[15px] leading-relaxed truncate sm:whitespace-normal">
                  Please review the AI-generated assessment before finalizing your official progress marker.
                </p>
              </div>
            </div>
            
            {/* Content box - Premium Split Layout */}
            <div className="bg-[#1a1a1f]/80 backdrop-blur-xl border border-white/5 rounded-2xl p-2 mb-8 shadow-inner overflow-hidden flex flex-col md:flex-row gap-2">
              <div className="w-full md:w-1/2 bg-[#0A0A0C] rounded-xl flex items-center justify-center overflow-hidden h-[240px] relative group border border-white/5">
                <img src={pendingComparisonResult.originalImageUrl} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500" alt="Pending X-ray" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px] text-zinc-300">image</span>
                  <span className="text-xs font-semibold text-zinc-300 tracking-wide">Scanned Image</span>
                </div>
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] font-bold text-white tracking-wider">
                    RAW
                  </div>
                </div>
              </div>

              <div className="w-full md:w-1/2 flex flex-col gap-2">
                <div className="flex-1 bg-gradient-to-br from-[#232329] to-[#1a1a1f] rounded-xl p-5 border border-white/5 flex flex-col justify-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500 group-hover:scale-110 transform">
                     <span className="material-symbols-outlined text-8xl text-[#FF6D29]">analytics</span>
                   </div>
                   
                   <div className="flex flex-col relative z-10">
                     <div className="flex items-center gap-2 mb-3">
                       <div className="w-2 h-2 rounded-full bg-[#FF6D29] animate-pulse" />
                       <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">AI Diagnosis</span>
                     </div>
                     
                     <span className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] tracking-tighter mb-2 filter drop-shadow-sm">
                       {pendingComparisonResult.severityGrade}
                     </span>
                     
                     <div className="flex items-center gap-2 mt-auto">
                       <span className="text-xs text-zinc-300 font-medium bg-black/30 border border-white/5 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5">
                         <span className="material-symbols-outlined text-[14px] text-[#FF6D29]">monitoring</span>
                         {pendingComparisonResult.topConfidence}% Confidence
                       </span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
            
            {/* Buttons (equal width) */}
            <div className="flex flex-col sm:flex-row gap-3 w-full pt-2 border-t border-white/5">
              <button 
                onClick={() => { setShowConfirmModal(false); setShowFullResults(false); setComparisonResult(null); setPendingComparisonResult(null); }}
                className="px-6 py-4 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/30 transition-all shrink-0 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">delete</span>
                Discard
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-6 py-4 rounded-xl text-sm font-semibold text-zinc-300 bg-white/5 hover:bg-white/10 hover:text-white transition-all border border-white/5 hover:border-white/10 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Review Again
              </button>
              <button 
                onClick={async () => {
                  setShowConfirmModal(false);
                  // Phase 2: Persist to Supabase Storage + scan_history
                  if (uploadedFile && pendingComparisonResult) {
                    try {
                      const { supabase } = await import('../../lib/supabase');
                      const { data: { session } } = await supabase.auth.getSession();
                      if (session?.user) {
                        const confirmData = new FormData();
                        confirmData.append('file', uploadedFile);
                        confirmData.append('user_id', session.user.id);
                        confirmData.append('kl_grade', String(['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'].indexOf(pendingComparisonResult.severityGrade)));
                        confirmData.append('confidence_score', String(pendingComparisonResult.topConfidence));
                        confirmData.append('probability_distribution', JSON.stringify(pendingComparisonResult.confidenceDistribution));
                        await fetch('http://localhost:8000/predict/followup/confirm', { method: 'POST', body: confirmData });
                      }
                    } catch (err) {
                      console.error('Failed to confirm follow-up:', err);
                    }
                  }
                  if (onNewResult && pendingComparisonResult) onNewResult(pendingComparisonResult);
                  // Navigate back to the dashboard after successful save
                  onNavigate('action_dashboard');
                }}
                className="flex-1 px-6 py-4 rounded-xl text-sm font-bold bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#FF6D29] text-white transition-all shadow-[0_0_20px_rgba(255,109,41,0.3)] hover:shadow-[0_0_30px_rgba(255,109,41,0.5)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Finalize & Save
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )}
    </>
  );
}
