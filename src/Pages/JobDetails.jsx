import React, { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
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

  const handleApply = async () => {
    let user = null
    try {
      user = JSON.parse(localStorage.getItem("resumate_user") || localStorage.getItem("user") || "null");
      if (!user) {
        navigate("/auth", { replace: true });
        return;
      }
    } catch (e) {
      navigate("/auth", { replace: true });
      return;
    }

    try {
      // If we have a job ID from the backend, use the API
      if (job._id || job.id) {
        const jobId = job._id || job.id;
        
        // Get user's resumes
        const resumesResponse = await api.resume.getUserResumes();
        const resumes = resumesResponse.resumes || resumesResponse || [];
        
        if (!resumes || resumes.length === 0) {
          alert("Please upload a resume before applying for jobs");
          navigate("/upload");
          return;
        }

        const resumeId = resumes[0]._id || resumes[0].id;
        await api.application.createApplication(jobId, resumeId);
      }

      // Update local state
      const now = new Date().toISOString();
      setApplied(true);
      setApplicationStatus("Pending");
      setApplicationDate(now);
    } catch (e) {
      console.error("Application error:", e);
      alert(e.message || "Failed to submit application");
    }
  };

  // load any existing application for this job from localStorage
  useEffect(() => {
    const checkExistingApplication = async () => {
      try {
        // Try backend first if we have a job ID
        if (job._id || job.id) {
          const response = await api.application.getMyApplications();
          const applications = response.applications || response || [];
          const jobId = job._id || job.id;
          const found = applications.find(a => 
            (a.job?._id || a.job) === jobId || a.jobId === jobId
          );
          if (found) {
            setApplied(true);
            setApplicationStatus(found.status || "Pending");
            setApplicationDate(found.createdAt || found.date || null);
            return;
          }
        }
        // Fallback: not applied
        setApplied(false);
        setApplicationStatus(null);
        setApplicationDate(null);
      } catch (e) {
        // If API fails, don't block the page
        setApplied(false);
      }
    };

    checkExistingApplication();
  }, [job.title, job.company, job._id, job.id]);

  const handleCancel = () => {
    // For now, just reset local state. Backend doesn't support withdraw yet.
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
