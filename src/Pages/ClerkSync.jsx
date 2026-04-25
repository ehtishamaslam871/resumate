import React, { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { useAuth, useUser } from '@clerk/clerk-react'
import { authAPI, setAuthToken } from '../services/api'

const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

const normalizeRole = (role) => {
  if (!role) return 'job_seeker'
  const cleaned = String(role).toLowerCase().replace(/[\s_-]/g, '')
  if (cleaned === 'recruiter') return 'recruiter'
  return 'job_seeker'
}

function ClerkSyncInner() {
  const { isLoaded, isSignedIn, getToken } = useAuth()
  const { user } = useUser()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const syncUser = async () => {
      if (!isLoaded) return

      if (!isSignedIn) {
        navigate('/clerk-auth', { replace: true })
        return
      }

      try {
        const clerkToken = await getToken()
        if (!clerkToken) {
          throw new Error('Clerk token missing. Please sign in again.')
        }

        const pendingRole = normalizeRole(sessionStorage.getItem('pendingAuthRole') || 'job_seeker')
        const response = await authAPI.clerkSync(clerkToken, pendingRole)
        setAuthToken(response.token, response.user)
        sessionStorage.removeItem('pendingAuthRole')

        const role = normalizeRole(response.user?.role)
        if (role === 'admin') navigate('/admin', { replace: true })
        else if (role === 'recruiter') navigate('/recruiter', { replace: true })
        else navigate('/upload', { replace: true })
      } catch (err) {
        setError(err.message || 'Unable to complete Clerk sign-in.')
      }
    }

    syncUser()
  }, [isLoaded, isSignedIn, getToken, navigate, user])

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
        <div className="card-glass p-8 rounded-2xl border border-red-500/30 max-w-md w-full text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-display font-bold text-gray-100 mb-2">Clerk Sync Failed</h1>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button type="button" onClick={() => navigate('/clerk-auth')} className="btn-primary w-full">
            Back to Clerk Sign-In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
      <div className="card-glass p-8 rounded-2xl border border-dark-700/60 max-w-md w-full text-center">
        <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
        <h1 className="text-xl font-display font-bold text-gray-100 mb-2">Finalizing Clerk Sign-In</h1>
        <p className="text-gray-400 text-sm">Syncing your Clerk account with ResuMate profile and permissions.</p>
      </div>
    </div>
  )
}

export default function ClerkSyncPage() {
  if (!CLERK_KEY) {
    return <Navigate to="/auth?error=Clerk is not configured" replace />
  }

  return <ClerkSyncInner />
}
