import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ChevronDown, User, Mail, Lock, Briefcase, UserCheck, Shield, Loader2 } from 'lucide-react'
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
  const [role, setRole] = useState('job_seeker')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0])
  const [showCountryDropdown, setShowCountryDropdown] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'
  const CLERK_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
  const handleClerkSignIn = () => {
    sessionStorage.setItem('pendingAuthRole', role)
    navigate('/clerk-auth')
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const oauthError = params.get('error')
    if (oauthError) {
      setError(oauthError)
      window.history.replaceState({}, document.title, location.pathname)
    }
  }, [location.pathname, location.search])

  useEffect(() => {
    // Admin can sign in, but cannot self-register through public flow.
    if (!isLogin && role === 'admin') {
      setRole('job_seeker')
    }
  }, [isLogin, role])

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

    setLoading(true)
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
    } finally {
      setLoading(false)
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
              <label className="block text-gray-300 mb-3 font-semibold text-sm">I am a:</label>
              <div className={`grid ${isLogin ? 'grid-cols-3' : 'grid-cols-2'} gap-2`}>
                {[
                  { value: 'job_seeker', label: 'Job Seeker', icon: Briefcase },
                  { value: 'recruiter', label: 'Recruiter', icon: UserCheck },
                  ...(isLogin ? [{ value: 'admin', label: 'Admin', icon: Shield }] : []),
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`py-2.5 rounded-xl transition-all duration-300 font-medium text-sm flex items-center justify-center gap-1.5 ${
                      role === value 
                        ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950 shadow-lg shadow-neon-cyan/30' 
                        : 'bg-dark-800/60 text-gray-400 hover:bg-dark-700 border border-dark-700/50 hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              {isLogin && role === 'admin' && (
                <p className="text-xs text-gray-500 mt-2">Admin access is sign-in only. New admin accounts must be invited.</p>
              )}
            </div>

            {/* Name Field (only for sign up) */}
            {!isLogin && (
              <div className="mb-4 relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-modern w-full pl-10"
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
            <div className="mb-4 relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern w-full pl-10"
                required
              />
            </div>

            {/* Password Field */}
            <div className="mb-6 relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-modern w-full pl-10 pr-10"
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
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input-modern w-full pl-10 pr-10"
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
            {!isLogin && password && (() => {
              const checks = [
                { pass: password.length >= 8, label: 'At least 8 characters' },
                { pass: /[A-Z]/.test(password), label: 'One uppercase letter' },
                { pass: /[a-z]/.test(password), label: 'One lowercase letter' },
                { pass: /[0-9]/.test(password), label: 'One number' },
                { pass: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), label: 'One special character' },
              ]
              const passCount = checks.filter(c => c.pass).length
              const barColor = passCount <= 1 ? 'bg-red-500' : passCount <= 3 ? 'bg-yellow-500' : passCount <= 4 ? 'bg-neon-cyan' : 'bg-green-500'
              const strengthLabel = passCount <= 1 ? 'Weak' : passCount <= 3 ? 'Fair' : passCount <= 4 ? 'Good' : 'Strong'
              return (
                <div className="mb-6 p-4 card-glass rounded-xl text-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-gray-400 text-xs font-medium">Password strength</p>
                    <span className={`text-xs font-semibold ${passCount <= 1 ? 'text-red-400' : passCount <= 3 ? 'text-yellow-400' : passCount <= 4 ? 'text-neon-cyan' : 'text-green-400'}`}>{strengthLabel}</span>
                  </div>
                  <div className="h-1.5 bg-dark-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${(passCount / 5) * 100}%` }} />
                  </div>
                  <ul className="space-y-1 text-xs">
                    {checks.map((c, i) => (
                      <li key={i} className={`flex items-center gap-2 transition-colors ${c.pass ? 'text-green-400' : 'text-gray-500'}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${c.pass ? 'bg-green-500/20' : 'bg-dark-800'}`}>
                          {c.pass ? '✓' : '○'}
                        </span>
                        {c.label}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })()}

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
            <>
              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mb-4 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Please wait…' : isLogin ? 'Sign In' : 'Create Account'}
              </button>

              {isLogin && (
                <button
                  type="button"
                  onClick={handleClerkSignIn}
                  className="btn-secondary w-full mb-4"
                  disabled={loading || !CLERK_KEY}
                  title={!CLERK_KEY ? 'Clerk is not configured yet' : 'Sign in with Clerk'}
                >
                  {CLERK_KEY ? 'Sign In with Clerk' : 'Sign In with Clerk (Not Configured)'}
                </button>
              )}

              <div className="flex items-center justify-between">
                {isLogin ? (
                  <div className="space-y-3 w-full">
                    <button
                      type="button"
                      disabled={loading || role === 'admin'}
                      onClick={() => {
                        setIsLogin(false)
                        setError('')
                        setSuccess('')
                      }}
                      className="btn-secondary w-full disabled:opacity-45 disabled:cursor-not-allowed"
                      title={role === 'admin' ? 'Admin accounts are invite-only' : 'Create a new account'}
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
          </form>

          {forgotMode && (
            <ForgotPasswordModal
              initialEmail={email}
              onClose={() => setForgotMode(false)}
              onSuccess={(msg) => setSuccess(msg)}
            />
          )}
        </div>
      </div>
    </div>
  )
}