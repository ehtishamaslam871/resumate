import React, { useState } from 'react'
import { X, Mail, KeyRound, Lock, ArrowRight, Loader2 } from 'lucide-react'
import { authAPI } from '../services/api'

export default function ForgotPasswordModal({ initialEmail = '', onClose = () => {}, onSuccess = () => {} }) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [enteredResetCode, setEnteredResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const handleSendResetCode = async () => {
    setError('')
    setSuccess('')
    if (!email || !email.includes('@')) return setError('Please enter a valid email')

    setLoading(true)
    try {
      await authAPI.forgotPassword(email)
      setResetCodeSent(true)
      setSuccess('If an account exists with that email, a reset code has been sent. Please check your inbox.')
    } catch (err) {
      setError(err.message || 'Failed to send reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    setError('')
    setSuccess('')
    if (!enteredResetCode) return setError('Please enter the reset code')
    if (newPassword.length < 6) return setError('Password must be at least 6 characters')
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match')

    setLoading(true)
    try {
      await authAPI.resetPassword({ email, code: enteredResetCode, newPassword })
      setSuccess('Password updated. Please sign in with your new password.')
      onSuccess('Password updated. Please sign in with your new password.')
      setTimeout(() => {
        onClose()
      }, 800)
    } catch (err) {
      setError(err.message || 'Invalid or expired reset code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark-950/80 backdrop-blur-sm p-4 animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md card-glass rounded-2xl p-8 border border-dark-700/60 shadow-2xl shadow-dark-950/50 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 border border-dark-700/50
              flex items-center justify-center">
              <KeyRound className="w-5 h-5 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-100">Reset Password</h3>
              <p className="text-xs text-gray-500">Recover your account access</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-dark-800/60 text-gray-500 hover:text-gray-300 transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <span className="mt-0.5">&#9888;</span>
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-500/15 border border-green-500/40 rounded-xl text-green-300 text-sm flex items-start gap-2">
            <span className="mt-0.5">&#10003;</span>
            <span>{success}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Email */}
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-modern pl-10"
            />
          </div>

          {!resetCodeSent ? (
            <button
              type="button"
              onClick={handleSendResetCode}
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Reset Code <ArrowRight className="w-4 h-4" /></>}
            </button>
          ) : (
            <>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Enter Reset Code"
                  value={enteredResetCode}
                  onChange={(e) => setEnteredResetCode(e.target.value)}
                  className="input-modern pl-10 font-mono tracking-widest"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="New Password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-modern pl-10"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-modern pl-10"
                />
              </div>
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>
            </>
          )}

          <div className="flex justify-end pt-1">
            <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
