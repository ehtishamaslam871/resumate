import React, { useState } from 'react'

export default function ForgotPasswordModal({ initialEmail = '', onClose = () => {}, onSuccess = () => {} }) {
  const [email, setEmail] = useState(initialEmail)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [resetCodeSent, setResetCodeSent] = useState(false)
  const [sentResetCode, setSentResetCode] = useState('')
  const [enteredResetCode, setEnteredResetCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const genCode = () => Math.floor(100000 + Math.random() * 900000).toString()

  const handleSendResetCode = () => {
    setError('')
    setSuccess('')
    if (!email || !email.includes('@')) return setError('Please enter a valid email')
    const USERS_KEY = 'resumate_users'
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const user = users.find(u => u.email === email)
    if (!user) return setError('No account found for that email')

    const code = genCode()
    const CODES_KEY = 'resumate_reset_codes'
    const codes = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
    codes.push({ email: user.email, code, expires: Date.now() + 15 * 60 * 1000 })
    localStorage.setItem(CODES_KEY, JSON.stringify(codes))
    setSentResetCode(code)
    setResetCodeSent(true)
    setSuccess('Reset code sent (demo). Enter the code below to set a new password.')
  }

  const handleResetPassword = () => {
    setError('')
    setSuccess('')
    if (!enteredResetCode) return setError('Please enter the reset code')
    if (newPassword.length < 3) return setError('Password must be at least 3 characters')
    if (newPassword !== confirmNewPassword) return setError('Passwords do not match')

    const CODES_KEY = 'resumate_reset_codes'
    const codes = JSON.parse(localStorage.getItem(CODES_KEY) || '[]')
    const record = [...codes].reverse().find(c => c.email === email && c.code === enteredResetCode)
    if (!record) return setError('Invalid or expired reset code')

    const USERS_KEY = 'resumate_users'
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    const idx = users.findIndex(u => u.email === email)
    if (idx === -1) return setError('User not found')
    users[idx].password = newPassword
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    const remaining = codes.filter(c => !(c.email === email && c.code === enteredResetCode))
    localStorage.setItem(CODES_KEY, JSON.stringify(remaining))

    setSuccess('Password updated. Please sign in with your new password.')
    onSuccess('Password updated. Please sign in with your new password.')
    setTimeout(() => {
      onClose()
    }, 800)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Reset Password</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-200">Close</button>
        </div>

        <p className="text-sm text-gray-400 mb-4">Enter your email to receive a reset code (demo).</p>

        {error && <div className="mb-3 p-2 bg-red-900/30 border border-red-700 rounded text-red-300 text-sm">{error}</div>}
        {success && <div className="mb-3 p-2 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">{success}</div>}

        <div className="space-y-3">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
          />

          {!resetCodeSent ? (
            <button
              type="button"
              onClick={handleSendResetCode}
              className="w-full py-3 bg-cyan-600 text-gray-900 rounded-lg font-semibold hover:bg-cyan-500 transition"
            >
              Send Reset Code
            </button>
          ) : (
            <>
              <input
                type="text"
                placeholder="Reset Code"
                value={enteredResetCode}
                onChange={(e) => setEnteredResetCode(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded-lg placeholder-gray-400"
              />
              <button
                type="button"
                onClick={handleResetPassword}
                className="w-full py-3 bg-green-600 text-gray-900 rounded-lg font-semibold hover:bg-green-500 transition"
              >
                Reset Password
              </button>

              <div className="text-sm text-gray-500">Demo code: <span className="font-mono text-gray-200">{sentResetCode}</span></div>
            </>
          )}

          <div className="flex justify-end">
            <button onClick={onClose} className="text-sm text-gray-400 hover:text-gray-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  )
}
