const fs = require('fs');
const path = require('path');

const srcDir = 'src';
const pagesDir = path.join(srcDir, 'pages');
const featuresDir = path.join(srcDir, 'features');

// Define the directory structure
const dirsToCreate = [
  path.join(featuresDir, 'auth'),
  path.join(pagesDir, 'assessment'),
  path.join(pagesDir, 'dashboard'),
  path.join(pagesDir, 'diagnostics'),
  path.join(pagesDir, 'onboarding'),
  path.join(pagesDir, 'treatment')
];

// Create directories
dirsToCreate.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Define file moves: { filename: target_dir }
const fileMoves = {
  'BehavioralLifestyle.tsx': 'assessment',
  'SymptomsAssessment.tsx': 'assessment',
  'DailyActionDashboard.tsx': 'dashboard',
  'DiagnosticResults.tsx': 'diagnostics',
  'DiagnosticsUpload.tsx': 'diagnostics',
  'Onboarding.tsx': 'onboarding',
  'LoadingScreen.tsx': 'onboarding',
  'RoutinePage.tsx': 'treatment',
  'MasteryPage.tsx': 'treatment',
  'CareNetworkPage.tsx': 'treatment',
  'RoadmapPage.tsx': 'treatment'
};

// Move files
for (const [file, targetSubDir] of Object.entries(fileMoves)) {
  const sourcePath = path.join(pagesDir, file);
  const targetPath = path.join(pagesDir, targetSubDir, file);
  if (fs.existsSync(sourcePath)) {
    fs.renameSync(sourcePath, targetPath);
    console.log(`Moved ${file} to ${targetSubDir}/`);
  }
}

// ----------------------------------------------------
// Step 2: Extract AuthPage.tsx
// ----------------------------------------------------

const authPagePath = path.join(featuresDir, 'auth', 'AuthPage.tsx');

