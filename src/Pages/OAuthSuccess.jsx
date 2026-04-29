import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { setAuthToken } from '../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const decodeBase64Json = (encoded) => {
  if (!encoded) return null
  try {
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const pad = '='.repeat((4 - (normalized.length % 4)) % 4)
    return JSON.parse(atob(normalized + pad))
  } catch {
    return null
  }
}

const normalizeRole = (role) => {
  if (!role) return 'job_seeker'
  const cleaned = role.toLowerCase().replace(/[\s_-]/g, '')
  if (cleaned === 'admin') return 'admin'
  if (cleaned === 'recruiter') return 'recruiter'
  return 'job_seeker'
}

export default function OAuthSuccess() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [error, setError] = useState('')

  useEffect(() => {
    const completeOauth = async () => {
      const token = params.get('token')
      const encodedUser = params.get('user')
      const oauthError = params.get('error')

      if (oauthError) {
        navigate(`/auth?error=${encodeURIComponent(oauthError)}`, { replace: true })
        return
      }

      if (!token) {
        navigate('/auth?error=Social login failed. Missing access token.', { replace: true })
        return
      }

      let user = decodeBase64Json(encodedUser)

      if (!user) {
        try {
          const response = await fetch(`${API_BASE_URL}/profile/me`, {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })

          if (response.ok) {
            const data = await response.json()
            if (data?.user) {
              user = {
                id: data.user._id || data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                phone: data.user.phone,
              }
            }
          }
        } catch {
          // fallback handled below
        }
      }

      if (!user) {
        setError('Unable to complete social sign-in. Please try again.')
        setTimeout(() => {
          navigate('/auth?error=Unable to complete social sign-in. Please try again.', { replace: true })
        }, 1200)
        return
      }

      const normalizedUser = {
        ...user,
        id: user.id || user._id,
        role: normalizeRole(user.role),
      }

      setAuthToken(token, normalizedUser)

      if (normalizedUser.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (normalizedUser.role === 'recruiter') {
        navigate('/recruiter', { replace: true })
      } else {
        navigate('/upload', { replace: true })
      }
    }

    completeOauth()
  }, [navigate, params])

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-6">
      <div className="card-glass p-8 rounded-2xl border border-dark-700/60 max-w-md w-full text-center">
        {error ? (
          <>
            <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold text-gray-100 mb-2">Social Sign-In Failed</h1>
            <p className="text-gray-400 text-sm">{error}</p>
          </>
        ) : (
          <>
            <Loader2 className="w-8 h-8 text-neon-cyan animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-display font-bold text-gray-100 mb-2">Completing Sign-In</h1>
            <p className="text-gray-400 text-sm">Please wait while we securely log you in.</p>
          </>
        )}
      </div>
    </div>
  )
}
