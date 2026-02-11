import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { Plus, Edit, Trash2, Eye, Loader, AlertCircle, CheckCircle, X, Save, UserCheck, UserX, ChevronDown, ChevronUp, Mail, Phone, FileText, ExternalLink, Sparkles, TrendingUp, Star } from "lucide-react";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [loadingApps, setLoadingApps] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [expandedApp, setExpandedApp] = useState(null);
  const [shortlisting, setShortlisting] = useState(null);
  const [showTopOnly, setShowTopOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const CURRENCIES = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'PKR', symbol: 'Rs', name: 'Pakistani Rupee' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'AED', symbol: 'د.إ', name: 'UAE Dirham' },
    { code: 'SAR', symbol: '﷼', name: 'Saudi Riyal' },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  ];

  const getCurrencySymbol = (code) => CURRENCIES.find(c => c.code === code)?.symbol || '$';

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    locationType: "on-site",
    jobType: "full-time",
    experienceLevel: "mid-level",
    salary: "",
    currency: "USD",
    requiredSkills: "",
    requirements: "",
    applicationDeadline: "",
  });

  // Fetch recruiter's jobs and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check both new API key ('user') and old demo key ('resumate_user')
        let user = JSON.parse(localStorage.getItem("user") || "null");
        if (!user) {
          user = JSON.parse(localStorage.getItem("resumate_user") || "null");
        }
        
        const userRole = user?.role ? user.role.toLowerCase() : '';
        if (!user || userRole !== "recruiter") {
          navigate("/auth");
          return;
        }

        // Fetch only this recruiter's jobs (uses auth token to filter server-side)
        const jobsResponse = await api.job.getRecruiterJobs();
        const fetchedJobs = jobsResponse.jobs || [];
        setJobs(fetchedJobs);

        // Fetch applications for all recruiter's jobs
        const allApps = [];
        for (const job of fetchedJobs) {
          try {
            const appRes = await api.application.getJobApplications(job._id);
            const jobApps = (appRes.applications || []).map(app => ({
              ...app,
              jobTitle: app.jobTitle || job.title,
              companyName: app.companyName || job.company,
            }));
            allApps.push(...jobApps);
          } catch (e) {
            // skip if no applications for this job
          }
        }
        setApplications(allApps);
      } catch (err) {
        setError(err.message || "Failed to load recruiter data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const salaryNum = parseInt(formData.salary) || 0;
      const jobPayload = {
        ...formData,
        salaryMin: salaryNum,
        salaryMax: salaryNum,
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        requirements: formData.requirements
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      delete jobPayload.salary;

      if (editingId) {
        // Update existing job
        await api.job.updateJob(editingId, jobPayload);
        setJobs((prev) =>
          prev.map((job) =>
            job._id === editingId ? { ...job, ...jobPayload } : job
          )
        );
        setSuccess("Job updated successfully!");
        setEditingId(null);
      } else {
        // Create new job
        const response = await api.job.createJob(jobPayload);
        setJobs((prev) => [...prev, response.job]);
        setSuccess("Job posted successfully!");
      }

      setFormData({
        title: "",
        company: "",
        description: "",
        location: "",
        locationType: "on-site",
        jobType: "full-time",
        experienceLevel: "mid-level",
        salary: "",
        currency: "USD",
        requiredSkills: "",
        requirements: "",
        applicationDeadline: "",
      });
      setShowCreateForm(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to save job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    try {
      setDeleting(jobId);
      await api.job.deleteJob(jobId);
      setJobs((prev) => prev.filter((job) => job._id !== jobId));
      setSuccess("Job deleted successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete job");
    } finally {
      setDeleting(null);
    }
  };

  const handleEditJob = (job) => {
    setFormData({
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      locationType: job.locationType || "on-site",
      jobType: job.jobType,
      experienceLevel: job.experienceLevel || "mid-level",
      salary: job.salaryMin || job.salary || "",
      currency: job.currency || "USD",
      requiredSkills: job.requiredSkills?.join(", ") || "",
      requirements: job.requirements?.join(", ") || "",
      applicationDeadline: job.applicationDeadline ? new Date(job.applicationDeadline).toISOString().split('T')[0] : "",
    });
    setEditingId(job._id);
    setShowCreateForm(true);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setShowCreateForm(false);
    setFormData({
      title: "",
      company: "",
      description: "",
      location: "",
      locationType: "on-site",
      jobType: "full-time",
      experienceLevel: "mid-level",
      salary: "",
      currency: "USD",
      requiredSkills: "",
      requirements: "",
      applicationDeadline: "",
    });
  };

  // View applicants for a specific job
  const handleViewApplicants = async (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab("applications");
    setLoadingApps(true);
    try {
      const appRes = await api.application.getJobApplications(jobId);
      setApplications(appRes.applications || []);
    } catch (err) {
      setError(err.message || "Failed to load applicants");
    } finally {
      setLoadingApps(false);
    }
  };

  // View all applications across all jobs
  const handleViewAllApplications = async () => {
    setSelectedJobId(null);
    setShowTopOnly(false);
    setLoadingApps(true);
    try {
      const allApps = [];
      for (const job of jobs) {
        try {
          const appRes = await api.application.getJobApplications(job._id);
          const jobApps = (appRes.applications || []).map(app => ({
            ...app,
            jobTitle: app.jobTitle || job.title,
            companyName: app.companyName || job.company,
          }));
          allApps.push(...jobApps);
        } catch (e) { /* skip */ }
      }
      setApplications(allApps);
    } catch (err) {
      setError(err.message || "Failed to load applications");
    } finally {
      setLoadingApps(false);
    }
  };

  // Update application status (accept/reject/shortlist/reviewing)
  const handleUpdateStatus = async (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);
    try {
      await api.application.updateApplicationStatus(applicationId, newStatus);
      setApplications(prev =>
        prev.map(app =>
          app._id === applicationId ? { ...app, status: newStatus } : app
        )
      );
      setSuccess(`Application ${newStatus === 'accepted' ? 'approved' : newStatus} successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to update application status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  // AI Shortlist - runs AI analysis on all applicants for a job
  const handleAIShortlist = async (jobId) => {
    setShortlisting(jobId);
    setError(null);
    try {
      const response = await api.application.aiShortlistApplications(jobId, { topN: 10 });
      const shortlisted = response.shortlistedCandidates || [];
      setSuccess(`AI shortlisted ${shortlisted.length} candidates! Showing top matches only...`);
      setShowTopOnly(true);
      
      // Refresh applications for this job
      setTimeout(async () => {
        await handleViewApplicants(jobId);
        setSuccess(null);
      }, 1500);
    } catch (err) {
      setError(err.message || "AI shortlisting failed. Try again later.");
    } finally {
      setShortlisting(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-neon-cyan';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getScoreRingColor = (score) => {
    if (score >= 80) return 'border-green-400 bg-green-500/10';
    if (score >= 60) return 'border-neon-cyan bg-neon-cyan/10';
    if (score >= 40) return 'border-yellow-400 bg-yellow-500/10';
    return 'border-red-400 bg-red-500/10';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'shortlisted': return 'bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50';
      case 'reviewing': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'applied': return 'Pending';
      case 'accepted': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'shortlisted': return 'Shortlisted';
      case 'reviewing': return 'Reviewing';
      default: return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Pending';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white">
        <Navbar />
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-xl">Loading recruiter dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div>
            <h1 className="text-5xl font-bold mb-3 text-gray-100">Recruiter Dashboard</h1>
            <p className="text-neon-cyan font-semibold text-lg">Post jobs, manage applications, and find top talent</p>
          </div>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary flex items-center gap-2 px-8 py-3 font-bold text-lg shadow-lg shadow-neon-cyan/50"
            >
              <Plus className="w-6 h-6" />
              Post New Job
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-10 p-6 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 text-lg">Error</p>
              <p className="text-red-300 text-base mt-2">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-10 p-6 bg-neon-green/20 border border-neon-green/50 rounded-2xl flex items-start gap-4">
            <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
            <p className="text-neon-green font-semibold text-base">{success}</p>
          </div>
        )}

        {/* Create Job Form */}
        {showCreateForm && (
          <div className="card-glass p-10 rounded-2xl mb-16 border border-neon-cyan/20">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-gray-100">
                {editingId ? "Edit Job Posting" : "Create New Job Posting"}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-dark-800 rounded-lg transition text-neon-cyan hover:text-neon-blue"
              >
                <X className="w-7 h-7" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-8">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Senior React Developer"
                    required
                    className="input-modern w-full"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleFormChange}
                    placeholder="Company name"
                    required
                    className="input-modern w-full"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="e.g., San Francisco, CA"
                    required
                    className="input-modern w-full"
                  />
                </div>

                {/* Location Type */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Location Type *</label>
                  <select
                    name="locationType"
                    value={formData.locationType}
                    onChange={handleFormChange}
                    className="input-modern w-full"
                  >
                    <option value="on-site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Job Type *</label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleFormChange}
                    className="input-modern w-full"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="part-time">Part-time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                  </select>
                </div>

                {/* Experience Level */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Experience Level *</label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleFormChange}
                    className="input-modern w-full"
                  >
                    <option value="entry-level">Entry Level</option>
                    <option value="mid-level">Mid Level</option>
                    <option value="senior">Senior</option>
                    <option value="lead">Lead</option>
                  </select>
                </div>

                {/* Salary + Currency */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Salary (Annual) *</label>
                  <div className="flex gap-2">
                    <select
                      name="currency"
                      value={formData.currency}
                      onChange={handleFormChange}
                      className="input-modern w-28 text-center"
                    >
                      {CURRENCIES.map(c => (
                        <option key={c.code} value={c.code}>{c.symbol} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary}
                      onChange={handleFormChange}
                      placeholder="e.g., 120000"
                      required
                      className="input-modern flex-1"
                    />
                  </div>
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Required Skills *</label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleFormChange}
                    placeholder="e.g., React, JavaScript, Node.js"
                    required
                    className="input-modern w-full"
                  />
                  <p className="text-xs text-gray-400 mt-2">Separate skills with commas</p>
                </div>

                {/* Application Deadline */}
                <div>
                  <label className="block text-sm font-bold text-neon-cyan mb-3">Application Deadline</label>
                  <input
                    type="date"
                    name="applicationDeadline"
                    value={formData.applicationDeadline}
                    onChange={handleFormChange}
                    className="input-modern w-full"
                  />
                </div>
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-bold text-neon-cyan mb-3">Requirements</label>
                <input
                  type="text"
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleFormChange}
                  placeholder="e.g., 3+ years experience, Bachelor's degree, Strong communication"
                  className="input-modern w-full"
                />
                <p className="text-xs text-gray-400 mt-2">Separate requirements with commas</p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-neon-cyan mb-3">Job Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Detailed job description..."
                  required
                  rows={6}
                  className="input-modern w-full resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 text-base ${
                    submitting
                      ? "bg-gray-700/50 text-gray-400 cursor-not-allowed"
                      : "btn-primary"
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      {editingId ? "Update Job" : "Post Job"}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex-1 btn-secondary py-3 font-bold text-base"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-neon-cyan/20 mb-10">
          <div className="flex gap-8">
            {[
              { id: "jobs", label: `Posted Jobs (${jobs.length})` },
              { id: "applications", label: `Applications (${applications.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-bold text-lg transition border-b-2 ${
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

        {/* Jobs Tab */}
        {activeTab === "jobs" && (
          <div>
            {jobs.length === 0 ? (
              <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
                <p className="text-gray-400 text-xl mb-8">No jobs posted yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary px-8 py-3 font-bold"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="card-glass card-glass-hover p-8 rounded-2xl border border-neon-cyan/20"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold text-gray-100">{job.title}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            job.status === 'open' ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' :
                            job.status === 'closed' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                            'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
                          }`}>{job.status || 'open'}</span>
                        </div>
                        <p className="text-neon-cyan font-semibold text-sm mb-1">{job.company}</p>
                        <p className="text-gray-400 mb-4 text-base">{job.description?.substring(0, 150)}...</p>

                        <div className="flex items-center gap-4 text-sm text-gray-400 flex-wrap mb-3">
                          <span className="flex items-center gap-1.5"><span className="text-neon-cyan">📍</span> {job.location} <span className="text-gray-600">•</span> <span className="capitalize">{job.locationType || 'on-site'}</span></span>
                          <span className="flex items-center gap-1.5"><span className="text-neon-cyan">💼</span> <span className="capitalize">{job.jobType}</span></span>
                          <span className="flex items-center gap-1.5"><span className="text-neon-cyan">🎯</span> <span className="capitalize">{job.experienceLevel || 'mid-level'}</span></span>
                          <span className="flex items-center gap-1.5"><span className="text-neon-cyan">💰</span> {getCurrencySymbol(job.currency)}{(job.salaryMin || job.salary || 0).toLocaleString()} <span className="text-gray-500 text-xs">{job.currency || 'USD'}/yr</span></span>
                          <span className="flex items-center gap-1.5"><span className="text-neon-cyan">📅</span> {new Date(job.postedDate || job.createdAt || Date.now()).toLocaleDateString()}</span>
                          {job.applicationDeadline && <span className="flex items-center gap-1.5"><span className="text-neon-pink">⏰</span> Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>}
                        </div>

                        {job.requiredSkills?.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-2">
                            {job.requiredSkills.map((skill, i) => (
                              <span key={i} className="px-2.5 py-1 bg-neon-cyan/10 text-neon-cyan text-xs font-semibold rounded-lg border border-neon-cyan/20">{skill}</span>
                            ))}
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-xs text-gray-500 mt-2">
                          <span>👁 {job.viewCount || 0} views</span>
                          <span>📝 {job.applicantCount || 0} applicants</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <button 
                          onClick={() => handleViewApplicants(job._id)}
                          className="p-3 bg-dark-800/50 hover:bg-neon-cyan/20 border border-dark-600 hover:border-neon-cyan/50 rounded-lg transition text-neon-cyan"
                          title="View applicants"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleAIShortlist(job._id)}
                          disabled={shortlisting === job._id || (job.applicantCount || 0) === 0}
                          className="p-3 bg-dark-800/50 hover:bg-purple-500/20 border border-dark-600 hover:border-purple-500/50 rounded-lg transition text-purple-400 disabled:opacity-30 disabled:cursor-not-allowed"
                          title="AI Shortlist candidates"
                        >
                          {shortlisting === job._id ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Sparkles className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-3 bg-dark-800/50 hover:bg-neon-blue/20 border border-dark-600 hover:border-neon-blue/50 rounded-lg transition text-neon-blue"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          disabled={deleting === job._id}
                          className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg transition text-red-400"
                        >
                          {deleting === job._id ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Trash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === "applications" && (
          <div>
            {/* Filter bar */}
            <div className="flex items-center gap-4 mb-8 flex-wrap">
              <button
                onClick={handleViewAllApplications}
                className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${
                  !selectedJobId
                    ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50"
                    : "bg-dark-800/50 text-gray-400 border-dark-600 hover:text-gray-200"
                }`}
              >
                All Applications
              </button>
              {jobs.map((job) => (
                <button
                  key={job._id}
                  onClick={() => handleViewApplicants(job._id)}
                  className={`px-5 py-2 rounded-lg text-sm font-bold transition-all border ${
                    selectedJobId === job._id
                      ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50"
                      : "bg-dark-800/50 text-gray-400 border-dark-600 hover:text-gray-200"
                  }`}
                >
                  {job.title}
                </button>
              ))}
            </div>

            {loadingApps ? (
              <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
                <Loader className="w-10 h-10 animate-spin text-neon-cyan mx-auto mb-3" />
                <p className="text-gray-400">Loading applications...</p>
              </div>
            ) : applications.length === 0 ? (
              <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
                <p className="text-gray-400 text-xl">No applications yet</p>
                <p className="text-gray-500 mt-2">Applications will appear here when job seekers apply to your postings.</p>
              </div>
            ) : (
              <>
                {/* AI Shortlist bar */}
                {selectedJobId && (
                  <div className="mb-6 p-4 card-glass rounded-xl border border-purple-500/30 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-400" />
                      <div>
                        <p className="text-sm font-bold text-gray-200">AI Shortlisting</p>
                        <p className="text-xs text-gray-400">
                          {showTopOnly 
                            ? `Showing ${applications.filter(a => a.aiScore != null && a.aiScore >= 80).length} top candidate${applications.filter(a => a.aiScore != null && a.aiScore >= 80).length !== 1 ? 's' : ''} (80%+ match)`
                            : `${applications.length} applicant${applications.length !== 1 ? 's' : ''} — Candidates with 80%+ match are auto-shortlisted`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {showTopOnly && (
                        <button
                          onClick={() => setShowTopOnly(false)}
                          className="px-4 py-2 bg-dark-800 border border-dark-600 text-gray-300 rounded-lg font-bold text-sm hover:bg-dark-700 transition flex items-center gap-2"
                        >
                          Show All
                        </button>
                      )}
                      <button
                        onClick={() => handleAIShortlist(selectedJobId)}
                        disabled={shortlisting === selectedJobId}
                        className="px-5 py-2 bg-gradient-to-r from-purple-500/20 to-neon-cyan/20 border border-purple-500/50 text-purple-300 rounded-lg font-bold text-sm hover:from-purple-500/30 hover:to-neon-cyan/30 transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {shortlisting === selectedJobId ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Run AI Shortlist
                      </button>
                    </div>
                  </div>
                )}

                {/* Sort by score, filter if showTopOnly */}
                <div className="space-y-4">
                  {[...applications]
                    .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
                    .filter(app => !showTopOnly || (app.aiScore != null && app.aiScore >= 80))
                    .map((app) => (
                    <div
                      key={app._id}
                      className={`card-glass rounded-2xl overflow-hidden transition-all ${
                        app.status === 'shortlisted' 
                          ? 'border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/10' 
                          : 'border border-dark-700/50'
                      }`}
                    >
                      {/* Main row */}
                      <div className="p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* AI Score Ring */}
                          {app.aiScore != null ? (
                            <div className={`w-14 h-14 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0 ${getScoreRingColor(app.aiScore)}`}>
                              <span className={`text-base font-extrabold leading-none ${getScoreColor(app.aiScore)}`}>{app.aiScore}</span>
                              <span className="text-[8px] text-gray-500 uppercase font-bold">match</span>
                            </div>
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-extrabold text-sm flex-shrink-0">
                              {(app.applicantName || 'U').split(' ').map(s => s[0]).slice(0, 2).join('').toUpperCase()}
                            </div>
                          )}
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold text-gray-100 truncate">
                                {app.applicantName || 'Unknown Applicant'}
                              </h3>
                              {app.aiScore >= 80 && (
                                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/15 text-green-400 rounded-full text-[10px] font-bold border border-green-500/30">
                                  <Star className="w-3 h-3" /> Top Match
                                </span>
                              )}
                              {app.aiRecommendation && (
                                <span className="text-[10px] px-2 py-0.5 bg-purple-500/15 text-purple-400 rounded-full font-semibold border border-purple-500/20">
                                  {app.aiRecommendation}
                                </span>
                              )}
                            </div>
                            <p className="text-neon-cyan font-semibold text-sm">{app.jobTitle || 'Unknown Job'}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                              {app.applicantEmail && (
                                <span className="flex items-center gap-1">
                                  <Mail className="w-3 h-3" /> {app.applicantEmail}
                                </span>
                              )}
                              <span>Applied: {new Date(app.appliedDate || app.createdAt).toLocaleDateString()}</span>
                              {app.matchedSkills?.length > 0 && (
                                <span className="text-green-400">{app.matchedSkills.length} skills matched</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                          <button
                            onClick={() => setExpandedApp(expandedApp === app._id ? null : app._id)}
                            className="p-2 bg-dark-800/50 hover:bg-dark-700 border border-dark-600 rounded-lg transition text-gray-400 hover:text-gray-200"
                          >
                            {expandedApp === app._id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {expandedApp === app._id && (
                        <div className="px-5 pb-5 border-t border-dark-700/50 pt-4">
                          {/* AI Score Breakdown */}
                          {app.aiScore != null && (
                            <div className="mb-5 p-4 rounded-xl bg-dark-800/30 border border-dark-700/50">
                              <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-purple-400" />
                                <h4 className="text-sm font-bold text-gray-300">AI Match Analysis</h4>
                              </div>
                              <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="text-center p-2 rounded-lg bg-dark-900/50">
                                  <p className="text-lg font-extrabold text-neon-cyan">{app.matchBreakdown?.skills ?? '—'}%</p>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Skills</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-dark-900/50">
                                  <p className="text-lg font-extrabold text-neon-blue">{app.matchBreakdown?.experience ?? '—'}%</p>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Experience</p>
                                </div>
                                <div className="text-center p-2 rounded-lg bg-dark-900/50">
                                  <p className="text-lg font-extrabold text-neon-purple">{app.matchBreakdown?.location ?? '—'}%</p>
                                  <p className="text-[10px] text-gray-500 uppercase font-bold">Location</p>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-3">
                                {app.matchedSkills?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Matched Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                      {app.matchedSkills.map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-semibold rounded border border-green-500/20">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {app.missingSkills?.length > 0 && (
                                  <div>
                                    <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">Missing Skills</p>
                                    <div className="flex flex-wrap gap-1">
                                      {app.missingSkills.map((skill, i) => (
                                        <span key={i} className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-semibold rounded border border-red-500/20">{skill}</span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                              {app.aiReasoning && (
                                <p className="text-xs text-gray-400 mt-3 italic">{app.aiReasoning}</p>
                              )}
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-6">
                            {/* Left: Applicant details */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Applicant Details</h4>
                              
                              <div className="space-y-2 text-sm">
                                {app.applicantEmail && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Mail className="w-4 h-4 text-neon-cyan" />
                                    <a href={`mailto:${app.applicantEmail}`} className="hover:text-neon-cyan transition">{app.applicantEmail}</a>
                                  </div>
                                )}
                                {app.applicantPhone && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Phone className="w-4 h-4 text-neon-cyan" />
                                    <span>{app.applicantPhone}</span>
                                  </div>
                                )}
                                {app.linkedin && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <ExternalLink className="w-4 h-4 text-neon-cyan" />
                                    <a href={app.linkedin} target="_blank" rel="noopener noreferrer" className="hover:text-neon-cyan transition">LinkedIn Profile</a>
                                  </div>
                                )}
                                {app.portfolio && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <ExternalLink className="w-4 h-4 text-neon-cyan" />
                                    <a href={app.portfolio} target="_blank" rel="noopener noreferrer" className="hover:text-neon-cyan transition">Portfolio</a>
                                  </div>
                                )}
                              </div>

                              {app.coverLetter && (
                                <div className="mt-3">
                                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Cover Letter</h5>
                                  <p className="text-sm text-gray-300 bg-dark-800/50 rounded-lg p-3 border border-dark-700/50">{app.coverLetter}</p>
                                </div>
                              )}

                              {app.resumeUrl && (
                                <a
                                  href={app.resumeUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/20 transition text-sm font-semibold mt-2"
                                >
                                  <FileText className="w-4 h-4" />
                                  View Resume
                                </a>
                              )}
                            </div>

                            {/* Right: Actions */}
                            <div className="space-y-3">
                              <h4 className="text-sm font-bold text-gray-300 uppercase tracking-wider">Actions</h4>
                              
                              <div className="space-y-2">
                                {app.status !== 'accepted' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app._id, 'accepted')}
                                    disabled={updatingStatus === app._id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-xl hover:bg-green-500/30 transition font-bold text-sm disabled:opacity-50"
                                  >
                                    {updatingStatus === app._id ? <Loader className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                    Approve Application
                                  </button>
                                )}
                                {app.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app._id, 'rejected')}
                                    disabled={updatingStatus === app._id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl hover:bg-red-500/30 transition font-bold text-sm disabled:opacity-50"
                                  >
                                    {updatingStatus === app._id ? <Loader className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                                    Reject Application
                                  </button>
                                )}
                                {app.status !== 'shortlisted' && app.status !== 'accepted' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app._id, 'shortlisted')}
                                    disabled={updatingStatus === app._id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan rounded-xl hover:bg-neon-cyan/30 transition font-bold text-sm disabled:opacity-50"
                                  >
                                    {updatingStatus === app._id ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Shortlist
                                  </button>
                                )}
                                {app.status !== 'reviewing' && app.status !== 'accepted' && app.status !== 'rejected' && (
                                  <button
                                    onClick={() => handleUpdateStatus(app._id, 'reviewing')}
                                    disabled={updatingStatus === app._id}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 border border-blue-500/50 text-blue-400 rounded-xl hover:bg-blue-500/30 transition font-bold text-sm disabled:opacity-50"
                                  >
                                    {updatingStatus === app._id ? <Loader className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                                    Mark as Reviewing
                                  </button>
                                )}
                              </div>

                              {app.recruiterFeedback && (
                                <div className="mt-3">
                                  <h5 className="text-xs font-bold text-gray-400 uppercase mb-1">Recruiter Feedback</h5>
                                  <p className="text-sm text-gray-300 bg-dark-800/50 rounded-lg p-3 border border-dark-700/50">{app.recruiterFeedback}</p>
                                </div>
                              )}

                              {(app.aiStrengths?.length > 0 || app.aiGaps?.length > 0) && (
                                <div className="mt-3 space-y-2">
                                  {app.aiStrengths?.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-green-400 uppercase mb-1">AI Strengths</h5>
                                      <ul className="text-xs text-gray-300 space-y-1">
                                        {app.aiStrengths.map((s, i) => (
                                          <li key={i} className="flex items-start gap-1.5"><span className="text-green-400 mt-0.5">+</span> {s}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {app.aiGaps?.length > 0 && (
                                    <div>
                                      <h5 className="text-xs font-bold text-red-400 uppercase mb-1">AI Gaps</h5>
                                      <ul className="text-xs text-gray-300 space-y-1">
                                        {app.aiGaps.map((g, i) => (
                                          <li key={i} className="flex items-start gap-1.5"><span className="text-red-400 mt-0.5">-</span> {g}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
