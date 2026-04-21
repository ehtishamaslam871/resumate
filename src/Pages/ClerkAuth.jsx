import React, { useMemo, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { SignIn, SignUp, useAuth } from '@clerk/clerk-react'
import { ChevronRight, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import Navbar from '../components/Navbar'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const roleOptions = [
  { value: 'job_seeker', label: 'Job Seeker' },
  { value: 'recruiter', label: 'Recruiter' },
]

function ClerkAuthInner() {
  const { isSignedIn } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const mode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  const [role, setRole] = useState(localStorage.getItem('pendingAuthRole') || 'job_seeker')

  const appearance = useMemo(
    () => ({
      variables: {
        colorPrimary: '#06b6d4',
        colorBackground: '#0b1225',
        colorInputBackground: '#101a33',
        colorInputText: '#f8fafc',
        colorText: '#e2e8f0',
        borderRadius: '12px',
      },
      elements: {
        rootBox: 'w-full',
        card: 'shadow-none bg-transparent border-0 p-0',
        headerTitle: 'text-gray-100 font-display',
        headerSubtitle: 'text-gray-400',
        formButtonPrimary: 'bg-gradient-to-r from-cyan-500 to-violet-500 text-black font-bold hover:brightness-110',
        socialButtonsBlockButton: 'bg-dark-800/70 border border-dark-600 text-gray-100 hover:bg-dark-700',
        socialButtonsBlockButtonText: 'text-gray-100',
        dividerText: 'text-gray-500',
        formFieldInput: 'bg-dark-900/60 border border-dark-600 text-gray-100',
        footerActionText: 'text-slate-400',
        footerActionLink: 'text-cyan-400 hover:text-cyan-300',
      },
    }),
    []
  )

  if (isSignedIn) {
    return <Navigate to="/clerk-sync" replace />
  }

  const saveRole = (nextRole) => {
    localStorage.setItem('pendingAuthRole', nextRole)
    setRole(nextRole)
  }

  return (
    <div className="min-h-screen bg-dark-950 overflow-hidden">
      <Navbar />
      <div className="pointer-events-none absolute -top-28 -left-24 w-72 h-72 rounded-full blur-3xl bg-neon-cyan/20" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 w-72 h-72 rounded-full blur-3xl bg-neon-purple/20" />

      <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid lg:grid-cols-[1.05fr_0.95fr] gap-8 lg:gap-10 items-stretch relative z-10">
        <section className="card-glass-hover p-7 md:p-10 flex flex-col justify-between">
          <div>
            <p className="badge-primary mb-4 inline-flex">
              <Sparkles className="w-3.5 h-3.5" />
              Clerk Authentication
            </p>
            <h1 className="text-4xl md:text-5xl leading-tight font-display font-bold text-gray-100 mb-4">
              Secure sign-in, zero auth friction
            </h1>
            <p className="text-gray-400 text-lg max-w-xl mb-7">
              Continue with Google or Apple, or use email. We sync your identity to ResuMate and keep role-based access intact.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-neon-cyan/15 border border-neon-cyan/30 flex items-center justify-center text-neon-cyan">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-gray-100 font-semibold">Clerk handles secure auth</p>
                  <p className="text-gray-400 text-sm">OAuth, sessions, and account verification are managed for you.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-xl bg-neon-purple/15 border border-neon-purple/30 flex items-center justify-center text-neon-purple">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <p className="text-gray-100 font-semibold">Instant profile sync</p>
                  <p className="text-gray-400 text-sm">After sign-in, we auto-create or sync your MongoDB profile and role.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              type="button"
              onClick={() => {
                const next = mode === 'signup' ? 'signin' : 'signup'
                setSearchParams({ mode: next })
              }}
              className="btn-secondary"
            >
              {mode === 'signup' ? 'Already registered? Sign In' : 'Need an account? Sign Up'}
            </button>
            <button type="button" onClick={() => navigate('/')} className="btn-ghost ml-2">
              Back Home
            </button>
          </div>
        </section>

        <section className="card-glass-hover p-5 sm:p-7 md:p-8 flex flex-col">
          <div className="inline-flex bg-dark-900/80 p-1 rounded-xl border border-dark-700/60 mb-5 self-start">
            <button
              type="button"
              onClick={() => setSearchParams({ mode: 'signin' })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'signin'
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ mode: 'signup' })}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                mode === 'signup'
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Sign Up
            </button>
          </div>

          {mode === 'signup' && (
            <div className="mb-4 space-y-2">
              <p className="text-xs uppercase tracking-wide text-gray-500">Choose account role</p>
              <div className="grid grid-cols-2 gap-2">
                {roleOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => saveRole(option.value)}
                    className={`py-2 rounded-lg transition-all duration-300 font-medium text-xs sm:text-sm ${
                      role === option.value
                        ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950 shadow-lg shadow-neon-cyan/30'
                        : 'bg-dark-800/60 text-gray-400 border border-dark-700/50 hover:bg-dark-700'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-neon-cyan/50 via-neon-purple/40 to-neon-cyan/30 flex-1">
            <div className="rounded-2xl bg-dark-900/80 p-3 sm:p-4">
              {mode === 'signup' ? (
                <SignUp
                  routing="path"
                  path="/clerk-auth"
                  appearance={appearance}
                  forceRedirectUrl="/clerk-sync"
                  signInUrl="/clerk-auth"
                />
              ) : (
                <SignIn
                  routing="path"
                  path="/clerk-auth"
                  appearance={appearance}
                  forceRedirectUrl="/clerk-sync"
                  signUpUrl="/clerk-auth?mode=signup"
                />
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-4 inline-flex items-center gap-1">
            Your data is synced to ResuMate profile after auth <ChevronRight className="w-3 h-3" />
          </p>
        </section>
      </div>
    </div>
  )
}

export default function ClerkAuthPage() {
  if (!CLERK_KEY) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
        <div className="card-glass p-8 rounded-2xl border border-red-500/30 max-w-lg text-center">
          <h1 className="text-2xl font-display font-bold text-gray-100 mb-3">Clerk is not configured</h1>
          <p className="text-gray-400">Add VITE_CLERK_PUBLISHABLE_KEY in frontend env and CLERK_SECRET_KEY in backend env, then restart servers.</p>
        </div>
      </div>
    )
  }

  return <ClerkAuthInner />
}
