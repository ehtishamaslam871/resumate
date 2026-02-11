import React, { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import api from '../services/api'

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

  // Load interview invites for job seekers
  useEffect(() => {
    const loadInvites = () => {
      try {
        const role = (user?.role || '').toLowerCase()
        if (role.includes('recruit') || role.includes('admin')) {
          setInterviewInvites([])
          return
        }

        const invites = JSON.parse(localStorage.getItem('resumate_interview_invites') || '[]')
        const myEmail = user?.email
        // show invites for this user (applicant email matches)
        const filtered = invites.filter(inv => inv.applicantEmail === myEmail && inv.status === 'pending')
        setInterviewInvites(filtered)
      } catch {
        setInterviewInvites([])
      }
    }

    loadInvites()
    const onStorageInvites = (e) => {
      if (e.key === 'resumate_interview_invites') loadInvites()
    }
    window.addEventListener('storage', onStorageInvites)
    return () => window.removeEventListener('storage', onStorageInvites)
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
    localStorage.removeItem('resumate_user')
    setUser(null)
    navigate('/')
  }

  const respondToInterview = (invite, accept = true) => {
    if (accept) {
      // navigate to interview conductor with invite data
      navigate('/chatbot', { state: { inviteId: invite.id } })
    } else {
      // decline the interview
      try {
        const invitesKey = 'resumate_interview_invites'
        const invites = JSON.parse(localStorage.getItem(invitesKey) || '[]')
        const updated = invites.map(inv => inv.id === invite.id ? { ...inv, status: 'declined' } : inv)
        localStorage.setItem(invitesKey, JSON.stringify(updated))
        setInterviewInvites(prev => prev.filter(inv => inv.id !== invite.id))
        setMessage('Interview declined')
        setTimeout(() => setMessage(''), 2000)
      } catch {}
    }
  }

  const handleDeleteAccount = () => {
    if (!confirm('Delete account? This cannot be undone.')) return
    try {
      const USERS_KEY = 'resumate_users'
      const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
      const filtered = users.filter(u => u.id !== user.id)
      localStorage.setItem(USERS_KEY, JSON.stringify(filtered))
    } catch {}
    localStorage.removeItem('resumate_user')
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

      <div className="px-6 py-12 max-w-4xl mx-auto space-y-8">
        <div className="card-glass-hover p-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-extrabold text-lg overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                initials || 'U'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-100">Profile</h1>
              <p className="text-gray-400 text-sm">Manage your account details and security settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {message && (
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-300 text-sm flex items-start gap-3">
                <span>✅</span>
                <div>{message}</div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="input-modern"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="input-modern"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-sm text-gray-300 block mb-1 font-semibold">Avatar</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-dark-800 border border-dark-700 rounded-lg hover:bg-dark-700 text-sm transition"
                  >
                    Upload
                  </button>
                  {avatar && (
                    <button
                      onClick={removeAvatar}
                      className="px-3 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-sm transition text-red-400"
                    >
                      Remove
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarPick}
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-sm text-gray-300 block mb-1 font-semibold">Role</label>
                <div className="p-3 bg-dark-800 border border-dark-700/50 rounded-lg text-sm text-gray-300">{role}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1 font-semibold">New password (leave blank to keep)</label>
              <input
                type="password"
                className="input-modern w-full"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3 pt-4 flex-wrap">
              <button
                onClick={saveChanges}
                className="btn-primary"
              >
                Save Changes
              </button>

              <button
                onClick={handleLogout}
                className="btn-secondary"
              >
                Logout
              </button>

              <button
                onClick={handleDeleteAccount}
                className="ml-auto px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg hover:bg-red-500/30 text-red-400 text-sm transition font-medium"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className="card-glass-hover p-8">
          <h2 className="text-lg font-bold mb-4 text-gray-100">Account Info</h2>
          <div className="text-sm text-gray-400 space-y-2">
            <div><strong className="text-gray-300">ID:</strong> <span className="text-gray-400">{user.id || '—'}</span></div>
            <div><strong className="text-gray-300">Registered:</strong> <span className="text-gray-400">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</span></div>
          </div>
        </div>

        {!isPrivileged && (
          <div className="card-glass-hover p-8">
            <h2 className="text-lg font-bold mb-4 text-gray-100">Interview Invitations</h2>
            {interviewInvites.length === 0 ? (
              <div className="text-sm text-gray-400">No pending interview invitations.</div>
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

        <div className="card-glass-hover p-8">
          <h2 className="text-lg font-bold mb-4 text-gray-100">Applications</h2>
          {isPrivileged ? (
            <div className="text-sm text-gray-400">Applications are only visible for Job Seeker accounts.</div>
          ) : applications.length === 0 ? (
            <div className="text-sm text-gray-400">You have no recorded applications yet.</div>
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