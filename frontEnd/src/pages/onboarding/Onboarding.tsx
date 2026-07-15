import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KeyboardEvent } from 'react';
import { FlowButton } from '../../components/ui/flow-button';

// ── Reusable range slider with floating tooltip ─────────────────────────────
function ValueSlider({
  label,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="space-y-5">
      <div className="flex justify-between items-end">
        <span className="text-[11px] font-sans uppercase tracking-[0.2em] text-on-surface-variant">
          {label}
        </span>
        <span className="text-headline-md font-heading text-brand-orange tabular-nums">
          {value}
          <small className="text-xs text-on-surface-variant font-normal ml-1">{unit}</small>
        </span>
      </div>

      {/* Slider track */}
      <div className="relative group py-2">
        {/* Floating tooltip */}
        <div
          className="absolute -top-7 pointer-events-none transition-opacity duration-150 opacity-0 group-hover:opacity-100"
          style={{ left: `calc(${pct}% - 18px)` }}
        >
          <div className="bg-brand-orange text-white text-[11px] font-bold px-2 py-[2px] rounded-md shadow-lg">
            {value}
          </div>
          <div
            className="w-0 h-0 mx-auto"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #FF6D29',
            }}
          />
        </div>

        {/* Filled track */}
        <div className="absolute top-1/2 -translate-y-1/2 h-[6px] rounded-full bg-surface-container-highest w-full">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(to right, #ea580c, #fb923c)',
            }}
          />
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="relative z-10 w-full"
          style={{ background: 'transparent' }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-outline uppercase tracking-widest">
        <span>{min} {unit}</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────
interface OnboardingProps {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function Onboarding({ onComplete, onBack }: OnboardingProps) {
  const [age, setAge] = useState<string>('');
  const [ageError, setAgeError] = useState<string>('');
  const [sex, setSex] = useState<'male' | 'female' | 'prefer-not' | null>(null);
  const [height, setHeight] = useState<number>(170);
  const [weight, setWeight] = useState<number>(75);
  const [injury, setInjury] = useState<'yes' | 'no' | null>(null);

  // Progress computation
  const answeredCount = useMemo(() => {
    let n = 0;
    if (age !== '') n++;
    if (sex !== null) n++;
    // height/weight always have defaults, count as answered
    n++;
    if (injury !== null) n++;
    return n;
  }, [age, sex, injury]);

  const [submitError, setSubmitError] = useState<string>('');

  const handleContinue = () => {
    // Validate all required fields
    if (!age || ageError) {
      setSubmitError('Please enter a valid age before continuing.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!sex) {
      setSubmitError('Please select a biological sex before continuing.');
      return;
    }
    if (!injury) {
      setSubmitError('Please answer the knee injury question before continuing.');
      return;
    }
    setSubmitError('');
    onComplete({
      age: parseInt(age, 10),
      biological_sex: sex,
      height_cm: height,
      weight_kg: weight,
      previous_injury: injury
    });
  };

  // Card entrance stagger
  const cardAnim = (i: number) => ({
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.15 + i * 0.1, ease: 'easeOut' as const },
  });

  return (
    <div className="font-sans antialiased selection:bg-brand-orange selection:text-white min-h-screen w-full relative">
      {/* Background Layer (Cyber Glitch) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050B14]">
        <img
          alt=""
          className="w-full h-full object-cover glitch-bg"
          src="/cyber-knee-xray.png"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background" />
      </div>

      <main className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 md:py-12 max-w-4xl mx-auto">

        {/* ── Progress Header ──────────────────────────────────────────── */}
        <motion.header
          className="w-full mb-10 flex flex-col items-center relative"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button — top left */}
          <button
            onClick={onBack}
            className="absolute left-0 top-0 flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface transition-colors duration-200 group"
          >
            <span
              className="material-symbols-outlined group-hover:-translate-x-0.5 transition-transform duration-200"
              style={{ fontSize: 18 }}
            >
              arrow_back
            </span>
            <span className="text-xs font-sans font-semibold uppercase tracking-wider">Back</span>
          </button>

          <div className="flex items-center gap-2 mb-4">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className="rounded-full transition-all duration-500"
                style={{
                  width: i === 0 ? 32 : 8,
                  height: 8,
                  background: i === 0 ? '#FF6D29' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-brand-orange mb-1">
            Step 1 of 4
          </span>
          <h1 className="font-heading text-headline-xl text-on-surface mt-1 text-center">
            Biometrics &amp; Demographics
          </h1>

          {/* Mini completion tracker */}
          <div className="mt-4 flex items-center gap-2">
            <div className="flex gap-[5px]">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-[6px] h-[6px] rounded-full transition-all duration-400"
                  style={{
                    background: i < answeredCount ? '#FF6D29' : 'rgba(255,255,255,0.1)',
                    boxShadow: i < answeredCount ? '0 0 6px rgba(255, 109, 41,0.5)' : 'none',
                  }}
                />
              ))}
            </div>
            <span className="text-[10px] font-sans text-on-surface-variant ml-1">
              {answeredCount}/4 answered
            </span>
          </div>
        </motion.header>

        {/* ── Companion Section ────────────────────────────────────────── */}
        <motion.section
          className="flex flex-col md:flex-row items-center gap-6 mb-10 w-full glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          {/* ── COMPANION AVATAR ──
              Drop your image file into:  frontEnd/public/avatars/biometrics-avatar.png
              Future pages:  symptoms-avatar.png, history-avatar.png ── */}
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
            <img
              alt="Companion Avatar – Biometrics Guide"
              className="w-full h-full object-contain drop-shadow-lg"
              src="/avatars/biometrics-avatar.png"
              onError={(e) => {
                const t = e.currentTarget;
                t.style.display = 'none';
                const parent = t.parentElement;
                if (parent && !parent.querySelector('.avatar-fallback')) {
                  const fb = document.createElement('div');
                  fb.className = 'avatar-fallback w-full h-full rounded-full bg-surface-container-high border-2 border-orange-500/30 flex items-center justify-center text-5xl';
                  fb.textContent = '🐧';
                  parent.appendChild(fb);
                }
              }}
            />
            <div className="absolute -bottom-1 -right-1 bg-brand-orange w-6 h-6 rounded-full flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-[14px] text-white">medical_services</span>
            </div>
          </div>
          <div className="text-center md:text-left">
            <p className="font-heading text-headline-sm text-on-surface mb-2">Steady Companion</p>
            <p className="font-sans text-body-lg text-on-surface-variant leading-relaxed italic">
              "Hi! Let's get to know you so I can better understand your knee health.
              This information helps us tailor your recovery path."
            </p>
          </div>
        </motion.section>

        {/* ── Questions ───────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-5">

          {/* Q01 — Age */}
          <motion.div className="onboarding-card" {...cardAnim(0)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 1</div>
            <div className="flex flex-col items-center justify-center w-full py-4">
              <h2 className="text-xl md:text-2xl font-heading text-on-surface mb-8 text-center">
                What is your current age?
              </h2>
              <div className="flex flex-col items-center">
                <input
                  type="number"
                  min="1"
                  max="120"
                  placeholder="25"
                  className={`w-32 h-20 text-center text-5xl font-bold bg-surface-container rounded-lg border-2 text-brand-orange focus:ring-4 transition-all outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                    ageError
                      ? 'border-red-500/70 focus:border-red-500 focus:ring-red-500/20'
                      : 'border-outline-variant/30 focus:border-brand-orange focus:ring-brand-orange/20'
                  }`}
                  value={age}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    // Block everything except digits, backspace, delete, tab, arrows
                    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
                    if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  onChange={(e) => {
                    const raw = e.target.value;
                    // Allow clearing the field
                    if (raw === '') {
                      setAge('');
                      setAgeError('');
                      return;
                    }
                    const num = parseInt(raw, 10);
                    if (num < 1) {
                      setAge(raw);
                      setAgeError('Age must be at least 1.');
                    } else if (num > 120) {
                      // Hard-cap: don't allow typing beyond 120
                      setAge('120');
                      setAgeError('Age cannot exceed 120.');
                    } else {
                      setAge(raw);
                      setAgeError('');
                    }
                  }}
                />
                <span className="text-sm text-on-surface-variant mt-3 uppercase tracking-widest font-sans">
                  years old
                </span>
                {ageError && (
                  <motion.p
                    className="mt-3 text-xs font-sans text-red-400 flex items-center gap-1"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>error</span>
                    {ageError}
                  </motion.p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Q02 — Biological Sex */}
          <motion.div className="onboarding-card" {...cardAnim(1)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 2</div>
            <label className="onboarding-card-heading">What is your biological sex?</label>
            <div className="flex flex-col gap-3 mt-4">
              {([
                { val: 'male' as const, label: 'Male', icon: 'male' },
                { val: 'female' as const, label: 'Female', icon: 'female' },
                { val: 'prefer-not' as const, label: 'Prefer not to say', icon: 'visibility_off' },
              ]).map(opt => {
                const active = sex === opt.val;
                return (
                  <button
                    key={opt.val}
                    onClick={() => setSex(opt.val)}
                    className={`flex items-center justify-between px-5 py-[14px] rounded-xl border transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-brand-orange/15 border-brand-orange/50 shadow-[0_0_14px_rgba(255, 109, 41,0.12)]'
                        : 'bg-surface-container/40 border-outline-variant/25 hover:border-outline-variant/50 hover:bg-surface-container-highest/50'
                    }`}
                  >
                    <span className={`text-body-md font-medium ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>
                      {opt.label}
                    </span>
                    <span
                      className={`material-symbols-outlined transition-colors ${
                        active ? 'text-brand-orange' : 'text-outline/50'
                      }`}
                      style={{ fontSize: 22 }}
                    >
                      {opt.icon}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Q03 — Height & Weight */}
          <motion.div className="onboarding-card" {...cardAnim(2)}>
            <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 3</div>
            <label className="onboarding-card-heading">Current height and weight?</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-5">
              <ValueSlider
                label="Height" unit="cm"
                value={height} min={100} max={250}
                onChange={setHeight}
              />
              <ValueSlider
                label="Weight" unit="kg"
                value={weight} min={30} max={250}
                onChange={setWeight}
              />
            </div>
          </motion.div>

          {/* Q04 — Previous Injury */}
          <motion.div
            className="onboarding-card flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            {...cardAnim(3)}
          >
            <div className="flex-1 min-w-0">
              <div className="inline-block px-3 py-1.5 rounded-md bg-orange-500/20 text-brand-orange text-xs font-bold uppercase tracking-widest mb-6 font-sans">Question 4</div>
              <label className="onboarding-card-heading">Previous major knee injury?</label>
              <p className="text-body-sm text-on-surface-variant mt-2">
                Fractures, ligament tears (ACL/MCL), or surgeries.
              </p>
            </div>

            <div className="shrink-0 flex p-1 rounded-full w-full md:w-auto" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
              {(['yes', 'no'] as const).map(val => {
                const active = injury === val;
                return (
                  <button
                    key={val}
                    onClick={() => setInjury(val)}
                    className={`flex-1 md:flex-none px-12 py-3 rounded-full font-bold capitalize transition-all duration-200 cursor-pointer ${
                      active
                        ? 'bg-brand-orange text-white shadow-[0_0_16px_rgba(255, 109, 41,0.3)]'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    {val.charAt(0).toUpperCase() + val.slice(1)}
                  </button>
                );
              })}
            </div>
          </motion.div>

        </div>

        {/* ── Submit Error ─────────────────────────────────────────── */}
        {submitError && (
          <motion.div
            className="w-full mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm font-sans"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>error</span>
            {submitError}
          </motion.div>
        )}

        {/* ── Continue CTA ────────────────────────────────────────────── */}
        <motion.div
          className="w-full mt-6 mb-8 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.6 }}
        >
          <FlowButton
            onClick={handleContinue}
            text="Continue to Symptoms"
            className="w-72 h-14 text-lg mx-auto"
          />
        </motion.div>

      </main>
    </div>
  );
}
