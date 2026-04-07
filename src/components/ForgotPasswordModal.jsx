import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, KeyRound, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react'
import { authAPI } from '../services/api'

const CODE_LENGTH = 6

export default function ForgotPasswordModal({ initialEmail = '', onClose = () => {}, onSuccess = () => {} }) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [devResetCode, setDevResetCode] = useState('')
  const [resetCodeDigits, setResetCodeDigits] = useState(Array(CODE_LENGTH).fill(''))
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [resetCompleted, setResetCompleted] = useState(false)
  const codeInputRefs = useRef([])
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])


  const enteredResetCode = resetCodeDigits.join('')

  const isStrongPassword = (pwd = '') => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd) &&
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(pwd)
    )
  }

  const handleSendResetCode = async () => {
    setError('')
    setSuccess('')
    setDevResetCode('')
    setResetCompleted(false)

    if (!email || !email.includes('@')) {
      setError('Please enter a valid email')
      return
    }

    try {
      setSendingCode(true)
      const response = await authAPI.forgotPassword(email.trim())
      setResetCodeSent(true)
      setResetCodeDigits(Array(CODE_LENGTH).fill(''))
      setSuccess(response.message || 'If an account exists for this email, a reset code has been sent.')
      if (response.devResetCode) {
        setDevResetCode(response.devResetCode)
      }
      setTimeout(() => {
        if (codeInputRefs.current[0]) codeInputRefs.current[0].focus()
      }, 50)
    } catch (err) {
      setError(err.message || 'Unable to send reset code. Please try again.')
    } finally {
      setSendingCode(false)
    }
  }

  const handleCodeChange = (index, rawValue) => {
    const digit = (rawValue || '').replace(/\D/g, '').slice(-1)
    const next = [...resetCodeDigits]
    next[index] = digit
    setResetCodeDigits(next)

    if (digit && index < CODE_LENGTH - 1) {
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodeKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !resetCodeDigits[index] && index > 0) {
      codeInputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      codeInputRefs.current[index - 1]?.focus()
    }

    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      e.preventDefault()
      codeInputRefs.current[index + 1]?.focus()
    }
  }

  const handleCodePaste = (e) => {
    const pasted = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return

    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((char, idx) => {
      next[idx] = char
    })

    setResetCodeDigits(next)
    const focusIndex = Math.min(pasted.length, CODE_LENGTH - 1)
    codeInputRefs.current[focusIndex]?.focus()
  }

  const handleResetPassword = async () => {
    setError('')
    setSuccess('')

    if (!enteredResetCode.trim() || enteredResetCode.length !== CODE_LENGTH) {
      setError('Please enter the reset code')
      return
    }

    if (!isStrongPassword(newPassword)) {
      setError('Password must be 8+ chars with uppercase, lowercase, number, and special character')
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      setResetting(true)
      const response = await authAPI.resetPassword({
        email: email.trim(),
        code: enteredResetCode.trim(),
        newPassword,
      })
      const msg = response.message || 'Password updated. Please sign in with your new password.'
      setSuccess(msg)
      onSuccess(msg)
      setResetCompleted(true)
    } catch (err) {
      setError(err.message || 'Unable to reset password. Please verify your code and try again.')
    } finally {
      setResetting(false)
    }
  }

  if (typeof document === 'undefined') return null

  const modalContent = (
    <div
      className="fixed inset-0 z-[120] flex items-start sm:items-center justify-center bg-dark-950/90 backdrop-blur-md p-3 sm:p-6 animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-md bg-dark-900/95 rounded-2xl p-5 sm:p-8 border border-dark-700/70 shadow-2xl shadow-dark-950/60 animate-scale-in max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-3rem)] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 border border-dark-700/50 flex items-center justify-center">
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

        {!resetCompleted && error && (
          <div className="mb-4 p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <span className="mt-0.5">&#9888;</span>
            <span>{error}</span>
          </div>
        )}

        {!resetCompleted && success && (
          <div className="mb-4 p-3 bg-green-500/15 border border-green-500/40 rounded-xl text-green-300 text-sm flex items-start gap-2">
            <span className="mt-0.5">&#10003;</span>
            <span>{success}</span>
          </div>
        )}

        {resetCompleted ? (
          <div className="text-center py-4 px-1 space-y-5 animate-fade-in-up">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 text-green-400" />
            </div>
            <div className="space-y-2">
              <h4 className="text-2xl font-display font-bold text-gray-100">Password Updated</h4>
              <p className="text-sm text-gray-400">Your password has been reset successfully. You can now sign in with your new password.</p>
            </div>
            <button type="button" className="btn-primary w-full" onClick={onClose}>
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-modern pl-10"
                disabled={resetCodeSent}
              />
            </div>

            {!resetCodeSent ? (
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={sendingCode}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sendingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {sendingCode ? 'Sending Code...' : 'Send Reset Code'}
              </button>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-xs text-gray-500">Enter the 6-digit code sent to your email</p>
                  <div className="flex items-center justify-between gap-2 sm:gap-3" onPaste={handleCodePaste}>
                    {resetCodeDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          codeInputRefs.current[idx] = el
                        }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeChange(idx, e.target.value)}
                        onKeyDown={(e) => handleCodeKeyDown(idx, e)}
                        className="h-12 sm:h-14 w-10 sm:w-12 rounded-xl border border-dark-600 bg-dark-900/70 text-center text-lg font-mono text-gray-100 focus:outline-none focus:ring-2 focus:ring-neon-cyan/40 focus:border-neon-cyan/50"
                        aria-label={`Reset code digit ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                  <input
                    type="password"
                    placeholder="New Password"
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
                  disabled={resetting}
                  className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {resetting ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Resetting Password...
                    </span>
                  ) : (
                    'Reset Password'
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleSendResetCode}
                  disabled={sendingCode}
                  className="btn-secondary w-full"
                >
                  Resend Code
                </button>

                {devResetCode && (
                  <div className="p-3 card-glass rounded-xl text-center">
                    <p className="text-xs text-gray-500 mb-1">Development reset code:</p>
                    <p className="font-mono text-sm text-neon-cyan font-bold tracking-[0.3em]">{devResetCode}</p>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-end pt-1">
              <button onClick={onClose} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
                Back to Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
