import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Camera, Trash2, LogOut, Save, Calendar, Briefcase, Video, X, ChevronRight, Info } from 'lucide-react'
import Navbar from '../components/Navbar'
import api, { clearAuth } from '../services/api'

export default function Profile() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [user, setUser] = useState(() => {
    return api.getCurrentUser() || null
  })

  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [role] = useState(user?.role || 'Job Seeker')
  const [avatar, setAvatar] = useState(user?.avatar || null)
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState('')
  const [applications, setApplications] = useState([])
  const [interviewInvites, setInterviewInvites] = useState([])

  useEffect(() => {
    if (!user) {
      navigate('/auth')
      return
    }
    
    // Load user applications and interviews from API
    const loadData = async () => {
      try {
        // Only load applications for job seekers
        const userRole = (user?.role || '').toLowerCase()
        if (!userRole.includes('recruit') && !userRole.includes('admin')) {
          const applicationsResponse = await api.application.getUserApplications()
          setApplications(applicationsResponse.applications || [])
        }
      } catch (err) {
        console.error('Failed to load applications:', err.message)
      }
    }
    
    loadData()
  }, [user, navigate])

  // Load interview invites for job seekers from API
  useEffect(() => {
    const loadInvites = async () => {
      try {
        const role = (user?.role || '').toLowerCase()
        if (role.includes('recruit') || role.includes('admin')) {
          setInterviewInvites([])
          return
        }

        const response = await api.interview.getUserInterviews()
        const pending = (response.interviews || []).filter(inv => inv.status === 'scheduled' || inv.status === 'pending')
        setInterviewInvites(pending)
      } catch {
        setInterviewInvites([])
      }
    }

    if (user) loadInvites()
  }, [user])

  const saveChanges = async () => {
    if (!email.includes('@')) {
      setMessage('Please enter a valid email')
      setTimeout(() => setMessage(''), 2500)
      return
    }

    try {
      const updates = {
        name: name.trim(),
        email: email.trim(),
      }
      
      if (newPassword.trim()) {
        if (newPassword.length < 3) {
          setMessage('Password must be at least 3 characters')
          setTimeout(() => setMessage(''), 2500)
          return
        }
        updates.password = newPassword
      }

      if (avatar) updates.avatar = avatar

      // Call API to update profile
      const response = await api.auth.updateProfile(updates)
      
      // Update local state
      const updated = { ...user, ...response.user }
      api.setAuthToken(response.token || localStorage.getItem('authToken'), updated)
      setUser(updated)
      setNewPassword('')
      setMessage('Profile saved successfully')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage(err.message || 'Failed to save profile')
      setTimeout(() => setMessage(''), 2500)
    }
  }

  const cancelApplication = async (app) => {
    if (!confirm('Withdraw this application?')) return
    try {
      await api.application.deleteApplication(app._id)
      setApplications(prev => prev.filter(a => a._id !== app._id))
      setMessage('Application withdrawn successfully')
      setTimeout(() => setMessage(''), 2000)
    } catch (err) {
      setMessage(err.message || 'Failed to withdraw application')
      setTimeout(() => setMessage(''), 2500)
    }
  }

  const handleAvatarPick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => {
      setAvatar(reader.result)
    }
    reader.readAsDataURL(f)
  }

  const removeAvatar = () => setAvatar(null)

  const handleLogout = () => {
    clearAuth()
    setUser(null)
    navigate('/')
  }

  const respondToInterview = (invite, accept = true) => {
    if (accept) {
      // Navigate to the interview session
      navigate(`/interview-session/${invite._id}`)
    } else {
      setMessage('Interview declined')
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const handleDeleteAccount = () => {
    if (!confirm('Delete account? This cannot be undone.')) return
    // Clear auth and redirect - full account deletion requires admin action
    clearAuth()
    setUser(null)
    navigate('/')
  }

  if (!user) return null

  const initials = (user.name || user.email || '')
    .split(' ')
    .map(s => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const isPrivileged = (role || '').toLowerCase().includes('recruit') || (role || '').toLowerCase().includes('admin')

  return (
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <div className="px-6 py-12 max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Profile Header Card */}
        <div className="card-glass-hover p-8 relative overflow-hidden">
          {/* Decorative gradient line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center
                text-dark-950 font-extrabold text-xl overflow-hidden ring-2 ring-dark-700/50 ring-offset-2 ring-offset-dark-900
                transition-all group-hover:ring-neon-cyan/40">
                {avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  initials || 'U'
                )}
              </div>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-lg bg-dark-800 border border-dark-700/50
                  flex items-center justify-center text-gray-400 hover:text-neon-cyan hover:border-neon-cyan/40 transition-all shadow-lg"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarPick}
              />
            </div>

            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-display font-bold text-gray-100">{user.name || 'Your Profile'}</h1>
              <p className="text-gray-400 text-sm mt-0.5">{user.email}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                <span className="badge-primary text-xs">{role}</span>
                {avatar && (
                  <button onClick={removeAvatar} className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1">
                    <X className="w-3 h-3" /> Remove photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-xl text-sm flex items-start gap-2 ${
              message.toLowerCase().includes('success') || message.toLowerCase().includes('saved')
                ? 'bg-green-500/15 border border-green-500/40 text-green-300'
                : 'bg-red-500/15 border border-red-500/40 text-red-300'
            }`}>
              <span className="mt-0.5">{message.toLowerCase().includes('success') || message.toLowerCase().includes('saved') ? '✓' : '⚠'}</span>
              <span>{message}</span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  className="input-modern pl-10"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
                <input
                  className="input-modern pl-10"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-500" />
              <input
                type="password"
                className="input-modern pl-10"
                placeholder="New password (leave blank to keep)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-2 flex-wrap">
              <button onClick={saveChanges} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
              <button onClick={handleLogout} className="btn-secondary flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn-danger ml-auto flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
          </div>
        </div>

        {/* Account Info */}
        <div className="card-glass-hover p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center">
              <Info className="w-4 h-4 text-neon-blue" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">Account Info</h2>
          </div>
          <div className="text-sm text-gray-400 space-y-2">
            <div className="flex items-center gap-2"><span className="text-gray-500 w-24 shrink-0">ID</span> <span className="text-gray-300 font-mono text-xs">{user.id || user._id || '—'}</span></div>
            <div className="flex items-center gap-2"><span className="text-gray-500 w-24 shrink-0">Registered</span> <span className="text-gray-300">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</span></div>
          </div>
        </div>

        {!isPrivileged && (
          <div className="card-glass-hover p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center">
                <Video className="w-4 h-4 text-neon-purple" />
              </div>
              <h2 className="text-lg font-bold text-gray-100">Interview Invitations</h2>
              {interviewInvites.length > 0 && (
                <span className="ml-auto badge-primary text-xs">{interviewInvites.length} pending</span>
              )}
            </div>
            {interviewInvites.length === 0 ? (
              <div className="text-center py-6">
                <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending interview invitations.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {interviewInvites.map((invite) => (
                  <div key={invite.id} className="p-4 card-glass border border-neon-blue/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-neon-cyan">{invite.jobTitle}</div>
                        <div className="text-sm text-gray-400">From: {invite.recruiterName}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          <strong>Scheduled:</strong> {new Date(invite.scheduledDate).toLocaleDateString()} at {invite.scheduledTime}
                        </div>
                      </div>
                      <div className="text-xs text-neon-blue/80 bg-neon-blue/10 px-2 py-1 rounded">Interview Scheduled</div>
                    </div>
                    <div className="mt-3 flex gap-2 flex-wrap">
                      <button
                        onClick={() => respondToInterview(invite, true)}
                        className="px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg hover:bg-green-500/30 text-sm transition font-medium"
                      >
                        Accept & Start Interview
                      </button>
                      <button
                        onClick={() => respondToInterview(invite, false)}
                        className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 text-sm transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="card-glass-hover p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-neon-cyan" />
            </div>
            <h2 className="text-lg font-bold text-gray-100">Applications</h2>
            {!isPrivileged && applications.length > 0 && (
              <span className="ml-auto text-xs text-gray-500">{applications.length} total</span>
            )}
          </div>
          {isPrivileged ? (
            <div className="text-center py-6">
              <Briefcase className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Applications are only visible for Job Seeker accounts.</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-6">
              <Briefcase className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">You have no recorded applications yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {applications.map((a, idx) => (
                <div key={a._id || idx} className="p-4 card-glass border border-dark-700/50 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {a.aiScore != null && (
                        <div className={`w-10 h-10 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0 ${
                          a.aiScore >= 80 ? 'border-green-400 bg-green-500/10' :
                          a.aiScore >= 60 ? 'border-cyan-400 bg-cyan-500/10' :
                          a.aiScore >= 40 ? 'border-yellow-400 bg-yellow-500/10' :
                          'border-red-400 bg-red-500/10'
                        }`}>
                          <span className={`text-xs font-extrabold ${
                            a.aiScore >= 80 ? 'text-green-400' :
                            a.aiScore >= 60 ? 'text-cyan-400' :
                            a.aiScore >= 40 ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>{a.aiScore}%</span>
                        </div>
                      )}
                      <div>
                        <div className="font-semibold text-gray-100">{a.jobTitle || a.job?.title || 'Untitled Job'}</div>
                        <div className="text-sm text-gray-400">
                          {a.companyName || a.job?.company || '—'} • {a.appliedDate ? new Date(a.appliedDate).toLocaleDateString() : a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}
                          {a.aiRecommendation && <span className="ml-2 text-purple-400 text-xs">• {a.aiRecommendation}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                        a.status === 'accepted' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50' 
                          : a.status === 'rejected' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                          : a.status === 'shortlisted'
                          ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50'
                          : a.status === 'reviewing'
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                      }`}>
                        {a.status === 'applied' ? 'Pending' : a.status ? a.status.charAt(0).toUpperCase() + a.status.slice(1) : 'Pending'}
                      </div>
                      {a.status === 'applied' && (
                        <button onClick={() => cancelApplication(a)} className="px-3 py-1 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm hover:bg-red-500/30 transition">Withdraw</button>
                      )}
                    </div>
                  </div>
                  {(a.matchedSkills?.length > 0 || a.missingSkills?.length > 0) && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {a.matchedSkills?.map((s, i) => (
                        <span key={`m-${i}`} className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-semibold rounded border border-green-500/20">{s}</span>
                      ))}
                      {a.missingSkills?.map((s, i) => (
                        <span key={`x-${i}`} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded border border-red-500/20">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}