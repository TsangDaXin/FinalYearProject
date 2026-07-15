import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanFace, FileImage, ShieldCheck, FileSearch, XCircle, CheckCircle2, Check, X, CheckSquare } from 'lucide-react';

interface DiagnosticsUploadGuidelinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DiagnosticsUploadGuidelinesModal({ isOpen, onClose }: DiagnosticsUploadGuidelinesModalProps) {
  const [currentStep, setCurrentStep] = useState(1);

  const handleNextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCloseModal();
    }
  };

  const handleCloseModal = () => {
    onClose();
    setTimeout(() => setCurrentStep(1), 300);
  };

  if (!isOpen) return null;

  const renderIcon = () => {
    const iconProps = { size: 40, color: "#FF6D29", strokeWidth: 1.5 };
    switch (currentStep) {
      case 1: return <ScanFace {...iconProps} />;
      case 2: return <FileImage {...iconProps} />;
      case 3: return <ShieldCheck {...iconProps} />;
      case 4: return <FileSearch {...iconProps} />;
      default: return <ScanFace {...iconProps} />;
    }
  };

  const renderGuidelineText = () => {
    switch (currentStep) {
      case 1:
        return "Welcome to the SteadyGerak X-Ray Analysis module. Please follow the upcoming guidelines closely to ensure our AI can provide the most accurate diagnostic results.";
      case 2:
        return "Guideline 1: The image should be well-lit and in focus. Avoid glare or reflections if taking a photo of a physical film.";
      case 3:
        return "Guideline 2: Please crop or hide any personal identifiable information (like names or patient IDs) before uploading.";
      case 4:
        return "Guideline 3: Only upload X-ray images. Our AI is specifically trained on knee radiographs and will not process MRI or CT scans.";
      default:
        return "";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-[#050B14]/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="onboarding-card border border-outline-variant/30 rounded-2xl p-6 max-w-2xl w-full text-center shadow-[0_0_40px_rgba(255,109,41,0.05)] relative"
        >
          {/* Top Header */}
          <div className="text-[11px] font-sans font-semibold uppercase tracking-[0.25em] text-brand-orange mb-4">
            SteadyGerak Guidelines
          </div>

          {currentStep === 1 ? (
            <div className="flex flex-col min-h-[380px] justify-between w-full">
              <div className="flex flex-col items-center justify-center flex-grow w-full">
                {/* Illustration Placeholder */}
                <div className="mx-auto bg-brand-orange/10 border border-brand-orange/20 rounded-full flex items-center justify-center mb-8 w-[100px] h-[100px]">
                  {renderIcon()}
                </div>

                {/* Text Copy Block */}
                <h2 className="text-3xl font-bold text-on-surface mb-4 font-heading w-full">
                  Before we start analyzing
                </h2>
                <p className="text-body-lg text-on-surface-variant font-sans px-4 md:px-12 mb-6 w-full leading-relaxed">
                  Please follow the upcoming guidelines closely to ensure our model can provide the most accurate diagnostic results.
                </p>
                
                <p className="text-sm italic text-on-surface-variant/60 font-sans w-full">
                  You may skip if you know the guidelines...
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex flex-col w-full">
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-transparent border border-outline-variant hover:bg-surface-container-highest text-on-surface-variant font-medium py-3.5 rounded-xl transition-all font-sans text-sm"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3.5 rounded-xl transition-all font-sans text-sm shadow-[0_4px_14px_0_rgba(255,109,41,0.39)]"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          ) : currentStep === 2 ? (
            <>
              <h2 className="text-2xl font-bold text-on-surface mb-6 font-heading">
                Image Upload Examples
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 items-stretch">
                {/* Left Column: Wrong Example */}
                <div className="group w-full h-64 bg-red-500/5 border border-red-500/25 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  <img src="/examples/wrong-xray.jpg" alt="Wrong upload example" className="absolute inset-0 w-full h-full object-contain opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1d] via-[#1b1b1d]/50 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col items-center justify-end h-full w-full p-4 pointer-events-none">
                    <div className="absolute top-0 right-0 bg-red-500/20 text-red-500 rounded-bl-xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md border-b border-l border-red-500/20">
                      <XCircle size={14} strokeWidth={2.5} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Invalid</span>
                    </div>
                    <p className="text-sm text-red-400 font-bold mt-auto tracking-wide font-sans text-center drop-shadow-md">
                      Wrong Example<br/>
                      <span className="text-white/70 font-normal text-xs">Non-Xray Images</span>
                    </p>
                  </div>
                </div>

                {/* Right Column: Correct Example */}
                <div className="group w-full h-64 bg-green-500/5 border border-green-500/25 rounded-xl flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-green-500/50 hover:shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                  <img src="/examples/correct-xray.jpg" alt="Correct upload example" className="absolute inset-0 w-full h-full object-contain opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1d] via-[#1b1b1d]/50 to-transparent pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col items-center justify-end h-full w-full p-4 pointer-events-none">
                    <div className="absolute top-0 right-0 bg-green-500/20 text-green-500 rounded-bl-xl px-3 py-1.5 flex items-center gap-1.5 backdrop-blur-md border-b border-l border-green-500/20">
                      <CheckCircle2 size={14} strokeWidth={2.5} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Valid</span>
                    </div>
                    <p className="text-sm text-green-400 font-bold mt-auto tracking-wide font-sans text-center drop-shadow-md">
                      Correct Example<br/>
                      <span className="text-white/70 font-normal text-xs">Actual Xray Images</span>
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-sm text-center text-on-surface/90 w-full mx-auto mt-6 mb-8 font-sans leading-relaxed">
                Please upload only valid X-ray images. Our AI cannot process other image types.
              </p>

              <div className="flex flex-col">
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="flex-1 bg-transparent border border-outline-variant hover:bg-surface-container-highest text-on-surface-variant font-medium py-3.5 rounded-xl transition-all font-sans text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3.5 rounded-xl transition-all font-sans text-sm shadow-[0_4px_14px_0_rgba(255,109,41,0.39)]"
                  >
                    Next
                  </button>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer mt-4 block mx-auto font-sans"
                >
                  Skip
                </button>
              </div>
            </>
          ) : currentStep === 3 ? (
            <>
              <h2 className="text-2xl font-bold text-on-surface mb-6 font-heading">
                The Do's and Don'ts
              </h2>

              {/* Content Split Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch mb-6 text-left">
                {/* Left Column ("Please Do") */}
                <div className="bg-surface-container-highest/30 border border-green-500/20 rounded-xl p-6 flex flex-col justify-between shadow-[0_0_20px_rgba(34,197,94,0.03)]">
                  <h3 className="text-base font-bold text-green-400 mb-4 flex items-center gap-2">
                    👍 Please Do:
                  </h3>
                  <ul className="space-y-3 mb-6 text-sm text-on-surface-variant font-sans">
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                      Make sure the image is bright and easy to read.
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                      Upload the original digital file from your doctor if you have it.
                    </li>
                    <li className="flex items-start gap-2">
                      <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                      Crop out your personal name label if taking a photo of a physical x-ray.
                    </li>
                  </ul>
                </div>

                {/* Right Column ("Please Don't") */}
                <div className="bg-surface-container-highest/30 border border-red-500/20 rounded-xl p-6 flex flex-col justify-between shadow-[0_0_20px_rgba(239,68,68,0.03)]">
                  <h3 className="text-base font-bold text-red-400 mb-4 flex items-center gap-2">
                    👎 Please Don't:
                  </h3>
                  <ul className="space-y-3 mb-6 text-sm text-on-surface-variant font-sans">
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                      Upload blurry, out-of-focus, or heavily shadowed photos.
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                      Include glare from room lights or camera flashes.
                    </li>
                    <li className="flex items-start gap-2">
                      <X size={16} className="text-red-500 shrink-0 mt-0.5" />
                      Upload other medical documents (like blood test results or prescriptions) here.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Main Navigation Framework */}
              <div className="flex flex-col">
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 bg-transparent border border-outline-variant hover:bg-surface-container-highest text-on-surface-variant font-medium py-3.5 rounded-xl transition-all font-sans text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleNextStep}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3.5 rounded-xl transition-all font-sans text-sm shadow-[0_4px_14px_0_rgba(255,109,41,0.39)]"
                  >
                    Next
                  </button>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-xs text-on-surface-variant/60 hover:text-on-surface transition-colors cursor-pointer mt-4 block mx-auto font-sans"
                >
                  Skip
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-extrabold text-on-surface mb-2 font-heading">
                Final Check
              </h2>
              <p className="text-sm text-on-surface-variant mb-8 font-sans">
                Before you drop your file here, please check:
              </p>

              {/* Central Checklist Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 w-full max-w-2xl mx-auto text-left">
                <div className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-xl p-5 flex items-start gap-3 shadow-md hover:border-brand-orange/30 transition-colors">
                  <CheckSquare className="text-brand-orange w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                    <span className="font-bold text-on-surface block mb-1">It's clear.</span> 
                    The image is in focus and there is no glare.
                  </p>
                </div>
                
                <div className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-xl p-5 flex items-start gap-3 shadow-md hover:border-brand-orange/30 transition-colors">
                  <CheckSquare className="text-brand-orange w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                    <span className="font-bold text-on-surface block mb-1">It's the right format.</span> 
                    We accept JPG, PNG, or DICOM files (max 50MB).
                  </p>
                </div>
                
                <div className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-xl p-5 flex items-start gap-3 shadow-md hover:border-brand-orange/30 transition-colors">
                  <CheckSquare className="text-brand-orange w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                    <span className="font-bold text-on-surface block mb-1">It's private.</span> 
                    You've hidden any personal names or IDs printed on the film.
                  </p>
                </div>
                
                <div className="bg-surface-container-highest/40 border border-outline-variant/30 rounded-xl p-5 flex items-start gap-3 shadow-md hover:border-brand-orange/30 transition-colors">
                  <CheckSquare className="text-brand-orange w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm text-on-surface-variant leading-relaxed font-sans">
                    <span className="font-bold text-on-surface block mb-1">It's complete.</span> 
                    The entire X-ray is visible without cut-off edges.
                  </p>
                </div>
              </div>

              {/* Main Navigation Framework */}
              <div className="flex flex-col">
                <div className="flex gap-4 w-full justify-center">
                  <button
                    onClick={() => setCurrentStep(3)}
                    className="flex-1 bg-transparent border border-outline-variant hover:bg-surface-container-highest text-on-surface-variant font-medium py-3.5 rounded-xl transition-all font-sans text-sm"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCloseModal}
                    className="flex-1 bg-brand-orange hover:bg-brand-orange/90 text-white font-bold py-3.5 rounded-xl transition-all font-sans text-sm shadow-[0_4px_14px_0_rgba(255,109,41,0.39)]"
                  >
                    I'm ready!
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Carousel Step Indicators */}
          <div className="flex justify-center gap-2 mt-6">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  currentStep === step
                    ? 'bg-brand-orange shadow-[0_0_8px_rgba(255,109,41,0.6)] w-4'
                    : 'bg-on-surface-variant/30'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
