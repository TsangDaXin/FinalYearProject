import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RadialGlowBackground } from '../../components/ui/radial-glow-background';
import { supabase } from '../../lib/supabase';

interface ProfilePageProps {
  onNavigate: (view: 'action_dashboard' | 'routine' | 'mastery' | 'care_network' | 'roadmap' | 'profile' | 'diagnostics') => void;
}

interface ProfileData {
  full_name: string;
  age: number | null;
  biological_sex: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  previous_injury: string | null;
  kl_grade: number | null;
  streak_current: number | null;
  onboarding_date: string | null;
}

export default function ProfilePage({ onNavigate }: ProfilePageProps) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [_loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Editable fields
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number>(30);
  const [sex, setSex] = useState<string>('');
  const [heightCm, setHeightCm] = useState<number>(170);
  const [weightKg, setWeightKg] = useState<number>(75);
  const [previousInjury, setPreviousInjury] = useState<string>('');

  // Password change
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      setUserEmail(session.user.email || '');

      const { data } = await supabase
        .from('profiles')
        .select('full_name, age, biological_sex, height_cm, weight_kg, previous_injury, kl_grade, streak_current, onboarding_date')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
        setFullName(data.full_name || '');
        setAge(data.age || 30);
        setSex(data.biological_sex || '');
        setHeightCm(data.height_cm || 170);
        setWeightKg(data.weight_kg || 75);
        setPreviousInjury(data.previous_injury || '');
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // BMI calculation
  const bmi = useMemo(() => {
    if (!heightCm || !weightKg) return null;
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  }, [heightCm, weightKg]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return { label: '—', color: '#6b7280', bg: 'bg-gray-500/10' };
    if (bmi < 18.5) return { label: 'Underweight', color: '#eab308', bg: 'bg-yellow-500/10' };
    if (bmi < 25) return { label: 'Normal', color: '#22c55e', bg: 'bg-green-500/10' };
    if (bmi < 30) return { label: 'Overweight', color: '#f97316', bg: 'bg-orange-500/10' };
    return { label: 'Obese', color: '#ef4444', bg: 'bg-red-500/10' };
  }, [bmi]);

  // Clinical info
  const klGradeLabel = useMemo(() => {
    const grades = ['Healthy', 'Doubtful', 'Minimal', 'Moderate', 'Severe'];
    return profile?.kl_grade !== null && profile?.kl_grade !== undefined ? grades[profile.kl_grade] || '—' : '—';
  }, [profile]);

  const weeksSinceOnboarding = useMemo(() => {
    if (!profile?.onboarding_date) return 0;
    const start = new Date(profile.onboarding_date);
    const now = new Date();
    return Math.max(1, Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7)));
  }, [profile]);

  const currentCycle = useMemo(() => Math.ceil(weeksSinceOnboarding / 12), [weeksSinceOnboarding]);

  // Save profile
  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        age,
        biological_sex: sex,
        height_cm: heightCm,
        weight_kg: weightKg,
        previous_injury: previousInjury,
      })
      .eq('id', session.user.id);

    setSaving(false);
    if (!error) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Change password
  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => { setPasswordSuccess(false); setShowPasswordForm(false); }, 2000);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Animation
  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 260, damping: 20 } } };

  return (
    <div className="font-sans bg-[#131315] text-white min-h-screen selection:bg-[#FF6D29] selection:text-white relative overflow-hidden">
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
          <button onClick={() => onNavigate('action_dashboard')} className="text-gray-400 hover:text-white hover:bg-white/5 px-4 py-3 flex items-center gap-3 transition-all rounded-lg w-full text-left">
            <span className="material-symbols-outlined">home</span>
            <span className="text-sm font-medium">Main Dashboard</span>
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
          <button className="bg-[#FF6D29]/10 text-[#FF6D29] rounded-lg px-4 py-3 flex items-center gap-3 font-semibold border border-[#FF6D29]/20 w-full text-left">
            <span className="material-symbols-outlined filled">account_circle</span>
            <span className="text-sm">Profile & Biometrics</span>
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
              <span className="text-sm font-medium text-gray-300">{fullName || 'User'}</span>
              <div className="w-8 h-8 rounded-full bg-gray-700 border border-white/20 flex items-center justify-center text-xs font-bold">{(fullName || 'U').charAt(0).toUpperCase()}</div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="p-4 md:p-10 max-w-5xl mx-auto w-full space-y-8 flex-grow">

          {/* Page Header */}
          <motion.section variants={itemVariants}>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-2">Profile & Biometrics</h1>
            <p className="text-base text-gray-400">Manage your personal details, body metrics, and rehabilitation preferences.</p>
          </motion.section>

          {/* ═══ Profile Header Card ═══ */}
          <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-6 overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6D29] to-[#C2410C] flex items-center justify-center text-3xl font-black text-white shadow-[0_0_30px_rgba(255,109,41,0.3)]">
                {(fullName || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-white">{fullName || 'User'}</h2>
                <p className="text-sm text-gray-400 mt-1">{userEmail}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 justify-center md:justify-start">
                  {profile?.onboarding_date && (
                    <span className="text-[10px] font-bold text-gray-400 bg-white/5 px-2.5 py-1 rounded-full">
                      Member since {new Date(profile.onboarding_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-[#FF6D29] bg-[#FF6D29]/10 px-2.5 py-1 rounded-full">
                    Week {weeksSinceOnboarding} • Cycle {currentCycle}
                  </span>
                  {profile?.streak_current && profile.streak_current > 0 && (
                    <span className="text-[10px] font-bold text-[#eab308] bg-[#eab308]/10 px-2.5 py-1 rounded-full">
                      🔥 {profile.streak_current} day streak
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.04), transparent)' }}></div>
          </motion.div>

          {/* ═══ Two-Column Grid: Body Metrics + Clinical Snapshot ═══ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Body Metrics */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-[#FF6D29]">monitor_weight</span>
                <h3 className="text-base font-bold text-white">Body Metrics</h3>
              </div>

              <div className="space-y-4">
                {/* Height */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Height (cm)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors"
                  />
                </div>
                {/* Weight */}
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Weight (kg)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors"
                  />
                </div>
                {/* BMI Display */}
                <div className={`${bmiCategory.bg} border border-white/5 rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">BMI</p>
                      <p className="text-2xl font-black text-white mt-1">{bmi ? bmi.toFixed(1) : '—'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ color: bmiCategory.color, backgroundColor: `${bmiCategory.color}15` }}>
                        {bmiCategory.label}
                      </span>
                      <p className="text-[10px] text-gray-500 mt-2">Target: 18.5 – 24.9</p>
                    </div>
                  </div>
                  {/* BMI Gauge */}
                  <div className="mt-3 relative h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="absolute inset-0 flex">
                      <div className="h-full bg-yellow-500/30" style={{ width: '18.5%' }} />
                      <div className="h-full bg-green-500/30" style={{ width: '25%' }} />
                      <div className="h-full bg-orange-500/30" style={{ width: '20%' }} />
                      <div className="h-full bg-red-500/30" style={{ width: '36.5%' }} />
                    </div>
                    {bmi && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white shadow-lg transition-all duration-500"
                        style={{ left: `${Math.min(95, Math.max(2, (bmi / 40) * 100))}%`, backgroundColor: bmiCategory.color }}
                      />
                    )}
                  </div>
                  <p className="text-[9px] text-gray-600 mt-2">Every 1 kg lost reduces knee joint load by ~4 kg during activity.</p>
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.03), transparent)' }}></div>
            </motion.div>

            {/* Clinical Snapshot */}
            <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-6 overflow-hidden">
              <div className="flex items-center gap-2 mb-5">
                <span className="material-symbols-outlined text-[#8B5CF6]">clinical_notes</span>
                <h3 className="text-base font-bold text-white">Clinical Snapshot</h3>
              </div>

              <div className="space-y-4">
                {/* KL Grade */}
                <div className="bg-black/40 border border-white/10 rounded-lg p-4">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">KL Grade Classification</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 flex items-center justify-center">
                      <span className="text-lg font-black text-[#8B5CF6]">{profile?.kl_grade ?? '—'}</span>
                    </div>
                    <div>
                      <p className="text-white font-bold">{klGradeLabel}</p>
                      <p className="text-[10px] text-gray-500">Diagnosed via AI X-Ray analysis</p>
                    </div>
                  </div>
                </div>

                {/* Journey Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-white">{weeksSinceOnboarding}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Weeks Active</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-white">{currentCycle}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Scan Cycle</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-white">{profile?.streak_current || 0}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Current Streak</p>
                  </div>
                  <div className="bg-black/40 border border-white/10 rounded-lg p-3 text-center">
                    <p className="text-xl font-black text-white">{Math.max(0, 12 - ((weeksSinceOnboarding - 1) % 12) - 1)}</p>
                    <p className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mt-1">Weeks to Scan</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.03), transparent)' }}></div>
            </motion.div>
          </div>

          {/* ═══ Personal Details ═══ */}
          <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-[#FF6D29]">person</span>
              <h3 className="text-base font-bold text-white">Personal Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors"
                />
              </div>
              {/* Email (Read-Only) */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Email</label>
                <input
                  type="email"
                  value={userEmail}
                  readOnly
                  className="w-full bg-black/20 border border-white/5 rounded-lg px-4 py-2.5 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              {/* Age */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Age</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors"
                />
              </div>
              {/* Biological Sex */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Biological Sex</label>
                <select
                  value={sex}
                  onChange={(e) => setSex(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors appearance-none"
                >
                  <option value="" className="bg-[#131315]">Select...</option>
                  <option value="male" className="bg-[#131315]">Male</option>
                  <option value="female" className="bg-[#131315]">Female</option>
                  <option value="prefer-not" className="bg-[#131315]">Prefer not to say</option>
                </select>
              </div>
              {/* Previous Injury */}
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Previous Knee Injury</label>
                <select
                  value={previousInjury}
                  onChange={(e) => setPreviousInjury(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors appearance-none"
                >
                  <option value="" className="bg-[#131315]">Select...</option>
                  <option value="yes" className="bg-[#131315]">Yes</option>
                  <option value="no" className="bg-[#131315]">No</option>
                </select>
              </div>
            </div>
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255, 109, 41, 0.03), transparent)' }}></div>
          </motion.div>

          {/* ═══ Save Button ═══ */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-8 py-3 bg-gradient-to-r from-[#FF6D29] to-[#FF8D59] hover:from-[#FF8D59] hover:to-[#C2410C] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(255,109,41,0.3)] disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-lg">{saving ? 'hourglass_empty' : 'save'}</span>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-[#22c55e] font-semibold flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">check_circle</span>
                Profile updated successfully
              </motion.span>
            )}
          </motion.div>

          {/* ═══ Account & Security ═══ */}
          <motion.div variants={itemVariants} className="relative bg-gradient-to-br from-zinc-800/80 to-zinc-900/90 border border-zinc-500/50 rounded-xl p-6 overflow-hidden">
            <div className="flex items-center gap-2 mb-5">
              <span className="material-symbols-outlined text-gray-400">shield</span>
              <h3 className="text-base font-bold text-white">Account & Security</h3>
            </div>

            <div className="space-y-4">
              {/* Change Password */}
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="flex items-center gap-3 w-full p-4 bg-black/40 border border-white/10 rounded-lg hover:border-white/20 transition-colors group"
                >
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-white transition-colors">lock</span>
                  <div className="text-left flex-1">
                    <p className="text-sm font-semibold text-white">Change Password</p>
                    <p className="text-[10px] text-gray-500">Update your account password</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-600 text-sm">chevron_right</span>
                </button>
              ) : (
                <div className="p-4 bg-black/40 border border-white/10 rounded-lg space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors placeholder-gray-600"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">Confirm Password</label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:border-[#FF6D29]/50 focus:outline-none transition-colors placeholder-gray-600"
                    />
                  </div>
                  {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
                  {passwordSuccess && <p className="text-xs text-[#22c55e]">Password updated successfully!</p>}
                  <div className="flex gap-3">
                    <button
                      onClick={handlePasswordChange}
                      className="px-5 py-2 bg-[#FF6D29] hover:bg-[#FF8D59] text-white font-bold text-sm rounded-lg transition-colors"
                    >
                      Update Password
                    </button>
                    <button
                      onClick={() => { setShowPasswordForm(false); setPasswordError(''); setNewPassword(''); setConfirmPassword(''); }}
                      className="px-5 py-2 bg-white/5 hover:bg-white/10 text-gray-400 font-semibold text-sm rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full p-4 bg-black/40 border border-red-500/10 rounded-lg hover:border-red-500/30 hover:bg-red-500/5 transition-colors group"
              >
                <span className="material-symbols-outlined text-red-400">logout</span>
                <div className="text-left flex-1">
                  <p className="text-sm font-semibold text-red-400">Sign Out</p>
                  <p className="text-[10px] text-gray-500">Log out of your account</p>
                </div>
              </button>
            </div>
            <div className="absolute inset-0 rounded-xl pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(100, 100, 100, 0.02), transparent)' }}></div>
          </motion.div>

        </motion.div>

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
          <button onClick={() => onNavigate('mastery')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-300 transition-colors">
            <span className="material-symbols-outlined">emoji_events</span>
            <span className="text-[10px] font-medium">Mastery</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-[#FF6D29]">
            <span className="material-symbols-outlined filled">account_circle</span>
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </nav>
      </main>
    </div>
  );
}
