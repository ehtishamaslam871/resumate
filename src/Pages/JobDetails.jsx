import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";

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
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-24">
        <div className="bg-gray-800 p-6 rounded-2xl">
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl font-bold text-cyan-300">{job.title}</h1>
              <p className="text-gray-400 mt-1">{job.company}</p>
              <div className="mt-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                        {job.match}% Match
                      </span>
                      {job.dueDate && (
                        <div className="text-sm text-gray-400">
                          Apply by: <span className="font-medium text-gray-200">{new Date(job.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
              </div>
            </div>

            <div className="text-right">
              <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-700 rounded-lg text-sm hover:bg-gray-700/80">Back</button>
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-cyan-300">Role Overview</h3>
              <p className="text-gray-300 mt-2">This role is a great match based on your resume analysis. Below are the core skills typically required.</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {requiredSkills.map((s) => (
                  <span key={s} className={`px-3 py-1 rounded-full text-sm ${matched.includes(s) ? 'bg-cyan-500 text-gray-900' : 'bg-gray-600 text-gray-200'}`}>
                    {s}
                  </span>
                ))}
              </div>

              <div className="mt-4">
                <h4 className="text-sm text-gray-400">Matched Skills</h4>
                <div className="mt-2">
                  {matched.length ? (
                    matched.map((s) => (
                      <span key={s} className="inline-block bg-cyan-500 text-gray-900 px-3 py-1 rounded-full text-sm mr-2 mb-2">{s}</span>
                    ))
                  ) : (
                    <p className="text-gray-400 text-sm">None of the core skills are present. Consider adding projects or experience that highlight these skills.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-cyan-300">How to Improve Your Match</h3>
              <ul className="mt-3 list-disc list-inside text-gray-300">
                <li>Highlight relevant projects using these technologies.</li>
                <li>Add quantifiable results (e.g., "reduced load time by 30% ").</li>
                <li>Include links to GitHub or live demos.</li>
              </ul>

              <div className="mt-6">
                {!applied ? (
                  <button onClick={handleApply} className="w-full py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition">Apply for this Job</button>
                ) : (
                  <div className="p-4 rounded-lg text-center">
                    <div className={`p-3 rounded-md ${applicationStatus === 'Approved' ? 'bg-green-600/20 text-green-300' : applicationStatus === 'Rejected' ? 'bg-red-600/20 text-red-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                      <div className="font-semibold">Application status: {applicationStatus || 'Pending'}</div>
                      {applicationDate && <div className="text-sm text-gray-300 mt-1">Submitted: {new Date(applicationDate).toLocaleString()}</div>}
                    </div>

                    <div className="mt-3 flex gap-2 justify-center">
                      <button onClick={handleCancel} className="px-4 py-2 bg-red-700 rounded-lg text-sm hover:bg-red-600">Cancel Application</button>
                      <button onClick={() => navigate('/profile')} className="px-4 py-2 bg-cyan-500 text-gray-900 rounded-lg text-sm hover:bg-cyan-600">View Profile</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
