import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { adminAPI } from "../services/api";
import {
  Users,
  Briefcase,
  FileText,
  TrendingUp,
  Search,
  Loader,
  AlertCircle,
  CheckCircle,
  MoreVertical,
  Mail,
  Activity,
  ShieldCheck,
  KeyRound,
  UserCog,
  Ban,
  UserCheck,
} from "lucide-react";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalResumes: 0,
    totalApplications: 0,
    totalInterviews: 0,
    recruiters: 0,
    jobSeekers: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
    rejectedApplications: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [userMenuOpen, setUserMenuOpen] = useState(null);
  const [suspendingId, setSuspendingId] = useState(null);
  const [roleChangeId, setRoleChangeId] = useState(null);
  const [resetPasswordModal, setResetPasswordModal] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [systemHealth, setSystemHealth] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Fetch admin data from backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check auth
        let adminUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!adminUser) {
          adminUser = JSON.parse(localStorage.getItem("resumate_user") || "null");
        }
        const userRole = adminUser?.role ? adminUser.role.toLowerCase() : '';
        if (!adminUser || userRole !== "admin") {
          navigate("/auth");
          return;
        }

        // Fetch real stats and users from API in parallel
        const [statsData, usersData, healthData] = await Promise.all([
          adminAPI.getDashboardStats(),
          adminAPI.getUsers({ page: 1, limit: 50 }),
          adminAPI.getSystemHealth().catch(() => null),
        ]);

        setStats({
          totalUsers: statsData.users?.total || 0,
          totalJobs: statsData.jobs?.total || 0,
          totalResumes: statsData.resumes?.total || 0,
          totalApplications: statsData.applications?.total || 0,
          totalInterviews: statsData.interviews?.total || 0,
          recruiters: statsData.users?.recruiters || 0,
          jobSeekers: statsData.users?.jobSeekers || 0,
          pendingApplications: statsData.applications?.pending || 0,
          acceptedApplications: statsData.applications?.accepted || 0,
          rejectedApplications: statsData.applications?.rejected || 0,
        });

        setUsers(usersData.users || []);
        setPagination(usersData.pagination || { page: 1, pages: 1, total: 0 });
        if (healthData) setSystemHealth(healthData);
      } catch (err) {
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // Reload users when filters change
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const params = { page: 1, limit: 50 };
        if (filterRole) params.role = filterRole;
        const data = await adminAPI.getUsers(params);
        setUsers(data.users || []);
        setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
      } catch (err) {
        // silently fail, keep existing data
      }
    };
    if (!loading) fetchUsers();
  }, [filterRole]);

  const handleSuspendUser = async (userId) => {
    try {
      setSuspendingId(userId);
      const result = await adminAPI.toggleUserStatus(userId);
      // Update user in local state with API response
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, isActive: result.user?.isActive ?? !u.isActive } : u
        )
      );
      setSuccess("User status updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update user status");
    } finally {
      setSuspendingId(null);
      setUserMenuOpen(null);
    }
  };

  const handleChangeRole = async (userId, role) => {
    try {
      setRoleChangeId(userId);
      const result = await adminAPI.changeUserRole(userId, role);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === userId ? { ...u, role: result.user?.role ?? role } : u
        )
      );
      setSuccess(`User role changed to ${role.replace('_', ' ')} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to change user role");
    } finally {
      setRoleChangeId(null);
      setUserMenuOpen(null);
    }
  };

  const handleResetPassword = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    try {
      await adminAPI.resetUserPassword(userId, newPassword);
      setSuccess("Password reset successfully!");
      setTimeout(() => setSuccess(null), 3000);
      setResetPasswordModal(null);
      setNewPassword("");
    } catch (err) {
      setError(err.message || "Failed to reset password");
    }
  };

  const handleSendEmail = (user) => {
    window.open(`mailto:${user.email}?subject=ResuMate%20Admin%20Notice`);
    setUserMenuOpen(null);
  };

  const filteredUsers = users.filter((user) => {
    if (searchTerm && !user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterRole && user.role !== filterRole) return false;
    if (filterStatus) {
      const isActive = user.isActive !== false; // default to active
      if (filterStatus === "active" && !isActive) return false;
      if (filterStatus === "suspended" && isActive) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white">
        <Navbar />
        {/* Animated background */}
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading admin panel...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-gray-400">Manage users, monitor platform activity, and system settings</p>
        </div>

        {/* Error & Success Messages */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-12">
          <div className="card-glass card-glass-hover p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400">Total Users</p>
              <Users className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-3xl font-bold">{stats.totalUsers}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.jobSeekers} seekers · {stats.recruiters} recruiters
            </p>
          </div>

          <div className="card-glass card-glass-hover p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400">Total Jobs</p>
              <Briefcase className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-3xl font-bold">{stats.totalJobs}</p>
          </div>

          <div className="card-glass card-glass-hover p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400">Total Resumes</p>
              <FileText className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-3xl font-bold">{stats.totalResumes}</p>
          </div>

          <div className="card-glass card-glass-hover p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400">Applications</p>
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-3xl font-bold">{stats.totalApplications}</p>
            <p className="text-xs text-gray-500 mt-1">
              {stats.pendingApplications} pending · {stats.acceptedApplications} accepted · {stats.rejectedApplications} rejected
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-dark-700 mb-8">
          <div className="flex gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "users", label: "User Management" },
              { id: "system", label: "System Settings" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? "text-neon-cyan border-neon-cyan"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Platform Health */}
            <div className="card-glass card-glass-hover p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-6">Platform Health</h3>
              {systemHealth ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${systemHealth.database?.status === 'connected' ? 'bg-neon-green' : 'bg-red-500'}`} />
                    <p className="text-gray-300">Database: <span className="font-semibold text-neon-cyan">{systemHealth.database?.status || 'unknown'}</span></p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${systemHealth.api?.status === 'running' ? 'bg-neon-green' : 'bg-red-500'}`} />
                    <p className="text-gray-300">API: <span className="font-semibold text-neon-cyan">{systemHealth.api?.status || 'unknown'}</span> — uptime {systemHealth.api?.uptime ? Math.round(systemHealth.api.uptime / 60) + ' min' : 'N/A'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Health data unavailable</p>
              )}
            </div>

            {/* Quick Stats Breakdown */}
            <div className="card-glass card-glass-hover p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-6">Platform Summary</h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Users by Role</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Job Seekers</span>
                      <span className="text-neon-cyan font-semibold">{stats.jobSeekers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Recruiters</span>
                      <span className="text-neon-cyan font-semibold">{stats.recruiters}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Applications</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Pending</span>
                      <span className="text-yellow-400 font-semibold">{stats.pendingApplications}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Accepted</span>
                      <span className="text-neon-green font-semibold">{stats.acceptedApplications}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Rejected</span>
                      <span className="text-red-400 font-semibold">{stats.rejectedApplications}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Content</p>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Resumes</span>
                      <span className="text-neon-cyan font-semibold">{stats.totalResumes}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Interviews</span>
                      <span className="text-neon-cyan font-semibold">{stats.totalInterviews}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-300">Jobs</span>
                      <span className="text-neon-cyan font-semibold">{stats.totalJobs}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Users */}
            <div className="card-glass card-glass-hover p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-6">Recent Users</h3>
              <div className="space-y-4">
                {users.length === 0 ? (
                  <p className="text-gray-500">No users found.</p>
                ) : (
                  users.slice(0, 5).map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between py-3 border-b border-dark-700 last:border-b-0"
                    >
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs bg-dark-700 px-3 py-1 rounded-full">
                          {user.role || "user"}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${user.isActive !== false ? 'bg-neon-green' : 'bg-red-500'}`} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Management Tab */}
        {activeTab === "users" && (
          <div>
            {/* Filters */}
            <div className="mb-8 space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Search Users</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="input-modern pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Filter by Role</label>
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="input-modern"
                  >
                    <option value="">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="job_seeker">Job Seeker</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Filter by Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input-modern"
                  >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Users Table */}
            <div className="card-glass card-glass-hover rounded-2xl overflow-visible">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-dark-700 bg-dark-900/50">
                      <th className="px-6 py-4 text-left text-sm font-medium">User</th>
                      <th className="px-6 py-4 text-left text-sm font-medium">Email</th>
                      <th className="px-6 py-4 text-left text-sm font-medium">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-medium">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No users found.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user._id} className="border-b border-dark-700 hover:bg-dark-800/50">
                          <td className="px-6 py-4">{user.name}</td>
                          <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs bg-neon-cyan/20 text-neon-cyan px-3 py-1 rounded-full">
                              {user.role || "user"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-xs px-3 py-1 rounded-full ${
                                user.isActive !== false
                                  ? "bg-neon-green/20 text-neon-green"
                                  : "bg-red-500/20 text-red-400"
                              }`}
                            >
                              {user.isActive !== false ? "active" : "suspended"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-400">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <button
                              onClick={() =>
                                setUserMenuOpen(userMenuOpen === user._id ? null : user._id)
                              }
                              className="p-2 hover:bg-dark-700 rounded-lg transition"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Menu Modal */}
            {userMenuOpen && (() => {
              const user = filteredUsers.find(u => u._id === userMenuOpen);
              if (!user) return null;
              return (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setUserMenuOpen(null)}>
                  <div className="w-72 bg-dark-900 border border-dark-600 rounded-2xl shadow-2xl shadow-black/60 py-3" onClick={(e) => e.stopPropagation()}>
                    {/* User Info Header */}
                    <div className="px-5 pb-3 mb-2 border-b border-dark-600">
                      <p className="font-semibold text-gray-100 text-sm">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>

                    {/* Change Role */}
                    <p className="px-5 pt-1 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Change Role</p>
                    {['admin', 'recruiter', 'job_seeker'].filter(r => r !== user.role).map((role) => (
                      <button
                        key={role}
                        onClick={() => handleChangeRole(user._id, role)}
                        disabled={roleChangeId === user._id}
                        className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-dark-700/70 text-sm text-gray-300 transition-colors"
                      >
                        {role === 'admin' && <ShieldCheck className="w-4 h-4 text-neon-cyan" />}
                        {role === 'recruiter' && <Briefcase className="w-4 h-4 text-neon-purple" />}
                        {role === 'job_seeker' && <UserCog className="w-4 h-4 text-neon-pink" />}
                        <span>Make {role === 'job_seeker' ? 'Job Seeker' : role.charAt(0).toUpperCase() + role.slice(1)}</span>
                      </button>
                    ))}

                    <div className="mx-4 my-2 border-t border-dark-600" />

                    {/* Actions */}
                    <p className="px-5 pt-1 pb-2 text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Actions</p>
                    <button
                      onClick={() => { setResetPasswordModal(user); setUserMenuOpen(null); }}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-dark-700/70 text-sm text-gray-300 transition-colors"
                    >
                      <KeyRound className="w-4 h-4 text-yellow-400" />
                      <span>Reset Password</span>
                    </button>
                    <button
                      onClick={() => handleSendEmail(user)}
                      className="w-full flex items-center gap-3 px-5 py-2.5 hover:bg-dark-700/70 text-sm text-gray-300 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-blue-400" />
                      <span>Send Email</span>
                    </button>

                    <div className="mx-4 my-2 border-t border-dark-600" />

                    {/* Suspend / Activate */}
                    <button
                      onClick={() => handleSuspendUser(user._id)}
                      disabled={suspendingId === user._id}
                      className={`w-full flex items-center gap-3 px-5 py-2.5 hover:bg-dark-700/70 text-sm transition-colors ${
                        user.isActive !== false ? 'text-red-400' : 'text-neon-green'
                      }`}
                    >
                      {user.isActive !== false
                        ? <><Ban className="w-4 h-4" /><span>{suspendingId === user._id ? 'Suspending...' : 'Suspend User'}</span></>
                        : <><UserCheck className="w-4 h-4" /><span>{suspendingId === user._id ? 'Activating...' : 'Activate User'}</span></>
                      }
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* System Settings Tab */}
        {activeTab === "system" && (
          <div className="card-glass card-glass-hover p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-8">System Configuration</h3>

            <div className="space-y-6">
              {/* Email Settings */}
              <div className="border-b border-dark-700 pb-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email Settings
                </h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-gray-300">Enable email notifications</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-gray-300">Send daily digest emails</span>
                  </label>
                </div>
              </div>

              {/* Security Settings */}
              <div className="border-b border-dark-700 pb-6">
                <h4 className="font-semibold mb-4">Security Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-gray-300">Require 2FA for admin accounts</span>
                  </label>
                  <label className="flex items-center gap-3">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-gray-300">Enable IP whitelist</span>
                  </label>
                </div>
              </div>

              {/* Data Settings */}
              <div>
                <h4 className="font-semibold mb-4">Data Management</h4>
                <button className="px-6 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition text-sm font-medium">
                  Export User Data
                </button>
              </div>
            </div>

            <div className="mt-8 p-4 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg">
              <p className="text-neon-cyan text-sm">
                💡 System settings affect all users. Changes are applied immediately.
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Reset Password Modal */}
      {resetPasswordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setResetPasswordModal(null); setNewPassword(""); }}>
          <div className="bg-dark-900 border border-dark-700 rounded-2xl p-8 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-2">Reset Password</h3>
            <p className="text-gray-400 text-sm mb-6">
              Set a new password for <span className="text-neon-cyan">{resetPasswordModal.name}</span> ({resetPasswordModal.email})
            </p>
            <input
              type="text"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-modern w-full mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setResetPasswordModal(null); setNewPassword(""); }}
                className="px-4 py-2 bg-dark-700 text-gray-300 rounded-lg hover:bg-dark-600 transition text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResetPassword(resetPasswordModal._id)}
                disabled={!newPassword || newPassword.length < 6}
                className="px-4 py-2 bg-neon-cyan text-dark-950 font-semibold rounded-lg hover:bg-neon-cyan/90 transition text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}