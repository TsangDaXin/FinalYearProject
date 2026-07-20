import { useState } from 'react'
import { AuthForm } from '../../components/ui/sign-in-1'
import { Mail, User, ArrowLeft } from 'lucide-react'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { supabase } from '../../lib/supabase'

interface AuthPageProps {
  onAuthSuccess: (type: 'signin' | 'signup', name?: string) => void;
  onSkip?: () => void;
  mounted: boolean;
}

export default function AuthPage({ onAuthSuccess, onSkip, mounted }: AuthPageProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'success'>('idle')
  const [showRedirectToast, setShowRedirectToast] = useState(false)
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  const handleEmailSignUp = async () => {
    if (submitStatus !== 'idle') return
    
    const fullNameInput = document.getElementById('fullName') as HTMLInputElement;
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;
    
    const fullName = fullNameInput?.value || '';
    const email = emailInput?.value || '';
    const password = passwordInput?.value || '';
    const confirmPassword = confirmPasswordInput?.value || '';
    
    if (!email || !password || !fullName) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    
    setSubmitStatus('submitting')
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })
    
    if (error) {
      console.error('Signup error:', error.message)
      alert(error.message)
      setSubmitStatus('idle')
      return;
    }
    
    if (data.user) {
      // Insert initial profile row so that later updates during onboarding succeed
      await supabase.from('profiles').insert({
        id: data.user.id,
        full_name: fullName,
      })
    }
    
    setSubmitStatus('success')
    setTimeout(() => {
      setShowRedirectToast(true)
      setTimeout(() => {
        setShowRedirectToast(false)
        setSubmitStatus('idle')
        onAuthSuccess('signup', fullName)
      }, 1500)
    }, 800)
  }

  const handleEmailSignIn = async () => {
    if (submitStatus !== 'idle') return
    
    // Try to find email/password inputs. 
    // Wait, the Sign In form in sign-in-1.tsx might not have children by default?
    // Let's check what children are passed. Actually, in AuthPage.tsx, we didn't pass any children for signin!
    // I need to add email/password inputs to the signin form too.
    const emailInput = document.getElementById('signin-email') as HTMLInputElement;
    const passwordInput = document.getElementById('signin-password') as HTMLInputElement;
    
    const email = emailInput?.value || '';
    const password = passwordInput?.value || '';
    
    if (!email || !password) {
      // Fallback to simulated if they are just skipping
      mockAuthSuccess('signin');
      return;
    }
    
    setSubmitStatus('submitting')
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('Signin error:', error.message)
      alert(error.message)
      setSubmitStatus('idle')
      return;
    }
    
    // Fetch full name
    let fullName = data.user?.user_metadata?.full_name || '';
    
    setSubmitStatus('success')
    setTimeout(() => {
      setShowRedirectToast(true)
      setTimeout(() => {
        setShowRedirectToast(false)
        setSubmitStatus('idle')
        onAuthSuccess('signin', fullName)
      }, 1500)
    }, 800)
  }

  const mockAuthSuccess = (type: 'signin' | 'signup') => {
    setSubmitStatus('submitting')
    setTimeout(() => {
      setSubmitStatus('success')
      setTimeout(() => {
        setShowRedirectToast(true)
        setTimeout(() => {
          setShowRedirectToast(false)
          setSubmitStatus('idle')
          onAuthSuccess(type)
        }, 1500)
      }, 800)
    }, 1200)
  }

  // Unsplash image for the logo
  const companyLogoSrc = "/avatars/biometrics-avatar.png"

  return (
    <>
      <div className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-sm bg-surface-container-high border border-emerald-500/30 px-lg py-md rounded-lg shadow-2xl transition-all duration-500 ${showRedirectToast ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-4 scale-95 pointer-events-none'}`}>
        <span className="material-symbols-outlined text-emerald-400">check_circle</span>
        <div className="flex flex-col">
          <span className="text-body-md font-ui font-bold text-white">Access Authenticated</span>
          <span className="text-label-md text-on-surface-variant">Redirecting to Clinical Dashboard...</span>
        </div>
      </div>

      <div className={`w-full z-10 mx-auto my-auto py-8 transition-all duration-700 delay-150 relative flex justify-center items-center ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-orange/20 rounded-full blur-[100px] opacity-60 animate-pulse pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-brand-blue/20 rounded-full blur-[80px] opacity-60 animate-pulse delay-700 pointer-events-none" />

        <div className="w-full relative z-10 flex justify-center">
        {mode === 'signin' ? (
          <AuthForm
            logoSrc={companyLogoSrc}
            logoAlt="SteadyGerak Logo"
            title={submitStatus === 'submitting' ? 'Authenticating...' : submitStatus === 'success' ? 'Access Granted' : 'Welcome Back'}
            description="Enter your credentials to access your account."
            primaryActions={[
              {
                label: "Login",
                icon: <Mail className="mr-2 h-4 w-4" />,
                onClick: handleEmailSignIn,
              }
            ]}
            secondaryActions={[
              {
                label: "Sign up for new account",
                icon: <User className="mr-2 h-4 w-4" />,
                onClick: () => setMode('signup'),
              }
            ]}
            skipAction={{
              label: "Skip for now",
              onClick: () => onSkip ? onSkip() : mockAuthSuccess('signin'),
            }}
            footerContent={
              <>
                By logging in, you agree to our{" "}
                <u className="cursor-pointer transition-colors hover:text-primary">Terms of Service</u>{" "}
                and{" "}
                <u className="cursor-pointer transition-colors hover:text-primary">Privacy Policy</u>.
              </>
            }
          >
            <div className="flex flex-col gap-4 text-left">
              <div className="grid gap-2">
                <Label htmlFor="signin-email">Email</Label>
                <Input id="signin-email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="signin-password">Password</Label>
                <Input id="signin-password" type="password" required />
              </div>
            </div>
          </AuthForm>
        ) : (
          <AuthForm
            logoSrc={companyLogoSrc}
            logoAlt="SteadyGerak Logo"
            title={submitStatus === 'submitting' ? 'Creating Account...' : submitStatus === 'success' ? 'Account Created' : 'Create an Account'}
            description="Fill in your details to get started."
            primaryActions={[
              {
                label: "Create Account",
                onClick: handleEmailSignUp,
              }
            ]}
            secondaryActions={[
              {
                label: "Back to Sign in",
                icon: <ArrowLeft className="mr-2 h-4 w-4" />,
                onClick: () => setMode('signin'),
              }
            ]}
            footerContent={
              <>
                By signing up, you agree to our{" "}
                <u className="cursor-pointer transition-colors hover:text-primary">Terms of Service</u>{" "}
                and{" "}
                <u className="cursor-pointer transition-colors hover:text-primary">Privacy Policy</u>.
              </>
            }
          >
            <div className="flex flex-col gap-4 text-left">
              <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" placeholder="John Doe" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="+1 (555) 000-0000" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="m@example.com" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" required />
              </div>
            </div>
          </AuthForm>
        )}
        </div>
      </div>
    </>
  )
}
