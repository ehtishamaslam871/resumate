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
          const applicationsResponse = await api.applications.getUserApplications()
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

  const cancelApplication = (app) => {
    if (!confirm('Withdraw this application?')) return
    try {
      const appsKey = 'resumate_applications'
      const existing = JSON.parse(localStorage.getItem(appsKey) || '[]')
      const hiddenKey = 'resumate_hidden_applications'
      const hidden = JSON.parse(localStorage.getItem(hiddenKey) || '[]')

      // If the stored application has a userId and belongs to the current user, remove it.
      // If it is a legacy entry (no userId), mark it as hidden for this user instead.
      const filtered = existing.filter(a => {
        if (a.job !== app.job || a.company !== app.company) return true
        if (!a.userId) {
          // keep the legacy entry in the global list, but add a per-user hidden record below
          return true
        }
        // remove only if it belongs to current user
        return !(a.userId === user?.id || a.userId === user?.email)
      })

      // If this was a legacy entry (no userId), record a hidden entry for this user
      if (!app.userId) {
        const alreadyHidden = hidden.some(h => h.job === app.job && h.company === app.company && (h.userId === user?.id || h.userId === user?.email))
        if (!alreadyHidden) {
          hidden.unshift({ job: app.job, company: app.company, userId: user?.id || user?.email, hiddenAt: new Date().toISOString() })
          localStorage.setItem(hiddenKey, JSON.stringify(hidden))
        }
      }

      localStorage.setItem(appsKey, JSON.stringify(filtered))

      // update in-memory list for this profile view (respecting hidden list)
      const visible = filtered.filter(ap => {
        const isHidden = hidden.some(h => h.job === ap.job && h.company === ap.company && (h.userId === user?.id || h.userId === user?.email))
        if (isHidden) return false
        if (!ap.userId) return true
        return ap.userId === user?.id || ap.userId === user?.email
      })
      setApplications(visible)
    } catch (e) {
      // ignore storage errors
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
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="px-6 py-12 max-w-4xl mx-auto space-y-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400
                          flex items-center justify-center text-gray-900 font-extrabold text-lg overflow-hidden">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover rounded-full" />
              ) : (
                initials || 'U'
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-gray-400 text-sm">Manage your account details and security settings.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {message && (
              <div className="p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                className="p-3 bg-gray-700 rounded placeholder-gray-400"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="p-3 bg-gray-700 rounded placeholder-gray-400"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <div>
                <label className="text-sm text-gray-300 block mb-1">Avatar</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
                  >
                    Upload
                  </button>
                  {avatar && (
                    <button
                      onClick={removeAvatar}
                      className="px-3 py-2 bg-red-700 rounded hover:bg-red-600 text-sm"
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
                <label className="text-sm text-gray-300 block mb-1">Role</label>
                <div className="p-3 bg-gray-900 rounded text-sm text-gray-300">{role}</div>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 block mb-1">New password (leave blank to keep)</label>
              <input
                type="password"
                className="w-full p-3 bg-gray-700 rounded placeholder-gray-400"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={saveChanges}
                className="px-4 py-2 bg-cyan-500 text-gray-900 rounded font-semibold hover:bg-cyan-600"
              >
                Save Changes
              </button>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 text-sm"
              >
                Logout
              </button>

              <button
                onClick={handleDeleteAccount}
                className="ml-auto px-3 py-2 bg-red-700 rounded hover:bg-red-600 text-sm"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-2">Account Info</h2>
          <div className="text-sm text-gray-400">
            <div><strong>ID:</strong> <span className="text-gray-300">{user.id || '—'}</span></div>
            <div className="mt-1"><strong>Registered:</strong> <span className="text-gray-300">{user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</span></div>
          </div>
        </div>

        {!isPrivileged && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-2">Interview Invitations</h2>
            {interviewInvites.length === 0 ? (
              <div className="text-sm text-gray-400">No pending interview invitations.</div>
            ) : (
              <div className="space-y-3">
                {interviewInvites.map((invite) => (
                  <div key={invite.id} className="p-4 bg-gray-900 rounded border border-blue-600/30">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-blue-300">{invite.jobTitle}</div>
                        <div className="text-sm text-gray-400">From: {invite.recruiterName}</div>
                        <div className="text-sm text-gray-300 mt-1">
                          <strong>Scheduled:</strong> {new Date(invite.scheduledDate).toLocaleDateString()} at {invite.scheduledTime}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500 bg-blue-500/10 px-2 py-1 rounded">Interview Scheduled</div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => respondToInterview(invite, true)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Accept & Start Interview
                      </button>
                      <button
                        onClick={() => respondToInterview(invite, false)}
                        className="px-4 py-2 bg-red-700 rounded hover:bg-red-600 text-sm"
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

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-lg font-bold mb-2">Applications</h2>
          {isPrivileged ? (
            <div className="text-sm text-gray-400">Applications are only visible for Job Seeker accounts.</div>
          ) : applications.length === 0 ? (
            <div className="text-sm text-gray-400">You have no recorded applications yet.</div>
          ) : (
            <div className="space-y-3">
              {applications.map((a, idx) => (
                <div key={idx} className="p-3 bg-gray-900 rounded flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white">{a.job}</div>
                    <div className="text-sm text-gray-400">{a.company} • {a.date ? new Date(a.date).toLocaleString() : '—'}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${a.status === 'Approved' ? 'bg-green-500 text-gray-900' : a.status === 'Rejected' ? 'bg-red-600 text-gray-100' : 'bg-yellow-500 text-gray-900'}`}>
                      {a.status || 'Pending'}
                    </div>
                    <button onClick={() => cancelApplication(a)} className="px-3 py-1 bg-red-700 rounded text-sm hover:bg-red-600">Cancel</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}