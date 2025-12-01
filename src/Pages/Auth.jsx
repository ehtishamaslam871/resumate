import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ForgotPasswordModal from '../components/ForgotPasswordModal'

export default function AuthModal() {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [forgotMode, setForgotMode] = useState(false)
  const [role, setRole] = useState('Job Seeker')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const navigate = useNavigate()

  // Helper: demo/social sign-in fallback when no real client ID is configured
  const handleSocialLoginDemo = (provider) => {
    // prompt for name/email to simulate an external provider response
    const demoEmail = window.prompt(`Enter email to sign in with ${provider} (demo):`, '')
    if (!demoEmail || !demoEmail.includes('@')) return setError('Valid email required for demo social sign-in')
    const demoName = window.prompt('Enter display name (demo):', demoEmail.split('@')[0]) || ''

    const USERS_KEY = 'resumate_users'
    const CURRENT_USER_KEY = 'resumate_user'
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')

    // find or create user
    let user = users.find(u => u.email === demoEmail)
    if (!user) {
      user = { id: Date.now().toString(), name: demoName, email: demoEmail, password: '', role: role }
      users.push(user)
      localStorage.setItem(USERS_KEY, JSON.stringify(users))
    }

    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
    // navigate based on chosen role (same as normal login)
    if (role === 'recruiter') navigate('/recruiter')
    else if (role === 'admin') navigate('/admin')
    else navigate('/upload')
  }

  // Try to use Google Identity Services if a client ID is configured in localStorage under GOOGLE_CLIENT_ID
  const handleGoogleSignIn = () => {
    const clientId = localStorage.getItem('GOOGLE_CLIENT_ID') || window.__GOOGLE_CLIENT_ID__
    if (!clientId) return handleSocialLoginDemo('Google')

    // dynamically load Google Identity Services script then initialize
    if (!window.google || !window.google.accounts) {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = () => initGoogle(clientId)
      document.head.appendChild(script)
    } else {
      initGoogle(clientId)
    }
  }

  const initGoogle = (clientId) => {
    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (resp) => {
          // resp contains credential (JWT) — for demo we'll decode basic info if possible
          // For full verification, exchange the credential on a backend. Here we fallback to demo flow.
          // Attempt to decode name/email from JWT (not secure) — otherwise prompt demo fallback
          try {
            const payload = JSON.parse(atob(resp.credential.split('.')[1]))
            const email = payload.email
            const name = payload.name || email.split('@')[0]
            // perform local sign-in/up
            const USERS_KEY = 'resumate_users'
            const CURRENT_USER_KEY = 'resumate_user'
            const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
            let user = users.find(u => u.email === email)
            if (!user) {
              user = { id: Date.now().toString(), name, email, password: '', role }
              users.push(user)
              localStorage.setItem(USERS_KEY, JSON.stringify(users))
            }
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
            if (role === 'recruiter') navigate('/recruiter')
            else if (role === 'admin') navigate('/admin')
            else navigate('/upload')
          } catch (err) {
            console.warn('Google credential parse failed, falling back to demo prompt', err)
            handleSocialLoginDemo('Google')
          }
        }
      })

      // render Google's button in a container if present, otherwise prompt the one-tap
      const container = document.getElementById('google-signin-button')
      if (container) {
        // clear previous
        container.innerHTML = ''
        window.google.accounts.id.renderButton(container, { theme: 'filled_blue', size: 'large' })
      } else {
        window.google.accounts.id.prompt()
      }
    } catch (e) {
      console.error('Google init error', e)
      handleSocialLoginDemo('Google')
    }
  }

  // Simple validation
  const validateForm = () => {
    if (!email.includes('@')) {
      setError('Please enter a valid email')
      return false
    }
    if (password.length < 3) {
      setError('Password must be at least 3 characters')
      return false
    }
    if (!isLogin) {
      if (name.length < 2) {
        setError('Please enter your full name')
        return false
      }
      // phone: require 7-15 digits, allow spaces, dashes and leading +
      const phoneNorm = (phone || '').trim()
      if (!/^\+?[0-9\s-]{7,15}$/.test(phoneNorm)) {
        setError('Please enter a valid phone number (7-15 digits)')
        return false
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        return false
      }
    }
    return true
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // If we're in forgot-password flow, ignore normal submit
    if (forgotMode) return

    if (!validateForm()) return

    const USERS_KEY = 'resumate_users'
    const CURRENT_USER_KEY = 'resumate_user'
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')

    if (isLogin) {
      // Login logic
      const user = users.find(u => u.email === email && u.password === password && u.role === role)
      if (user) {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user))
        if (role === 'recruiter') navigate('/recruiter')
        else if (role === 'admin') navigate('/admin')
        else navigate('/upload')
      } else {
        setError('Invalid email, password, or role')
      }
    } else {
      // Sign up logic
      const userExists = users.find(u => u.email === email && u.role === role)
      if (userExists) {
        setError('User already exists. Please log in instead.')
        return
      }

      const newUser = { 
        id: Date.now().toString(), 
        name, 
        email, 
        password, 
        phone,
        role 
      }
  users.push(newUser)
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  // Do NOT auto-login after signup — switch to login module so user can sign in
  setSuccess(`Account created as ${role}. Please sign in.`)
  setPassword('')
  setConfirmPassword('')
  setPhone('')
  setIsLogin(true)
    }
  }

  // forgot-password flow moved to `ForgotPasswordModal` component

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 
              flex items-center justify-center text-gray-900 font-extrabold">
                RM
              </div>
              <span className="text-cyan-300 text-lg font-bold">ResuMate</span>
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Join ResuMate'}
            </h1>
            <p className="text-gray-400">
              {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-lg shadow-lg">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-3">I am a:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('Job Seeker')}
                  className={`py-2 rounded-lg transition ${
                    role === 'Job Seeker' 
                      ? 'bg-cyan-500 text-gray-900 font-medium' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Job Seeker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('recruiter')}
                  className={`py-2 rounded-lg transition ${
                    role === 'recruiter' 
                      ? 'bg-cyan-500 text-gray-900 font-medium' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Recruiter
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 rounded-lg transition ${
                    role === 'admin' 
                      ? 'bg-cyan-500 text-gray-900 font-medium' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>

            {/* Name Field (only for sign up) */}
            {!isLogin && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
                  required
                />
              </div>
            )}

            {/* Phone (only for sign up) */}
            {!isLogin && (
              <div className="mb-4">
                <input
                  type="tel"
                  placeholder="Phone (e.g. +1234567890)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
                  required
                />
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
                required
              />
            </div>

            {/* Confirm Password (only for sign up) */}
            {!isLogin && (
              <div className="mb-6">
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
                  required
                />
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-900/30 border border-green-700 rounded-lg text-green-300 text-sm">
                {success}
              </div>
            )}

            {/* Submit / Forgot-password area */}
            {forgotMode ? (
              // Render modal component when forgotMode is active
              <ForgotPasswordModal
                initialEmail={email}
                onClose={() => setForgotMode(false)}
                onSuccess={(msg) => setSuccess(msg)}
              />
            ) : (
              <>
                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-cyan-500 text-gray-900 py-3 rounded-lg font-semibold hover:bg-cyan-600 transition mb-4"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>

                <div className="flex items-center justify-between">
                  {isLogin ? (
                    <div className="space-y-3 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogin(false)
                          setError('')
                          setSuccess('')
                        }}
                        className="w-full py-3 border-2 border-cyan-500 text-cyan-300 rounded-lg font-semibold hover:bg-cyan-500 hover:text-gray-900 transition"
                      >
                        Create Account
                      </button>

                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => {
                            setError('')
                            setSuccess('')
                          }}
                          className="text-sm text-gray-400 hover:text-gray-200"
                        >
                          Or continue signing in
                        </button>

                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-sm text-cyan-300 hover:text-cyan-200"
                        >
                          Forgot password?
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(true)
                        setError('')
                        setSuccess('')
                      }}
                      className="text-cyan-400 hover:text-cyan-300 text-sm"
                    >
                      Already have an account? Sign in
                    </button>
                  )}
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}