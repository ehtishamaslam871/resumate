import React, { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'

export default function Admin() {
  const currentUser = JSON.parse(localStorage.getItem('resumate_user') || 'null')

  const USERS_KEY = 'resumate_users'
  const [users, setUsers] = useState([])
  const [filterRole, setFilterRole] = useState('all')
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem(USERS_KEY) || '[]')
    setUsers(stored)
  }, [])

  useEffect(() => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  }, [users])

  const filtered = users.filter(u => {
    if (filterRole !== 'all' && u.role !== filterRole) return false
    if (!search) return true
    const s = search.toLowerCase()
    return (u.name || '').toLowerCase().includes(s) || (u.email || '').toLowerCase().includes(s)
  })

  const changeRole = (id, role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    setMessage('Role updated')
    setTimeout(() => setMessage(''), 2000)
  }

  const deleteUser = (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    setUsers(prev => prev.filter(u => u.id !== id))
    // if deleted user is current logged-in, optionally remove current user
    const cur = JSON.parse(localStorage.getItem('resumate_user') || 'null')
    if (cur && cur.id === id) {
      localStorage.removeItem('resumate_user')
    }
    setMessage('User deleted')
    setTimeout(() => setMessage(''), 2000)
  }

  const resetPassword = (id) => {
    const defaultPw = 'password123'
    setUsers(prev => prev.map(u => u.id === id ? { ...u, password: defaultPw } : u))
    setMessage('Password reset to password123')
    setTimeout(() => setMessage(''), 3000)
  }

  const clearAllData = () => {
    if (!confirm('Clear all app data (users, jobs, applicants)?')) return
    localStorage.removeItem(USERS_KEY)
    localStorage.removeItem('resumate_jobs')
    localStorage.removeItem('resumate_applicants')
    setUsers([])
    setMessage('All app data cleared')
    setTimeout(() => setMessage(''), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <div className="px-6 py-12 max-w-6xl mx-auto space-y-8">
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400
              flex items-center justify-center text-gray-900 font-extrabold">
              A
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-gray-400 text-sm">
                Welcome{currentUser && currentUser.name ? `, ${currentUser.name}` : ''}. System and user management tools.
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h2 className="font-semibold">Users</h2>
              <div className="text-sm text-gray-400">{users.length} registered</div>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h2 className="font-semibold">System</h2>
              <div className="text-sm text-gray-400">Clear app data if needed</div>
              <button
                onClick={clearAllData}
                className="mt-3 px-3 py-2 bg-red-700 text-sm rounded hover:bg-red-600"
              >
                Clear All Data
              </button>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h2 className="font-semibold">Quick Stats</h2>
              <div className="text-sm text-gray-400">Admins: {users.filter(u => u.role === 'admin').length}</div>
              <div className="text-sm text-gray-400">Recruiters: {users.filter(u => u.role === 'recruiter').length}</div>
              <div className="text-sm text-gray-400">Job Seekers: {users.filter(u => u.role === 'Job Seeker').length}</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">User Management</h2>
            <div className="flex items-center gap-2">
              <input
                className="p-2 bg-gray-700 rounded text-sm"
                placeholder="Search name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <select
                className="p-2 bg-gray-700 rounded text-sm"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">All</option>
                <option value="Job Seeker">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {message && (
            <div className="mb-3 p-3 bg-green-900/30 border border-green-700 rounded text-green-300 text-sm">
              {message}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-sm text-gray-400">No users found.</div>
          ) : (
            <div className="space-y-3">
              {filtered.map(u => (
                <div key={u.id} className="p-4 bg-gray-900 rounded-lg border border-gray-700 flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{u.name || '—'}</div>
                    <div className="text-sm text-gray-400">{u.email}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {u.id}</div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      className="p-2 bg-gray-700 rounded text-sm"
                    >
                      <option value="Job Seeker">Job Seeker</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => resetPassword(u.id)}
                        className="px-2 py-1 bg-yellow-700 rounded text-sm hover:bg-yellow-600"
                      >
                        Reset PW
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="px-2 py-1 bg-red-700 rounded text-sm hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold mb-3">System Settings</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="font-semibold">Demo Data</h3>
              <p className="text-sm text-gray-400">Seed sample users/jobs/applicants for testing.</p>
              <button
                onClick={() => {
                  const sampleUsers = [
                    { id: Date.now().toString() + '_u1', name: 'Admin One', email: 'admin1@resumate.local', password: 'admin', role: 'admin' },
                    { id: (Date.now()+1).toString() + '_u2', name: 'Recruiter One', email: 'recruiter@resumate.local', password: 'recruiter', role: 'recruiter' },
                    { id: (Date.now()+2).toString() + '_u3', name: 'Job Seeker One', email: 'Job Seeker@resumate.local', password: 'Job Seeker', role: 'Job Seeker' },
                  ]
                  const merged = [...sampleUsers, ...users]
                  localStorage.setItem(USERS_KEY, JSON.stringify(merged))
                  setUsers(merged)
                  setMessage('Demo users added')
                  setTimeout(() => setMessage(''), 2000)
                }}
                className="mt-3 px-3 py-2 bg-cyan-500 text-gray-900 rounded hover:bg-cyan-600 text-sm"
              >
                Add Demo Data
              </button>
            </div>

            <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
              <h3 className="font-semibold">Backups</h3>
              <p className="text-sm text-gray-400">Export user list as JSON.</p>
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(users, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'resumate_users.json'
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="mt-3 px-3 py-2 bg-gray-700 text-sm rounded hover:bg-gray-600"
              >
                Export Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}