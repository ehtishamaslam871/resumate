import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown } from 'lucide-react'
import Navbar from '../components/Navbar'
import ForgotPasswordModal from '../components/ForgotPasswordModal'
import { authAPI, setAuthToken } from '../services/api'

// Country data with codes and flags
const COUNTRIES = [
  { code: '+1', flag: '🇺🇸', name: 'United States', shortCode: 'US' },
  { code: '+44', flag: '🇬🇧', name: 'United Kingdom', shortCode: 'GB' },
  { code: '+91', flag: '🇮🇳', name: 'India', shortCode: 'IN' },
  { code: '+86', flag: '🇨🇳', name: 'China', shortCode: 'CN' },
  { code: '+81', flag: '🇯🇵', name: 'Japan', shortCode: 'JP' },
  { code: '+33', flag: '🇫🇷', name: 'France', shortCode: 'FR' },
  { code: '+49', flag: '🇩🇪', name: 'Germany', shortCode: 'DE' },
  { code: '+39', flag: '🇮🇹', name: 'Italy', shortCode: 'IT' },
  { code: '+34', flag: '🇪🇸', name: 'Spain', shortCode: 'ES' },
  { code: '+61', flag: '🇦🇺', name: 'Australia', shortCode: 'AU' },
  { code: '+64', flag: '🇳🇿', name: 'New Zealand', shortCode: 'NZ' },
  { code: '+1', flag: '🇨🇦', name: 'Canada', shortCode: 'CA' },
  { code: '+55', flag: '🇧🇷', name: 'Brazil', shortCode: 'BR' },
  { code: '+52', flag: '🇲🇽', name: 'Mexico', shortCode: 'MX' },
  { code: '+82', flag: '🇰🇷', name: 'South Korea', shortCode: 'KR' },
  { code: '+60', flag: '🇲🇾', name: 'Malaysia', shortCode: 'MY' },
  { code: '+65', flag: '🇸🇬', name: 'Singapore', shortCode: 'SG' },
  { code: '+66', flag: '🇹🇭', name: 'Thailand', shortCode: 'TH' },
  { code: '+92', flag: '🇵🇰', name: 'Pakistan', shortCode: 'PK' },
  { code: '+90', flag: '🇹🇷', name: 'Turkey', shortCode: 'TR' },
]

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
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
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
    
    // Modern password validation
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return false
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number')
      return false
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('Password must contain at least one special character (!@#$%^&*...)')
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
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // If we're in forgot-password flow, ignore normal submit
    if (forgotMode) return

    if (!validateForm()) return

    try {
      if (isLogin) {
        // Login with API
        const response = await authAPI.login({
          email,
          password,
        })

        // Save token and user
        setAuthToken(response.token, response.user)

        // Redirect based on role (case-insensitive)
        const userRole = (response.user.role || '').toLowerCase()
        if (userRole === 'recruiter') navigate('/recruiter')
        else if (userRole === 'admin') navigate('/admin')
        else navigate('/upload')
      } else {
        // Sign up with API
        const response = await authAPI.register({
          name,
          email,
          password,
          role,
          phone: `${selectedCountry.code}${phone}`,
        })

        // Auto-login user and redirect to dashboard
        setAuthToken(response.token, response.user)
        
        // Redirect based on role (case-insensitive)
        const userRole = (response.user.role || '').toLowerCase()
        if (userRole === 'recruiter') navigate('/recruiter')
        else if (userRole === 'admin') navigate('/admin')
        else navigate('/upload')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    }
  }

  // forgot-password flow moved to `ForgotPasswordModal` component

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <div className="flex items-center justify-center px-6 py-20 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-neon-purple/20 to-neon-pink/20 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
        </div>
        
        <div className="w-full max-w-md relative z-10">
          {/* Header */}
          <div className="text-center mb-8 animate-fade-in">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple 
              flex items-center justify-center text-dark-950 font-extrabold group hover:shadow-lg hover:shadow-neon-cyan/50 transition-all">
                RM
              </div>
              <span className="text-neon-cyan text-lg font-bold">ResuMate</span>
            </div>
            <h1 className="text-4xl font-display font-bold mb-2 text-gray-100">
              {isLogin ? 'Welcome Back' : 'Join ResuMate'}
            </h1>
            <p className="text-gray-400 text-lg">
              {isLogin ? 'Sign in to your account' : 'Create your account to get started'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="card-glass p-8">
            {/* Role Selection */}
            <div className="mb-6">
              <label className="block text-gray-300 mb-3 font-semibold">I am a:</label>
              <div className="grid grid-cols-3 gap-2">
                {['Job Seeker', 'recruiter', 'admin'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-2 rounded-lg transition-all duration-300 font-medium ${
                      role === r 
                        ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950 shadow-lg shadow-neon-cyan/50' 
                        : 'bg-dark-800 text-gray-300 hover:bg-dark-700 border border-dark-700/50'
                    }`}
                  >
                    {r === 'Job Seeker' ? 'Job Seeker' : r === 'recruiter' ? 'Recruiter' : 'Admin'}
                  </button>
                ))}
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
                  className="input-modern w-full"
                  required
                />
              </div>
            )}

            {/* Phone (only for sign up) */}
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-gray-300 text-sm mb-2 font-semibold">Phone Number</label>
                <div className="flex gap-2">
                  {/* Country Code Dropdown */}
                  <div className="relative w-24">
                    <button
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="input-modern w-full p-3 flex items-center justify-between"
                    >
                      <span className="text-lg">{selectedCountry.flag}</span>
                      <ChevronDown size={16} className="text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showCountryDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 card-glass border border-dark-700/50 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                        {COUNTRIES.map((country) => (
                          <button
                            key={country.shortCode}
                            type="button"
                            onClick={() => {
                              setSelectedCountry(country)
                              setShowCountryDropdown(false)
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-dark-700/50 transition flex items-center gap-2"
                          >
                            <span className="text-lg">{country.flag}</span>
                            <span className="text-xs text-gray-400">{country.code}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Phone Number Input */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      placeholder="Enter your number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="input-modern w-full pl-12"
                      required
                    />
                    <span className="absolute left-3 top-3 text-gray-400 text-sm font-medium">
                      {selectedCountry.code}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Full number: {selectedCountry.code}{phone}</p>
              </div>
            )}

            {/* Email Field */}
            <div className="mb-4">
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern w-full"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-6 relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern w-full pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-neon-cyan transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {/* Confirm Password (only for sign up) */}
            {!isLogin && (
              <div className="mb-6 relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern w-full pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-neon-cyan transition"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            )}

            {/* Password Strength Indicator (only for sign up) */}
            {!isLogin && password && (
              <div className="mb-6 p-4 card-glass rounded-lg text-sm">
                <p className="text-gray-300 mb-2 font-medium">Password requirements:</p>
                <ul className="space-y-1 text-xs">
                  <li className={password.length >= 8 ? 'text-green-400' : 'text-gray-400'}>
                    ✓ At least 8 characters {password.length >= 8 ? '✓' : ''}
                  </li>
                  <li className={/[A-Z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                    ✓ One uppercase letter {/[A-Z]/.test(password) ? '✓' : ''}
                  </li>
                  <li className={/[a-z]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                    ✓ One lowercase letter {/[a-z]/.test(password) ? '✓' : ''}
                  </li>
                  <li className={/[0-9]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                    ✓ One number {/[0-9]/.test(password) ? '✓' : ''}
                  </li>
                  <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-400' : 'text-gray-400'}>
                    ✓ One special character {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✓' : ''}
                  </li>
                </ul>
              </div>
            )}

            {/* Messages */}
            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm flex items-start gap-3">
                <span className="text-lg mt-0.5">⚠️</span>
                <div>{error}</div>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm flex items-start gap-3">
                <span className="text-lg mt-0.5">✅</span>
                <div>{success}</div>
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
                  className="btn-primary w-full mb-4"
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
                        className="btn-secondary w-full"
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
                          className="text-sm text-gray-400 hover:text-neon-cyan transition"
                        >
                          Or continue signing in
                        </button>

                        <button
                          type="button"
                          onClick={() => setForgotMode(true)}
                          className="text-sm text-neon-cyan hover:text-neon-cyan/80 transition"
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
                      className="text-neon-cyan hover:text-neon-cyan/80 text-sm transition"
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