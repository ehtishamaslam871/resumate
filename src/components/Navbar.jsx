import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MessageCircle, Menu, X, User } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); 
  const [profileOpen, setProfileOpen] = useState(false); 
  const dropdownRef = useRef(null);

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
    };
    if (profileOpen) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [profileOpen]);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setProfileOpen(false);
    navigate("/");
  };

  // ensure users must be logged in to access Upload
  const handleUpload = (closeMenu = false) => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "null");
      if (!u) {
        if (closeMenu) setOpen(false);
        // send to auth and keep desired redirect in state
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

  // Only show logout/login area when user is signed in AND the current path is NOT home ("/")
  const showLogout = Boolean(user) && location.pathname !== "/";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-b from-[#021018] via-[#02121A] to-transparent border-b border-gray-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-gray-900 font-extrabold">
            RM
          </div>
          <div className="hidden sm:block">
            <div className="font-semibold text-lg">ResuMate</div>
          </div>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="hover:text-cyan-300 transition">Home</Link>
          {!(user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'recruiter')) && (
            <button onClick={() => handleUpload(false)} className="hover:text-cyan-300 transition">Upload</button>
          )}
          <Link to="/about" className="hover:text-cyan-300 transition">About</Link>
          <Link to="/services" className="hover:text-cyan-300 transition">Services</Link>
          <Link to="/contact" className="hover:text-cyan-300 transition">Contact</Link>

          {/* show login button when no user OR show profile area when user is logged in */}
          {!user ? (
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-600 text-gray-900 rounded-full font-medium transition"
            >
              Login
            </button>
          ) : (
            // Profile area displayed top-right after login
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((s) => !s)}
                className="flex items-center gap-3 px-3 py-1 rounded-full hover:bg-gray-800 transition"
                title="Account"
                aria-expanded={profileOpen}
              >
                {user.photo ? (
                  <img src={user.photo} alt={user.name || "User"} className="w-9 h-9 rounded-full object-cover border-2 border-cyan-500" />
                ) : (
                  <User className="w-6 h-6 text-cyan-300" />
                )}
                <span className="hidden sm:inline text-sm">{user.name || user.email}</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-48 bg-gray-900 rounded-lg shadow-lg border border-gray-800 overflow-hidden">
                  <div className="p-3 border-b border-gray-800">
                    <div className="text-sm font-semibold text-white truncate">{user.name || user.email}</div>
                    {user.email && <div className="text-xs text-gray-400 truncate">{user.email}</div>}
                  </div>

                  <ul className="text-sm">
                    <li>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate("/profile");
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-800"
                      >
                        Edit Profile
                      </button>
                    </li>

                    <li>
                      <button
                        onClick={() => {
                          handleLogout();
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-red-600/10 text-red-400"
                      >
                        Logout
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile controls */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setOpen((s) => !s)}
            className="p-2 bg-gray-800 hover:bg-gray-800/80 rounded-md transition"
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-[#02121A]/80">
          <div className="max-w-6xl mx-auto px-4 py-3 flex flex-col gap-2">
            <Link to="/" onClick={() => setOpen(false)} className="py-2 hover:text-cyan-300 transition">Home</Link>
            {!(user && (user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'recruiter')) && (
              <button onClick={() => { setOpen(false); handleUpload(true); }} className="py-2 hover:text-cyan-300 transition text-left">Upload</button>
            )}
            <Link to="/about" onClick={() => setOpen(false)} className="py-2 hover:text-cyan-300 transition">About</Link>
            <Link to="/services" onClick={() => setOpen(false)} className="py-2 hover:text-cyan-300 transition">Services</Link>
            <Link to="/contact" onClick={() => setOpen(false)} className="py-2 hover:text-cyan-300 transition">Contact</Link>

            <div className="pt-2 border-t border-gray-800 flex items-center gap-3">
              {!user ? (
                <button
                  onClick={() => { setOpen(false); navigate("/auth"); }}
                  className="flex-1 px-4 py-2 bg-cyan-500 text-gray-900 rounded-full font-medium"
                >
                  Login
                </button>
              ) : (
                <>
                  <button
                    onClick={() => { setOpen(false); navigate("/profile"); }}
                    className="flex-1 px-4 py-2 bg-gray-800 text-gray-200 rounded-full font-medium"
                  >
                    Edit Profile
                  </button>

                  <button
                    onClick={() => { setOpen(false); handleLogout(); }}
                    className="px-4 py-2 border border-gray-700 rounded-full text-sm text-red-400"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
