import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, FileText, Briefcase, Settings, Bell } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); 
  const [profileOpen, setProfileOpen] = useState(false); 
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  // simple auth state from localStorage
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  // keep navbar in sync if other tabs change auth
  useEffect(() => {
    const onStorage = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Also listen for custom auth events
  useEffect(() => {
    const handleAuthChange = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("authChange", handleAuthChange);
    return () => window.removeEventListener("authChange", handleAuthChange);
  }, []);

  // close profile dropdown when clicking outside
  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false);
      }
    };
    if (profileOpen || notifOpen) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [profileOpen, notifOpen]);

  // Fetch notifications for authenticated users  
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch('http://localhost:5001/api/notifications?limit=10', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (e) {
        // silently ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (notifId) => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`http://localhost:5001/api/notifications/${notifId}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('http://localhost:5001/api/notifications/markall/read', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) { /* ignore */ }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    navigate("/");
  };

  const handleUpload = (closeMenu = false) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u) {
        if (closeMenu) setOpen(false);
        navigate("/auth", { state: { from: "/upload" } });
        return;
      }
    } catch (e) {
      if (closeMenu) setOpen(false);
      navigate("/auth", { state: { from: "/upload" } });
      return;
    }

    if (closeMenu) setOpen(false);
    navigate("/upload");
  };

  const showLogout = Boolean(user) && location.pathname !== "/";

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-dark-950/80 border-b border-neon-cyan/20">
      <div className="max-w-full mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple 
              flex items-center justify-center text-dark-950 font-extrabold text-xs group-hover:shadow-lg group-hover:shadow-neon-cyan/50 transition-all">
            RM
          </div>
          <span className="hidden sm:block font-display font-bold text-sm text-gray-100">
            ResuMate
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {user && (user.role === 'admin' || user.role === 'recruiter') ? (
            <Link
              to={user.role === 'admin' ? '/admin' : '/recruiter'}
              className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                isActive(user.role === 'admin' ? '/admin' : '/recruiter') || isActive('/') ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
              }`}
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/"
              className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                isActive("/") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
              }`}
            >
              Home
            </Link>
          )}
          {user && user.role !== 'admin' && user.role !== 'recruiter' && (
            <>
              <button
                onClick={() => handleUpload()}
                className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                  isActive("/upload") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
                }`}
              >
                Upload
              </button>
              <Link
                to="/jobs"
                className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
                  isActive("/jobs") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
                }`}
              >
                Jobs
              </Link>
            </>
          )}
          <Link
            to="/services"
            className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
              isActive("/services") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
            }`}
          >
            Services
          </Link>
          <Link
            to="/contact"
            className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
              isActive("/contact") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
            }`}
          >
            Contact
          </Link>
          <Link
            to="/about"
            className={`text-xs font-semibold transition-all duration-300 px-3 py-2 rounded-lg ${
              isActive("/about") ? "text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30" : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/50"
            }`}
          >
            About
          </Link>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-lg hover:bg-dark-800/50 transition-all duration-300"
              >
                <Bell className="w-5 h-5 text-gray-400 hover:text-neon-cyan transition" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 card-glass rounded-xl shadow-xl overflow-hidden animate-slide-up z-50 border border-neon-cyan/20">
                  <div className="p-3 border-b border-dark-600 flex items-center justify-between">
                    <p className="font-semibold text-gray-100 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-[10px] text-neon-cyan hover:text-neon-cyan/80 font-semibold transition"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500 text-xs">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          onClick={() => {
                            if (!notif.isRead) markNotificationRead(notif._id);
                            if (notif.actionUrl) navigate(notif.actionUrl);
                            setNotifOpen(false);
                          }}
                          className={`px-3 py-3 border-b border-dark-700/30 cursor-pointer transition hover:bg-dark-800/50 ${
                            !notif.isRead ? 'bg-neon-cyan/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-neon-cyan mt-1.5 flex-shrink-0"></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-gray-200 truncate">{notif.title}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[10px] text-gray-500 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString()} {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 hover:from-neon-cyan/30 hover:to-neon-purple/30 border border-neon-cyan/50 transition-all duration-300 shadow-lg shadow-neon-cyan/20"
              >
                <User className="w-4 h-4 text-neon-cyan" />
                <span className="hidden sm:inline text-xs font-bold text-gray-100">
                  {user.name ? user.name.split(" ")[0] : "Profile"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 card-glass rounded-xl shadow-xl overflow-hidden animate-slide-up">
                  <div className="p-3 border-b border-dark-600">
                    <p className="text-xs text-gray-400">Signed in as</p>
                    <p className="font-semibold text-gray-100 text-sm">{user.name || user.email}</p>
                  </div>

                  <div className="p-2 space-y-1">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-gray-300 hover:text-neon-cyan hover:bg-dark-800/50 rounded-lg transition-colors duration-300"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-300"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => navigate("/auth")}
              className="hidden sm:inline-flex px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-950 rounded-lg font-bold text-xs shadow-lg shadow-neon-cyan/50 hover:shadow-neon-cyan/70 transition-all duration-300 hover:scale-105"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2.5 hover:bg-dark-800 rounded-lg transition-all duration-300 hover:border border-dark-600"
          >
            {open ? (
              <X className="w-5 h-5 text-gray-100" />
            ) : (
              <Menu className="w-5 h-5 text-gray-100" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-neon-cyan/20 bg-dark-950/95 backdrop-blur-md animate-slide-up">
          <div className="max-w-7xl mx-auto px-4 py-3 space-y-2">
            {user && (user.role === 'admin' || user.role === 'recruiter') ? (
              <Link
                to={user.role === 'admin' ? '/admin' : '/recruiter'}
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
              >
                Home
              </Link>
            )}
            {user && user.role !== 'admin' && user.role !== 'recruiter' && (
              <>
                <button
                  onClick={() => handleUpload(true)}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
                >
                  Upload Resume
                </button>
                <Link
                  to="/jobs"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
                >
                  Jobs
                </Link>
              </>
            )}
            <Link
              to="/services"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
            >
              Services
            </Link>
            <Link
              to="/contact"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
            >
              Contact
            </Link>
            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-xs font-semibold text-gray-100 hover:bg-neon-cyan/10 hover:text-neon-cyan rounded-lg transition-colors duration-300"
            >
              About
            </Link>
            {!user && (
              <button
                onClick={() => {
                  navigate("/auth");
                  setOpen(false);
                }}
                className="w-full px-4 py-2 bg-gradient-to-r from-neon-cyan to-neon-blue text-dark-950 rounded-lg font-bold text-xs shadow-lg shadow-neon-cyan/50 mt-2 transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