const authPageCode = `import { useState, useEffect } from 'react'
import type { FormEvent } from 'react'

interface AuthPageProps {
  onAuthSuccess: (type: 'signin' | 'signup') => void;
  mounted: boolean;
}

export default function AuthPage({ onAuthSuccess, mounted }: AuthPageProps) {
  const [authType, setAuthType] = useState<'signin' | 'signup'>('signin')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [showRedirectToast, setShowRedirectToast] = useState(false)
  const [error, setError] = useState('')

  const handleToggle = (type: 'signin' | 'signup') => {
    if (submitStatus !== 'idle') return
    setAuthType(type)
    setError('')
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (submitStatus !== 'idle') return
    setError('')

    if (authType === 'signup') {
      if (!email.endsWith('@gmail.com')) {
        setError('Patient registration requires a @gmail.com email address.')
        return
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
    }

    if (authType === 'signin') {
      if (!email.endsWith('@gmail.com') && !email.endsWith('@gerak.com')) {
        setError('Please use @gmail.com (patient) or @gerak.com (doctor) to sign in.')
        return
      }
    }

    setSubmitStatus('submitting')

    setTimeout(() => {
      setSubmitStatus('success')
      setTimeout(() => {
        setShowRedirectToast(true)
        setTimeout(() => {
          setShowRedirectToast(false)
          setSubmitStatus('idle')
          onAuthSuccess(authType)
        }, 1500)
      }, 800)
    }, 1200)
  }

  return (
    <>
      <div className={\`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-sm bg-surface-container-high border border-emerald-500/30 px-lg py-md rounded-lg shadow-2xl transition-all duration-500 \${showRedirectToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}\`}>
        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
        <div className="flex flex-col">
          <span className="text-body-md font-ui font-bold text-white">Access Authenticated</span>
          <span className="text-label-md text-on-surface-variant">Redirecting to Clinical Dashboard...</span>
        </div>
      </div>

      <div className={\`w-full max-w-[420px] z-10 mx-auto my-auto py-8 transition-all duration-700 delay-150 \${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}\`}>
        <div className="bg-surface-container-low rounded-lg p-xl border border-outline-variant/20 shadow-xl">
          <div className="segmented-control flex mb-xl">
            <button 
              type="button"
              className={\`flex-1 py-2 text-label-md font-ui font-semibold transition-all duration-300 rounded-md cursor-pointer \${authType === 'signin' ? 'active text-white' : 'text-on-surface-variant hover:text-on-surface'}\`}
              onClick={() => handleToggle('signin')}
            >
              Sign In
            </button>
            <button 
              type="button"
              className={\`flex-1 py-2 text-label-md font-ui font-semibold transition-all duration-300 rounded-md cursor-pointer \${authType === 'signup' ? 'active text-white' : 'text-on-surface-variant hover:text-on-surface'}\`}
              onClick={() => handleToggle('signup')}
            >
              Create Account
            </button>
          </div>

          <div className="mb-lg overflow-hidden h-[72px] relative">
            <div className={\`absolute inset-0 transition-all duration-300 transform \${authType === 'signin' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4 pointer-events-none'}\`}>
              <h3 className="font-display text-headline-md text-on-surface mb-xs">Welcome Back</h3>
              <p className="text-body-sm font-ui text-on-surface-variant">
                Patient (<span className="text-brand-blue">@gmail.com</span>) or Doctor (<span className="text-brand-blue">@gerak.com</span>)
              </p>
            </div>
            <div className={\`absolute inset-0 transition-all duration-300 transform \${authType === 'signup' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4 pointer-events-none'}\`}>
              <h3 className="font-display text-headline-md text-on-surface mb-xs">Patient Registration</h3>
              <p className="text-body-sm font-ui text-on-surface-variant">
                Create your account using your <span className="text-brand-blue">@gmail.com</span> email.
              </p>
            </div>
          </div>

          <form className="space-y-sm" id="auth-form" onSubmit={handleSubmit}>
            {error && (
              <div className="text-error text-label-md font-ui mt-xs transition-opacity opacity-100 bg-error-container/20 p-2 rounded border border-error/30">
                {error}
              </div>
            )}
            
            <div className={\`space-y-sm transition-all duration-500 overflow-hidden \${authType === 'signup' ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}\`}>
              <div className="space-y-base">
                <label className="text-label-md font-ui font-medium text-on-surface-variant" htmlFor="fullName">Full Name</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-sm transition-colors group-focus-within:text-brand-blue">person</span>
                  <input 
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-md py-md pl-xl pr-md text-on-surface text-body-sm placeholder:text-outline/60 transition-all font-ui focus:border-brand-blue" 
                    id="fullName" placeholder="Owen Tan" required={authType === 'signup'} type="text"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-base">
                <label className="text-label-md font-ui font-medium text-on-surface-variant" htmlFor="phone">Phone Number</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-sm transition-colors group-focus-within:text-brand-blue">call</span>
                  <input 
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-md py-md pl-xl pr-md text-on-surface text-body-sm placeholder:text-outline/60 transition-all font-ui focus:border-brand-blue" 
                    id="phone" placeholder="+60 12-345 6789" required={authType === 'signup'} type="tel"
                    value={phone} onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-base">
              <label className="text-label-md font-ui font-medium text-on-surface-variant" htmlFor="email">Email</label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-sm transition-colors group-focus-within:text-brand-blue">mail</span>
                <input 
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-md py-md pl-xl pr-md text-on-surface text-body-sm placeholder:text-outline/60 transition-all font-ui focus:border-brand-blue" 
                  id="email" placeholder={authType === 'signup' ? 'patient@gmail.com' : 'user@gmail.com or doctor@gerak.com'}
                  required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {authType === 'signin' && (
                <p className="text-[10px] text-on-surface-variant/70 font-ui mt-1">
                  Patients use @gmail.com • Doctors use @gerak.com
                </p>
              )}
            </div>

            <div className="space-y-base">
              <div className="flex justify-between items-center">
                <label className="text-label-md font-ui font-medium text-on-surface-variant" htmlFor="password">Password</label>
                <div className={\`transition-all duration-300 overflow-hidden \${authType === 'signup' ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'}\`}>
                  <a className="text-label-md font-ui text-brand-blue hover:text-blue-400 transition-colors whitespace-nowrap" href="#">Forgot Password?</a>
                </div>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-sm transition-colors group-focus-within:text-brand-blue">lock</span>
                <input 
                  className="w-full bg-surface-container border border-outline-variant/40 rounded-md py-md pl-xl pr-md text-on-surface text-body-sm placeholder:text-outline/60 transition-all font-ui focus:border-brand-blue" 
                  id="password" placeholder="••••••••••••" required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className={\`transition-all duration-500 overflow-hidden \${authType === 'signup' ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}\`}>
              <div className="space-y-base mt-sm">
                <label className="text-label-md font-ui font-medium text-on-surface-variant" htmlFor="confirmPassword">Confirm Password</label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-outline text-sm transition-colors group-focus-within:text-brand-blue">lock</span>
                  <input 
                    className="w-full bg-surface-container border border-outline-variant/40 rounded-md py-md pl-xl pr-md text-on-surface text-body-sm placeholder:text-outline/60 transition-all font-ui focus:border-brand-blue" 
                    id="confirmPassword" placeholder="••••••••••••" required={authType === 'signup'} type="password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className={\`transition-all duration-500 overflow-hidden \${authType === 'signin' ? 'max-h-[40px] opacity-100 py-xs' : 'max-h-0 opacity-0 py-0'}\`}>
              <div className="flex items-center gap-xs">
                <input 
                  className="w-4 h-4 rounded border-outline-variant bg-surface-container text-brand-blue focus:ring-brand-blue focus:ring-offset-surface-container-low cursor-pointer transition-colors" 
                  id="remember" type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)}
                />
                <label className="text-label-md font-ui text-on-surface-variant cursor-pointer select-none hover:text-on-surface transition-colors" htmlFor="remember">
                  Remember device for 30 days
                </label>
              </div>
            </div>

            <button 
              className={\`w-full text-white font-ui font-bold py-md rounded-md transition-all duration-300 flex items-center justify-center gap-xs active:scale-[0.99] mt-base cursor-pointer \${submitStatus === 'success' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-brand-blue hover:bg-blue-600'}\`}
              disabled={submitStatus === 'submitting'} type="submit"
            >
              {submitStatus === 'idle' && (
                <><span>{authType === 'signin' ? 'Sign In' : 'Create Patient Account'}</span><span className="material-symbols-outlined text-sm">arrow_forward</span></>
              )}
              {submitStatus === 'submitting' && (
                <><span className="material-symbols-outlined animate-spin text-sm">progress_activity</span><span>Authenticating...</span></>
              )}
              {submitStatus === 'success' && (
                <><span className="material-symbols-outlined text-sm">check_circle</span><span>Access Granted</span></>
              )}
            </button>
          </form>
        </div>

        <div className="mt-lg flex justify-center items-center gap-md">
          <a className="text-label-md font-ui text-on-surface-variant hover:text-brand-blue transition-colors" href="#">Privacy Policy</a>
          <span className="w-1 h-1 rounded-full bg-outline-variant/40"></span>
          <a className="text-label-md font-ui text-on-surface-variant hover:text-brand-blue transition-colors" href="#">Terms of Use</a>
          <span className="w-1 h-1 rounded-full bg-outline-variant/40"></span>
          <a className="text-label-md font-ui text-on-surface-variant hover:text-brand-blue transition-colors" href="#">Support</a>
        </div>
      </div>
    </>
  )
}
`;

