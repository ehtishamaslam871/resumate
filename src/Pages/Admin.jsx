import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
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
} from "lucide-react";

export default function AdminPanel() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalJobs: 0,
    totalResumes: 0,
    activeApplications: 0,
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
  const [deletingId, setDeletingId] = useState(null);

  // Fetch admin data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check both new API key ('user') and old demo key ('resumate_user')
        let adminUser = JSON.parse(localStorage.getItem("user") || "null");
        if (!adminUser) {
          adminUser = JSON.parse(localStorage.getItem("resumate_user") || "null");
        }
        
        const userRole = adminUser?.role ? adminUser.role.toLowerCase() : '';
        if (!adminUser || userRole !== "admin") {
          navigate("/auth");
          return;
        }

        // In a real app, you'd call api endpoints
        // For now, we'll use localStorage data
        const storedUsers = JSON.parse(localStorage.getItem("resumate_users") || "[]");
        setUsers(storedUsers);

        // Calculate stats from localStorage (in production, this would be from API)
        setStats({
          totalUsers: storedUsers.length,
          totalJobs: JSON.parse(localStorage.getItem("resumate_jobs") || "[]").length,
          totalResumes: JSON.parse(localStorage.getItem("resumate_resumes") || "[]").length,
          activeApplications: JSON.parse(localStorage.getItem("resumate_applications") || "[]").length,
        });
      } catch (err) {
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleSuspendUser = async (userId) => {
    try {
      setSuspendingId(userId);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: u.status === "active" ? "suspended" : "active" } : u
        )
      );
      localStorage.setItem("resumate_users", JSON.stringify(users));
      setSuccess("User status updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update user status");
    } finally {
      setSuspendingId(null);
      setUserMenuOpen(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingId(userId);
      const updatedUsers = users.filter((u) => u.id !== userId);
      setUsers(updatedUsers);
      localStorage.setItem("resumate_users", JSON.stringify(updatedUsers));
      setSuccess("User deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete user");
    } finally {
      setDeletingId(null);
      setUserMenuOpen(null);
    }
  };

  const handleChangeRole = (userId, newRole) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, role: newRole } : u
    );
    setUsers(updatedUsers);
    localStorage.setItem("resumate_users", JSON.stringify(updatedUsers));
    setSuccess("User role updated successfully!");
    setTimeout(() => setSuccess(null), 3000);
    setUserMenuOpen(null);
  };

  const filteredUsers = users.filter((user) => {
    if (searchTerm && !user.name?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !user.email?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterRole && user.role !== filterRole) return false;
    if (filterStatus && user.status !== filterStatus) return false;
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
              <p className="text-gray-400">Active Applications</p>
              <TrendingUp className="w-5 h-5 text-neon-cyan" />
            </div>
            <p className="text-3xl font-bold">{stats.activeApplications}</p>
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
              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">User Growth</p>
                  <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-neon-cyan h-full" style={{ width: "75%" }} />
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">System Load</p>
                  <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-neon-green h-full" style={{ width: "35%" }} />
                  </div>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-2">Database Usage</p>
                  <div className="bg-dark-700 rounded-full h-2 overflow-hidden">
                    <div className="bg-neon-pink h-full" style={{ width: "60%" }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="card-glass card-glass-hover p-8 rounded-2xl">
              <h3 className="text-xl font-bold mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {users.slice(0, 5).map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between py-3 border-b border-dark-700 last:border-b-0"
                  >
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                    <span className="text-xs bg-dark-700 px-3 py-1 rounded-full">
                      {user.role || "user"}
                    </span>
                  </div>
                ))}
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
                    <option value="job seeker">Job Seeker</option>
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
            <div className="card-glass card-glass-hover rounded-2xl overflow-hidden">
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
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-dark-700 hover:bg-dark-800/50">
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
                              user.status === "active"
                                ? "bg-neon-green/20 text-neon-green"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {user.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setUserMenuOpen(userMenuOpen === user.id ? null : user.id)
                              }
                              className="p-2 hover:bg-gray-600 rounded-lg transition"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>

                            {userMenuOpen === user.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-dark-800 rounded-lg shadow-lg z-10">
                                <button
                                  onClick={() => handleChangeRole(user.id, "admin")}
                                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-sm"
                                >
                                  Make Admin
                                </button>
                                <button
                                  onClick={() => handleChangeRole(user.id, "recruiter")}
                                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-sm"
                                >
                                  Make Recruiter
                                </button>
                                <button
                                  onClick={() => handleChangeRole(user.id, "job seeker")}
                                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-sm"
                                >
                                  Make Job Seeker
                                </button>
                                <hr className="border-dark-700 my-1" />
                                <button
                                  onClick={() => handleSuspendUser(user.id)}
                                  disabled={suspendingId === user.id}
                                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-sm text-neon-pink"
                                >
                                  {suspendingId === user.id ? "..." : "Suspend"}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deletingId === user.id}
                                  className="w-full text-left px-4 py-2 hover:bg-dark-700 text-sm text-red-400"
                                >
                                  {deletingId === user.id ? "..." : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
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
    </div>
  );
}