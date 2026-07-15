import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlowButton } from '../../components/ui/flow-button';
import { supabase } from '../../lib/supabase';

import type { DiagnosticData } from './DiagnosticResults';
import DiagnosticsUploadGuidelinesModal from './DiagnosticsUploadGuidelinesModal';
import { StartAnalyzingButton } from '../landing/components/Hero';
import { BookOpen } from 'lucide-react';

interface DiagnosticsUploadProps {
  onComplete: (data: DiagnosticData) => void;
  onBack: () => void;
}

export default function DiagnosticsUpload({ onComplete, onBack }: DiagnosticsUploadProps) {
  const [submitError, setSubmitError] = useState<string>('');
  const [showWrongImageModal, setShowWrongImageModal] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Upload simulation state
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSubmitError('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
      setSubmitError('');
    }
  };

  const startUpload = async () => {
    if (!file) {
      setSubmitError('Please upload an X-Ray image or DICOM file to proceed.');
      return;
    }
    
    setSubmitError('');
    setIsUploading(true);
    setProgress(10); // Start progress

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Get user ID to associate the prediction with the user profile
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        formData.append('user_id', session.user.id);
      }

      // Start a simulated progress bar to keep user engaged while waiting
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev; // Stall at 90% until fetch resolves
          return prev + Math.random() * 5;
        });
      }, 500);

      const response = await fetch('http://localhost:8000/predict', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setProgress(100);

      const data = await response.json();

      // ── Gatekeeper: non-knee X-ray detected ──
      if (!response.ok) {
        if (data?.error === 'not_knee_xray') {
          clearInterval(progressInterval);
          setIsUploading(false);
          setProgress(0);
          setShowWrongImageModal(true);
          return;
        }
        throw new Error(`Server error: ${response.statusText}`);
      }
      
      setTimeout(() => {
        onComplete(data as DiagnosticData);
      }, 800); // Wait a moment at 100%

    } catch (err) {
      setSubmitError('Failed to analyze image. Ensure the backend server is running.');
      setIsUploading(false);
      setProgress(0);
    }
  };

  useEffect(() => {
    // Progress is now managed in startUpload
  }, [isUploading, onComplete]);

  // SVG dash offset calculation for the progress circle
  const circleRadius = 40;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="font-sans antialiased selection:bg-brand-orange selection:text-white min-h-screen w-full relative overflow-hidden">
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
          className="w-full mb-12 flex flex-col items-center relative"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back button — top left */}
          <button
            onClick={onBack}
            disabled={isUploading}
            className={`absolute left-0 top-0 flex items-center gap-1.5 transition-colors duration-200 group ${
              isUploading ? 'text-outline-variant cursor-not-allowed' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span
              className={`material-symbols-outlined transition-transform duration-200 ${!isUploading && 'group-hover:-translate-x-0.5'}`}
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
                  width: i === 3 ? 32 : 8,
                  height: 8,
                  background: i <= 3 ? '#FF6D29' : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
          <span className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-brand-orange mb-1">
            Step 4 of 4
          </span>
          <h1 className="font-heading text-headline-xl text-on-surface mt-1 text-center">
            X-Ray Diagnostics
          </h1>
        </motion.header>

        {/* ── Companion Section ────────────────────────────────────────── */}
        <motion.section
          className="flex flex-col md:flex-row items-center gap-6 mb-10 w-full glass-card p-6 rounded-2xl"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          <div className="relative w-32 h-32 md:w-40 md:h-40 shrink-0">
            <img
              alt="Steady Companion Avatar"
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
              "Our model will now analyze your knee cartilage density and joint space. Please upload your highest resolution diagnostic imaging for the most accurate baseline."
            </p>
          </div>
        </motion.section>

        {/* ── Upload Card ──────────────────────────────────────────────── */}
        <motion.div 
          className="w-full onboarding-card p-8 md:p-10 relative overflow-hidden"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
        >
          {/* Upload Drop Zone */}
          <div
            onClick={() => !isUploading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              relative flex flex-col items-center justify-center text-center p-10 h-[320px] rounded-2xl cursor-pointer transition-all duration-300
              ${isDragging ? 'bg-brand-orange/10 border-brand-orange shadow-[0_0_24px_rgba(255, 109, 41,0.15)]' : 'bg-surface-container/30 hover:bg-surface-container-highest/50'}
              ${file ? 'border-solid border-2 border-brand-orange/50' : 'border-dashed border-2 border-outline-variant'}
            `}
            style={{
              backgroundImage: !file && !isDragging ? "url(\"data:image/svg+xml,%3csvg width='100%25' height='100%25' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100%25' height='100%25' fill='none' rx='16' ry='16' stroke='%233B82F6FF' stroke-width='2' stroke-dasharray='8%2c 12' stroke-dashoffset='0' stroke-linecap='square'/%3e%3c/svg%3e\")" : "none",
              border: !file && !isDragging ? 'none' : undefined
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.dicom,.dcm"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />

            <div className={`mb-6 p-5 rounded-full transition-transform duration-300 ${file ? 'bg-green-500/10 text-green-400' : 'bg-brand-orange/10 text-brand-orange'}`}>
              <span className="material-symbols-outlined text-[48px]">
                {file ? 'check_circle' : 'cloud_upload'}
              </span>
            </div>
            
            {file ? (
              <>
                <h3 className="text-xl font-bold text-on-surface mb-2">File Selected</h3>
                <p className="text-sm font-sans text-brand-orange font-semibold break-all px-4">{file.name}</p>
                <p className="text-xs text-on-surface-variant mt-2">Click to replace</p>
              </>
            ) : (
              <>
                <h3 className="text-xl font-bold text-on-surface mb-2">Drag your X-ray here</h3>
                <p className="text-body-md text-on-surface-variant mb-6">
                  or <span className="text-brand-orange font-bold">click to browse</span> your medical records
                </p>
                <div className="flex gap-2">
                  {['DICOM', 'PNG', 'JPG'].map(ext => (
                    <span key={ext} className="px-3 py-1 rounded-md bg-surface-container-highest border border-outline-variant/50 text-xs font-sans font-semibold text-on-surface-variant">
                      {ext}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant/60 mt-4">Maximum Size: 50MB</p>
              </>
            )}
          </div>

          {submitError && (
            <motion.p
              className="mt-4 text-sm font-sans text-red-400 flex items-center justify-center gap-1"
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>error</span>
              {submitError}
            </motion.p>
          )}

          {/* Action Button */}
          <div className="mt-8 flex justify-center">
            <FlowButton
              onClick={startUpload}
              disabled={isUploading}
              text={isUploading ? 'Uploading...' : 'Start AI Analysis'}
              className="w-72 h-14 text-lg mx-auto"
            />
          </div>

          {/* Loading Overlay */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-surface/95 backdrop-blur-md flex flex-col items-center justify-center z-50 rounded-2xl"
              >
                <div className="relative w-28 h-28 mb-6">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      className="text-surface-container-highest"
                      cx="56" cy="56" r={circleRadius}
                      fill="transparent" stroke="currentColor" strokeWidth="8"
                    />
                    <circle
                      className="text-brand-orange transition-all duration-300 ease-out"
                      cx="56" cy="56" r={circleRadius}
                      fill="transparent" stroke="currentColor" strokeWidth="8"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold text-on-surface font-sans">
                      {Math.round(progress)}%
                    </span>
                  </div>
                </div>
                <p className="text-lg font-bold text-on-surface mb-2 font-heading">Analyzing Bone Density...</p>
                <p className="text-sm font-sans text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-brand-orange">lock</span>
                  Secure processing on Orionix Nodes
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

      </main>

      {/* ── Wrong Image Modal ──────────────────────────────────────────── */}
      {showWrongImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWrongImageModal(false)}
          />
          {/* Card - Bento Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="relative z-10 bg-[#121214] border border-white/5 rounded-[2rem] p-4 max-w-[480px] w-full flex flex-col gap-3 shadow-[0_0_40px_rgba(0,0,0,0.5)]"
          >
            {/* Bento Cell 1: Alert Header */}
            <div className="bg-gradient-to-b from-red-500/10 to-red-500/5 border border-red-500/10 rounded-[1.5rem] p-6 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-500/20 border border-red-500/20 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined text-[28px] text-red-400">warning</span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight font-heading">
                Incorrect Image Detected
              </h2>
            </div>

            {/* Bento Grid: Information Cells */}
            <div className="grid grid-cols-2 gap-3">
              {/* Bento Cell 2: Primary Message */}
              <div className="bg-[#1b1b1d] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center shadow-inner">
                <span className="material-symbols-outlined text-brand-orange mb-2 text-[20px]">
                  image_not_supported
                </span>
                <p className="text-sm text-gray-300 font-sans leading-relaxed">
                  Hey! Please upload a valid <br/>
                  <span className="text-white font-semibold">knee X-ray image.</span>
                </p>
              </div>

              {/* Bento Cell 3: Explanatory Note */}
              <div className="bg-[#1b1b1d] border border-white/5 rounded-[1.5rem] p-5 flex flex-col justify-center shadow-inner">
                <span className="material-symbols-outlined text-gray-500 mb-2 text-[20px]">
                  psychology
                </span>
                <p className="text-[13px] text-gray-400 font-sans leading-relaxed">
                  Our model is trained exclusively on knee X-rays and cannot process other types.
                </p>
              </div>
            </div>

            {/* Bento Cell 4: Action Controls */}
            <div className="flex gap-3 mt-1">
              <button
                onClick={() => setShowWrongImageModal(false)}
                className="flex-1 bg-[#1b1b1d] border border-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold py-3.5 rounded-[1.25rem] transition-all font-sans text-sm shadow-sm"
              >
                Noted
              </button>
              <StartAnalyzingButton
                onClick={() => {
                  setShowWrongImageModal(false);
                  setShowGuidelines(true);
                }}
                text="View Guidelines"
                icon={BookOpen}
                className="w-full h-full"
                containerClassName="flex-1 flex"
              />
            </div>
          </motion.div>
        </div>
      )}

      <DiagnosticsUploadGuidelinesModal 
        isOpen={showGuidelines} 
        onClose={() => setShowGuidelines(false)} 
      />
    </div>
  );
}