fs.writeFileSync(authPagePath, authPageCode);

// ----------------------------------------------------
// Step 3: Refactor App.tsx
// ----------------------------------------------------

const appPath = path.join(srcDir, 'App.tsx');
let appCode = fs.readFileSync(appPath, 'utf8');

// 1. Update imports
const importReplacements = {
  "./pages/Onboarding": "./pages/onboarding/Onboarding",
  "./pages/SymptomsAssessment": "./pages/assessment/SymptomsAssessment",
  "./pages/BehavioralLifestyle": "./pages/assessment/BehavioralLifestyle",
  "./pages/DiagnosticsUpload": "./pages/diagnostics/DiagnosticsUpload",
  "./pages/DiagnosticResults": "./pages/diagnostics/DiagnosticResults",
  "./pages/LoadingScreen": "./pages/onboarding/LoadingScreen",
  "./pages/DailyActionDashboard": "./pages/dashboard/DailyActionDashboard",
  "./pages/RoutinePage": "./pages/treatment/RoutinePage",
  "./pages/MasteryPage": "./pages/treatment/MasteryPage",
  "./pages/CareNetworkPage": "./pages/treatment/CareNetworkPage",
  "./pages/RoadmapPage": "./pages/treatment/RoadmapPage",
};

for (const [oldImport, newImport] of Object.entries(importReplacements)) {
  appCode = appCode.replace(oldImport, newImport);
}

