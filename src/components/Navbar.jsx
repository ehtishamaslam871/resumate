import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, User, LogOut, Settings, Bell, ChevronRight } from "lucide-react";
import { isAuthenticated, getUserRole, getNavItems, getDefaultRedirect } from '../config/permissions';
import { notificationAPI, clearAuth } from '../services/api';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);
  const notifRef = useRef(null);

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
  });

  // Scroll shadow effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync auth across tabs + custom events
  useEffect(() => {
    const sync = () => { try { setUser(JSON.parse(localStorage.getItem("user"))); } catch { setUser(null); } };
    window.addEventListener("storage", sync);
    window.addEventListener("authChange", sync);
    return () => { window.removeEventListener("storage", sync); window.removeEventListener("authChange", sync); };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    if (profileOpen || notifOpen) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [profileOpen, notifOpen]);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Fetch notifications
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const data = await notificationAPI.getNotifications({ limit: 10 });
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      } catch { /* silently ignore */ }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const markNotificationRead = async (notifId) => {
    try {
      await notificationAPI.markAsRead(notifId);
      setNotifications(prev => prev.map(n => n._id === notifId ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* ignore */ }
  };

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };

  const handleLogout = () => {
    clearAuth();
    setUser(null);
    setProfileOpen(false);
    navigate("/");
  };

  const handleUpload = (closeMenu = false) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u) { if (closeMenu) setOpen(false); navigate("/auth", { state: { from: "/upload" } }); return; }
    } catch { if (closeMenu) setOpen(false); navigate("/auth", { state: { from: "/upload" } }); return; }
    if (closeMenu) setOpen(false);
    navigate("/upload");
  };

  const isActive = (path) => location.pathname === path;

  const initials = user?.name
    ? user.name.split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()
    : null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-dark-950/90 backdrop-blur-xl border-b border-dark-700/60 shadow-lg shadow-dark-950/50'
        : 'bg-dark-950/70 backdrop-blur-md border-b border-dark-800/40'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple
              flex items-center justify-center text-dark-950 font-extrabold text-xs
              group-hover:shadow-lg group-hover:shadow-neon-cyan/40 transition-all duration-300">
            RM
          </div>
          <span className="hidden sm:block font-display font-bold text-base text-gray-100 group-hover:text-neon-cyan transition-colors duration-300">
            ResuMate
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-1">
          {getNavItems().map((link) => {
            const active = isActive(link.path);
            const cls = `relative text-sm font-medium transition-all duration-300 px-4 py-2 rounded-xl ${
              active
                ? "text-neon-cyan bg-neon-cyan/10"
                : "text-gray-400 hover:text-gray-100 hover:bg-dark-800/40"
            }`;
            return link.action === 'upload' ? (
              <button key={link.name} onClick={() => handleUpload()} className={cls}>
                {link.name}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-neon-cyan" />}
              </button>
            ) : (
              <Link key={link.name} to={link.path} className={cls}>
                {link.name}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-neon-cyan" />}
              </Link>
            );
          })}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Notification Bell */}
          {user && (
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => { setNotifOpen(!notifOpen); setProfileOpen(false); }}
                className="relative p-2.5 rounded-xl hover:bg-dark-800/50 transition-all duration-300 group"
              >
                <Bell className="w-[18px] h-[18px] text-gray-400 group-hover:text-neon-cyan transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-dark-950">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 card-glass rounded-2xl shadow-2xl shadow-dark-950/50 overflow-hidden animate-scale-in z-50 border border-dark-700/60">
                  <div className="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
                    <p className="font-semibold text-gray-100 text-sm">Notifications</p>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-neon-cyan hover:text-neon-cyan/80 font-medium transition">
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-dark-700/30">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No notifications yet</p>
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
                          className={`px-4 py-3 cursor-pointer transition-colors hover:bg-dark-800/40 ${
                            !notif.isRead ? 'bg-neon-cyan/5' : ''
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            {!notif.isRead && (
                              <div className="w-2 h-2 rounded-full bg-neon-cyan mt-1.5 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">{notif.title}</p>
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{notif.message}</p>
                              <p className="text-[11px] text-gray-500 mt-1">
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
                onClick={() => { setProfileOpen(!profileOpen); setNotifOpen(false); }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-dark-800/60 hover:bg-dark-800
                  border border-dark-700/50 hover:border-neon-cyan/30
                  transition-all duration-300 group"
              >
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple
                  flex items-center justify-center text-dark-950 text-[10px] font-bold">
                  {initials || <User className="w-3.5 h-3.5" />}
                </div>
                <span className="hidden sm:inline text-sm font-medium text-gray-200 group-hover:text-gray-100 transition-colors">
                  {user.name ? user.name.split(" ")[0] : "Profile"}
                </span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 card-glass rounded-2xl shadow-2xl shadow-dark-950/50 overflow-hidden animate-scale-in border border-dark-700/60">
                  <div className="p-4 border-b border-dark-700/50">
                    <p className="text-xs text-gray-500 mb-0.5">Signed in as</p>
                    <p className="font-semibold text-gray-100 text-sm truncate">{user.name || user.email}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="p-2">
                    <Link
                      to="/profile"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-gray-300
                        hover:text-neon-cyan hover:bg-dark-800/50 rounded-xl transition-all duration-200 group"
                    >
                      <Settings className="w-4 h-4 text-gray-500 group-hover:text-neon-cyan transition-colors" />
                      Settings
                      <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400
                        hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all duration-200"
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
              className="hidden sm:inline-flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-neon-cyan to-neon-purple
                text-dark-950 rounded-xl font-semibold text-sm
                shadow-lg shadow-neon-cyan/25 hover:shadow-neon-cyan/40
                hover:brightness-110 transition-all duration-300"
            >
              Sign In
            </button>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2.5 rounded-xl hover:bg-dark-800/60 transition-all duration-200 border border-transparent hover:border-dark-700/50"
          >
            {open ? <X className="w-5 h-5 text-gray-100" /> : <Menu className="w-5 h-5 text-gray-100" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-out ${
        open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
      }`}>
        <div className="border-t border-dark-700/50 bg-dark-950/95 backdrop-blur-xl">
          <div className="px-4 py-4 space-y-1">
            {getNavItems().map((link) => {
              const active = isActive(link.path);
              const cls = `flex items-center gap-3 w-full text-left px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                active
                  ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/20'
                  : 'text-gray-300 hover:text-gray-100 hover:bg-dark-800/50'
              }`;
              return link.action === 'upload' ? (
                <button key={link.name} onClick={() => handleUpload(true)} className={cls}>
                  {link.name}
                </button>
              ) : (
                <Link key={link.name} to={link.path} onClick={() => setOpen(false)} className={cls}>
                  {link.name}
                </Link>
              );
            })}

            {!user && (
              <button
                onClick={() => { navigate("/auth"); setOpen(false); }}
                className="w-full mt-2 px-4 py-3 bg-gradient-to-r from-neon-cyan to-neon-purple
                  text-dark-950 rounded-xl font-semibold text-sm shadow-lg shadow-neon-cyan/25 transition-all duration-300"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
