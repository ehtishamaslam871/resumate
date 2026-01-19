import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { Plus, Edit, Trash2, Eye, Loader, AlertCircle, CheckCircle, X, Save } from "lucide-react";

export default function RecruiterDashboard() {
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState("jobs");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    company: "",
    description: "",
    location: "",
    jobType: "Full-time",
    salary: "",
    requiredSkills: "",
  });

  // Fetch recruiter's jobs and applications
  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem("resumate_user") || "null");
        if (!user || user.role !== "recruiter") {
          navigate("/auth");
          return;
        }

        // Fetch recruiter's jobs
        const jobsResponse = await api.jobs.list({ recruiterId: user.id });
        setJobs(jobsResponse.jobs || []);

        // Fetch applications for this recruiter's jobs
        const applicationsResponse = await api.jobs.getApplications?.();
        setApplications(applicationsResponse?.applications || []);
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
      const jobPayload = {
        ...formData,
        salary: parseInt(formData.salary) || 0,
        requiredSkills: formData.requiredSkills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (editingId) {
        // Update existing job
        await api.jobs.updateJob(editingId, jobPayload);
        setJobs((prev) =>
          prev.map((job) =>
            job._id === editingId ? { ...job, ...jobPayload } : job
          )
        );
        setSuccess("Job updated successfully!");
        setEditingId(null);
      } else {
        // Create new job
        const response = await api.jobs.createJob(jobPayload);
        setJobs((prev) => [...prev, response.job]);
        setSuccess("Job posted successfully!");
      }

      setFormData({
        title: "",
        company: "",
        description: "",
        location: "",
        jobType: "Full-time",
        salary: "",
        requiredSkills: "",
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
      await api.jobs.deleteJob(jobId);
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
      jobType: job.jobType,
      salary: job.salary,
      requiredSkills: job.requiredSkills?.join(", ") || "",
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
      jobType: "Full-time",
      salary: "",
      requiredSkills: "",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading recruiter dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-bold mb-2">Recruiter Dashboard</h1>
            <p className="text-gray-400">Post jobs, manage applications, and find top talent</p>
          </div>
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
            >
              <Plus className="w-5 h-5" />
              Post New Job
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{success}</p>
          </div>
        )}

        {/* Create Job Form */}
        {showCreateForm && (
          <div className="bg-gray-800 p-8 rounded-2xl mb-12 border border-gray-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                {editingId ? "Edit Job Posting" : "Create New Job Posting"}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="p-2 hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Job Title */}
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleFormChange}
                    placeholder="e.g., Senior React Developer"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-sm font-medium mb-2">Company *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleFormChange}
                    placeholder="Company name"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium mb-2">Location *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleFormChange}
                    placeholder="e.g., San Francisco, CA"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="block text-sm font-medium mb-2">Job Type *</label>
                  <select
                    name="jobType"
                    value={formData.jobType}
                    onChange={handleFormChange}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </div>

                {/* Salary */}
                <div>
                  <label className="block text-sm font-medium mb-2">Salary (Annual) *</label>
                  <input
                    type="number"
                    name="salary"
                    value={formData.salary}
                    onChange={handleFormChange}
                    placeholder="e.g., 120000"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>

                {/* Required Skills */}
                <div>
                  <label className="block text-sm font-medium mb-2">Required Skills *</label>
                  <input
                    type="text"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleFormChange}
                    placeholder="e.g., React, JavaScript, Node.js"
                    required
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium mb-2">Job Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Detailed job description..."
                  required
                  rows={6}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400 resize-none"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    submitting
                      ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                      : "bg-cyan-500 text-gray-900 hover:bg-cyan-600"
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
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <div className="flex gap-6">
            {[
              { id: "jobs", label: `Posted Jobs (${jobs.length})` },
              { id: "applications", label: `Applications (${applications.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? "text-cyan-400 border-cyan-400"
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
              <div className="bg-gray-800 p-12 rounded-2xl text-center">
                <p className="text-gray-400 text-lg mb-6">No jobs posted yet</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
                >
                  Post Your First Job
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{job.title}</h3>
                        <p className="text-gray-400 mb-4">{job.description.substring(0, 150)}...</p>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>📍 {job.location}</span>
                          <span>💼 {job.jobType}</span>
                          <span>💰 ${job.salary?.toLocaleString()}</span>
                          <span>📅 {new Date(job.postedDate || Date.now()).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEditJob(job)}
                          className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteJob(job._id)}
                          disabled={deleting === job._id}
                          className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
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
            {applications.length === 0 ? (
              <div className="bg-gray-800 p-12 rounded-2xl text-center">
                <p className="text-gray-400 text-lg">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app._id}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {app.applicantName}
                        </h3>
                        <p className="text-gray-400 mb-2">{app.jobTitle}</p>
                        <p className="text-sm text-gray-500">
                          Applied: {new Date(app.appliedDate).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            app.status === "accepted"
                              ? "bg-green-500/20 text-green-400"
                              : app.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}
                        >
                          {app.status}
                        </span>
                        <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-500/30 transition">
                          View Resume
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