// Add AuthPage import
appCode = appCode.replace("import LandingPage from './pages/landing/LandingPage'", "import LandingPage from './pages/landing/LandingPage'\nimport AuthPage from './features/auth/AuthPage'");

// 2. Remove old state from App.tsx (auth-related)
appCode = appCode.replace(/const \[authType, setAuthType\].*?\n/g, '');
appCode = appCode.replace(/const \[fullName, setFullName\].*?\n/g, '');
appCode = appCode.replace(/const \[phone, setPhone\].*?\n/g, '');
appCode = appCode.replace(/const \[email, setEmail\].*?\n/g, '');
appCode = appCode.replace(/const \[password, setPassword\].*?\n/g, '');
appCode = appCode.replace(/const \[confirmPassword, setConfirmPassword\].*?\n/g, '');
appCode = appCode.replace(/const \[remember, setRemember\].*?\n/g, '');
appCode = appCode.replace(/const \[submitStatus, setSubmitStatus\].*?\n/g, '');
appCode = appCode.replace(/const \[showRedirectToast, setShowRedirectToast\].*?\n/g, '');
appCode = appCode.replace(/const \[error, setError\].*?\n/g, '');

// Remove handleToggle & handleSubmit from App.tsx
const handleToggleMatch = /const handleToggle = .*?\n  \}/s;
appCode = appCode.replace(handleToggleMatch, '');

const handleSubmitMatch = /const handleSubmit = .*?\n  \}/s;
appCode = appCode.replace(handleSubmitMatch, '');

// 3. Replace the huge return block in App.tsx with just the new AuthPage logic
// The return block starts at `  return (` and ends at the end of the file before `}`
const appReturnStart = appCode.indexOf('  return (\n    <main className="flex h-screen');
if (appReturnStart !== -1) {
  const newReturn = `  return (
    <main className="flex h-screen w-screen overflow-hidden bg-background text-on-background font-body-md select-none">
      {/* Left Side: Clinical Knee Visualization */}
      <section className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-surface-container-lowest">
        <img 
          alt="SteadyGerak Clinical Visualization" 
          className="absolute inset-0 w-full h-full object-cover object-center brightness-90 transition-transform duration-10000 ease-out scale-105" 
          src="https://lh3.googleusercontent.com/aida/ADBb0uidtwX2_2PhFYTPMB_HkGSPDnDFJzhiXTxN5BLDnmxCT2u1RuXXHq-Wz3bjMuFi4F9Cfr_aht4ab2fkZ08z1v5giey4IVZFZE-TAIuxqpQIUd8W3G6-KQvYCuePYhR05uSSNBxCyTHJoDcBZBuF-QLs9BP7wvhpKLIfUMe_wH5taXN-t-5hBZq4fAtenGDcWrQSuNPPAQL1ASUIl17N_0diVfHQokPEOsRPHC-9sQ8CS8rTdEOqATzFz6U" 
        />
        {/* Branding Overlay */}
        <div className={\`relative z-10 flex flex-col justify-end p-xl w-full h-full bg-gradient-to-t from-background/90 via-transparent to-transparent transition-all duration-1000 \${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}\`}>
          <div className="mb-sm flex items-baseline gap-md flex-wrap">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-brand-blue animate-pulse" style={{ fontSize: '32px' }}>medical_services</span>
              <h1 className="font-display text-headline-xl text-on-surface tracking-tight">SteadyGerak</h1>
            </div>
            <p className="font-display italic text-headline-md text-primary opacity-90">
              — Precision Clinical Systems for the Modern Era
            </p>
          </div>
        </div>
      </section>

      {/* Right Side: Interaction Portal */}
      <section className="flex-1 flex flex-col p-md bg-surface-dim relative overflow-y-auto">
        <AuthPage 
          mounted={mounted} 
          onAuthSuccess={(authType) => {
            if (authType === 'signup') {
              setCurrentView('loading')
            } else {
              setCurrentView('action_dashboard')
            }
          }} 
        />
      </section>
    </main>
  )
}

export default App
`;
  appCode = appCode.substring(0, appReturnStart) + newReturn;
}

// Write back to App.tsx
fs.writeFileSync(appPath, appCode);

console.log("Refactoring complete!");
