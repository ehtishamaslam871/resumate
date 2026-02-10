import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function JobDetails() {
  const { title } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [applied, setApplied] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState(null);
  const [applicationDate, setApplicationDate] = useState(null);

  // job and skills may be passed via location.state from Analytics
  const job = location.state?.job || { title: decodeURIComponent(title || ""), company: "Unknown", match: "-" };
  const userSkills = location.state?.skills || [];

  // light-weight mapping to suggest required skills based on title keywords
  const requiredSkills = useMemo(() => {
    const t = (job.title || "").toLowerCase();
    if (t.includes("frontend")) return ["JavaScript", "React", "HTML", "CSS"];
    if (t.includes("full")) return ["JavaScript", "React", "Node.js", "MongoDB"];
    if (t.includes("react")) return ["React", "JavaScript", "Redux"];
    return ["JavaScript", "Communication"];
  }, [job.title]);

  const matched = requiredSkills.filter((s) => userSkills.includes(s));

  const handleApply = () => {
    let user = null
    try {
      user = JSON.parse(localStorage.getItem("resumate_user") || "null");
      if (!user) {
        // require login/signup
        navigate("/auth", { replace: true });
        return;
      }
    } catch (e) {
      navigate("/auth", { replace: true });
      return;
    }

    // simulate an application submission
    const now = new Date().toISOString();
    setApplied(true);
    setApplicationStatus("Pending");
    setApplicationDate(now);

    // persist applications to localStorage with a status field and user id
    try {
      const appsKey = "resumate_applications";
      const existing = JSON.parse(localStorage.getItem(appsKey) || "[]");
      // try to avoid duplicate entries:
      // - if an entry exists for this job/company with no userId (legacy), upgrade it to belong to this user
      // - if an entry exists for this job/company and already belongs to this user, don't add another
      const idx = existing.findIndex(a => a.job === job.title && a.company === job.company)
      if (idx >= 0) {
        const entry = existing[idx]
        if (!entry.userId) {
          // upgrade legacy entry to belong to this user and refresh date/status
          existing[idx] = { ...entry, userId: user?.id || user?.email || null, date: now, status: 'Pending' }
        } else if (entry.userId === user?.id || entry.userId === user?.email) {
          // already applied by this user; update timestamp/status in-place
          existing[idx] = { ...entry, date: now, status: 'Pending' }
        } else {
          // different user's application exists; append new entry for current user
          existing.push({ job: job.title, company: job.company, date: now, status: 'Pending', userId: user?.id || user?.email || null })
        }
      } else {
        existing.push({ job: job.title, company: job.company, date: now, status: "Pending", userId: user?.id || user?.email || null });
      }
      localStorage.setItem(appsKey, JSON.stringify(existing));
      // If this user had previously hidden a legacy entry for this job, remove that hidden flag
      try {
        const hiddenKey = 'resumate_hidden_applications'
        const hidden = JSON.parse(localStorage.getItem(hiddenKey) || '[]')
        const cleaned = hidden.filter(h => !(h.job === job.title && h.company === job.company && (h.userId === user?.id || h.userId === user?.email)))
        if (cleaned.length !== hidden.length) {
          localStorage.setItem(hiddenKey, JSON.stringify(cleaned))
        }
      } catch (e) {
        // ignore hidden list errors
      }
    } catch (e) {}
  };

  // load any existing application for this job from localStorage
  useEffect(() => {
    const fetchApplicationFromStorage = () => {
      try {
        const appsKey = "resumate_applications";
        const existing = JSON.parse(localStorage.getItem(appsKey) || "[]");
        // Only consider applications that belong to the current signed-in user.
        const currentUser = JSON.parse(localStorage.getItem('resumate_user') || 'null');
        if (!currentUser) {
          // If no user is signed in, do not mark the job as applied.
          setApplied(false);
          setApplicationStatus(null);
          setApplicationDate(null);
          return;
        }

        const found = existing.find((a) => a.job === job.title && a.company === job.company && (a.userId === currentUser.id || a.userId === currentUser.email));
        if (found) {
          setApplied(true);
          setApplicationStatus(found.status || "Pending");
          setApplicationDate(found.date || null);
        } else {
          setApplied(false);
          setApplicationStatus(null);
          setApplicationDate(null);
        }
      } catch (e) {
        // ignore parse errors
      }
    };

    fetchApplicationFromStorage();
  }, [job.title, job.company]);

  const handleCancel = () => {
    // require login to cancel
    let user = null
    try {
      user = JSON.parse(localStorage.getItem('resumate_user') || 'null')
      if (!user) {
        navigate('/auth', { replace: true })
        return
      }
    } catch (e) {
      navigate('/auth', { replace: true })
      return
    }

    try {
      const appsKey = 'resumate_applications'
      const existing = JSON.parse(localStorage.getItem(appsKey) || '[]')
      // remove only applications that belong to this user (or match user id/email)
      const filtered = existing.filter(a => {
        if (a.job !== job.title || a.company !== job.company) return true
        // keep the entry if it doesn't belong to current user
        if (!a.userId) return true
        return !(a.userId === user.id || a.userId === user.email)
      })
      localStorage.setItem(appsKey, JSON.stringify(filtered))
    } catch (e) {
      // ignore storage errors
    }

    // update local state
    setApplied(false)
    setApplicationStatus(null)
    setApplicationDate(null)
  }

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-5xl mx-auto px-6 py-20">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-neon-cyan hover:text-neon-blue transition font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Job Header Card */}
        <div className="card-glass p-8 mb-8">
          <h1 className="text-4xl font-bold text-gray-100 mb-2">{job.title}</h1>
          <p className="text-gray-400 text-lg mb-6">{job.company}</p>
          
          <div className="flex items-center gap-4 flex-wrap">
            {job.match && (
              <div className="badge-primary">
                {job.match}% Match
              </div>
            )}
            {job.dueDate && (
              <div className="text-sm text-gray-400">
                Apply by: <span className="font-semibold text-gray-100">{new Date(job.dueDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column - Role Overview & Recommendations */}
          <div className="md:col-span-2 space-y-8">
            {/* Skills Section */}
            <div className="card-glass p-8">
              <h3 className="text-2xl font-bold text-gray-100 mb-4">Required Skills</h3>
              <p className="text-gray-400 mb-6">Below are the core skills typically required for this role.</p>

              <div className="space-y-6">
                <div>
                  <h4 className="text-sm uppercase tracking-wider text-gray-400 font-semibold mb-3">All Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {requiredSkills.map((s) => (
                      <span 
                        key={s} 
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                          matched.includes(s) 
                            ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50' 
                            : 'bg-dark-700/50 text-gray-400 border border-dark-600'
                        }`}
                      >
                        {matched.includes(s) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {matched.length > 0 && (
                  <div>
                    <h4 className="text-sm uppercase tracking-wider text-neon-cyan font-semibold mb-3">
                      ✓ Your Matched Skills ({matched.length}/{requiredSkills.length})
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {matched.map((s) => (
                        <span key={s} className="px-3 py-1.5 bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/50 rounded-lg text-sm font-semibold flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" />
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="card-glass p-8 border border-neon-cyan/20">
              <h3 className="text-2xl font-bold text-gray-100 mb-4 flex items-center gap-2">
                <AlertCircle className="w-6 h-6 text-neon-purple" />
                How to Improve Your Match
              </h3>
              <ul className="space-y-3 text-gray-400">
                <li className="flex gap-3">
                  <span className="text-neon-purple mt-1">•</span>
                  <span>Highlight relevant projects using these technologies.</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-blue mt-1">•</span>
                  <span>Add quantifiable results (e.g., "reduced load time by 30%").</span>
                </li>
                <li className="flex gap-3">
                  <span className="text-neon-pink mt-1">•</span>
                  <span>Include links to GitHub repositories or live demos.</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Right Column - Application Status */}
          <div className="md:col-span-1">
            <div className="card-glass-hover p-8 sticky top-24">
              {!applied ? (
                <div>
                  <button 
                    onClick={handleApply} 
                    className="btn-primary w-full mb-4"
                  >
                    Apply for this Job
                  </button>
                  <p className="text-sm text-gray-400 text-center">
                    You'll be asked to sign in if needed
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg border ${
                    applicationStatus === 'Approved' 
                      ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                      : applicationStatus === 'Rejected' 
                      ? 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  }`}>
                    <div className="font-bold text-sm mb-1">Application Status</div>
                    <div className="text-lg font-bold">{applicationStatus || 'Pending'}</div>
                    {applicationDate && (
                      <div className="text-xs mt-2 opacity-75">
                        Submitted: {new Date(applicationDate).toLocaleString()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button 
                      onClick={handleCancel} 
                      className="btn-secondary w-full text-sm"
                    >
                      Cancel Application
                    </button>
                    <button 
                      onClick={() => navigate('/profile')} 
                      className="btn-primary w-full text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
