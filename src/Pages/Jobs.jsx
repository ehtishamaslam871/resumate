import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { Search, MapPin, Briefcase, DollarSign, Clock, AlertCircle, Loader, CheckCircle, Filter, ChevronRight } from "lucide-react";

export default function Jobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");
  const [selectedSalary, setSelectedSalary] = useState("");
  const [applyingId, setApplyingId] = useState(null);
  const [appliedJobs, setAppliedJobs] = useState(new Set());
  const [successMessage, setSuccessMessage] = useState(null);

  // Fetch jobs on component mount
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const user = api.getCurrentUser();
        if (!user) {
          setError("Please log in to view job opportunities");
          setLoading(false);
          return;
        }

        const response = await api.job.list();
        setJobs(response.jobs || response || []);
        
        // Load applied jobs from API
        try {
          const applicationsResponse = await api.application.getUserApplications();
          const appliedJobIds = applicationsResponse.applications?.map(app => app.jobId) || [];
          setAppliedJobs(new Set(appliedJobIds));
        } catch (err) {
          console.log("Could not load applications:", err.message);
        }
      } catch (err) {
        setError(err.message || "Failed to load jobs");
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  // Filter jobs based on search and filters
  useEffect(() => {
    let filtered = jobs;

    if (searchTerm) {
      filtered = filtered.filter((job) =>
        job.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedLocation) {
      filtered = filtered.filter((job) =>
        job.location?.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    if (selectedJobType) {
      filtered = filtered.filter((job) =>
        job.jobType?.toLowerCase() === selectedJobType.toLowerCase()
      );
    }

    if (selectedSalary) {
      filtered = filtered.filter((job) => {
        const salary = job.salary || 0;
        switch (selectedSalary) {
          case "0-50k":
            return salary <= 50000;
          case "50k-100k":
            return salary >= 50000 && salary <= 100000;
          case "100k-150k":
            return salary >= 100000 && salary <= 150000;
          case "150k+":
            return salary >= 150000;
          default:
            return true;
        }
      });
    }

    setFilteredJobs(filtered);
  }, [jobs, searchTerm, selectedLocation, selectedJobType, selectedSalary]);

  const handleApply = async (jobId) => {
    try {
      setApplyingId(jobId);
      
      // Get user's resumes first
      const resumesResponse = await api.resume.getUserResumes();
      const resumes = resumesResponse.resumes || resumesResponse || [];
      
      if (!resumes || resumes.length === 0) {
        setError("Please upload a resume before applying for jobs");
        setApplyingId(null);
        return;
      }

      // Use first resume for application
      const resumeId = resumes[0]._id || resumes[0].id;
      
      const response = await api.application.createApplication(jobId, resumeId);

      setAppliedJobs((prev) => new Set([...prev, jobId]));
      setSuccessMessage("Application submitted successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err.message || "Failed to apply for job");
    } finally {
      setApplyingId(null);
    }
  };

  const getUniqueLocations = () => {
    const locations = new Set(jobs.map((job) => job.location).filter(Boolean));
    return Array.from(locations).sort();
  };

  const getUniqueJobTypes = () => {
    const types = new Set(jobs.map((job) => job.jobType).filter(Boolean));
    return Array.from(types).sort();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-gray-100">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading job opportunities...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-7xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4 text-gray-100">Job Opportunities</h1>
          <p className="text-gray-400 text-lg">Find the perfect role matching your skills and experience</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3 card-glass">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3 card-glass">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="card-glass p-6 rounded-2xl sticky top-20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center">
                  <Filter className="w-4 h-4 text-neon-cyan" />
                </div>
                <h3 className="text-lg font-bold text-gray-100">Filters</h3>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Job title or company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input-modern pl-10"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="input-modern"
                >
                  <option value="">All Locations</option>
                  {getUniqueLocations().map((location) => (
                    <option key={location} value={location}>
                      {location}
                    </option>
                  ))}
                </select>
              </div>

              {/* Job Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Job Type</label>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="input-modern"
                >
                  <option value="">All Types</option>
                  {getUniqueJobTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Salary Filter */}
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2 text-gray-300">Salary Range</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="input-modern"
                >
                  <option value="">All Salaries</option>
                  <option value="0-50k">$0 - $50k</option>
                  <option value="50k-100k">$50k - $100k</option>
                  <option value="100k-150k">$100k - $150k</option>
                  <option value="150k+">$150k+</option>
                </select>
              </div>

              {/* Clear Filters */}
              <button
                onClick={() => {
                  setSearchTerm("");
                  setSelectedLocation("");
                  setSelectedJobType("");
                  setSelectedSalary("");
                }}
                className="btn-secondary w-full text-sm"
              >
                Clear Filters
              </button>

              {/* Results Count */}
              <div className="mt-6 pt-6 border-t border-dark-700">
                <p className="text-sm text-gray-400">
                  Showing <span className="font-bold text-neon-cyan">{filteredJobs.length}</span> of <span className="font-bold">{jobs.length}</span> jobs
                </p>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {filteredJobs.length === 0 ? (
              <div className="card-glass p-12 rounded-2xl text-center">
                <Briefcase className="w-16 h-16 text-dark-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No jobs found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedLocation("");
                    setSelectedJobType("");
                    setSelectedSalary("");
                  }}
                  className="mt-4 btn-primary"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    className="card-glass-hover p-6 rounded-xl border border-dark-700 hover:border-neon-cyan/30"
                  >
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-xl font-bold text-gray-100">{job.title}</h3>
                          {appliedJobs.has(job._id) && (
                            <span className="badge-primary text-xs">
                              ✓ Applied
                            </span>
                          )}
                        </div>
                        <p className="text-neon-cyan font-semibold mb-4">{job.company}</p>

                        <p className="text-gray-400 mb-4 line-clamp-2">{job.description}</p>

                        {/* Job Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {job.location && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="w-4 h-4 flex-shrink-0 text-neon-cyan" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.jobType && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Briefcase className="w-4 h-4 flex-shrink-0 text-neon-blue" />
                              <span>{job.jobType}</span>
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <DollarSign className="w-4 h-4 flex-shrink-0 text-neon-purple" />
                              <span>${job.salary.toLocaleString()}</span>
                            </div>
                          )}
                          {job.postedDate && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Clock className="w-4 h-4 flex-shrink-0 text-neon-pink" />
                              <span>{new Date(job.postedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                        </div>

                        {/* Required Skills */}
                        {job.requiredSkills && job.requiredSkills.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm text-gray-400 mb-2">Required Skills:</p>
                            <div className="flex flex-wrap gap-2">
                              {job.requiredSkills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="px-3 py-1 bg-neon-cyan/15 text-neon-cyan text-xs rounded-full border border-neon-cyan/30"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex-shrink-0 flex flex-col gap-2">
                        <button
                          onClick={() => navigate(`/job/${encodeURIComponent(job.title)}`, { state: { job } })}
                          className="btn-ghost text-sm flex items-center gap-1 justify-center"
                        >
                          View Details <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={appliedJobs.has(job._id) || applyingId === job._id}
                          className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                            appliedJobs.has(job._id)
                              ? "bg-green-500/20 text-green-400 border border-green-500/50 cursor-default"
                              : applyingId === job._id
                              ? "bg-dark-700 text-gray-400 cursor-not-allowed flex items-center gap-2"
                              : "btn-primary"
                          }`}
                        >
                          {applyingId === job._id ? (
                            <>
                              <Loader className="w-4 h-4 animate-spin" />
                              Applying...
                            </>
                          ) : appliedJobs.has(job._id) ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Applied
                            </>
                          ) : (
                            "Apply Now"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
