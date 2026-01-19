import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { Search, MapPin, Briefcase, DollarSign, Clock, AlertCircle, Loader, CheckCircle } from "lucide-react";

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

        const response = await api.jobs.list();
        setJobs(response.jobs || response || []);
        
        // Load applied jobs from API
        try {
          const applicationsResponse = await api.applications.getUserApplications();
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
      
      const response = await api.applications.createApplication(jobId, resumeId);

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
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading job opportunities...</p>
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
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Job Opportunities</h1>
          <p className="text-gray-400 text-lg">Find the perfect role matching your skills</p>
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
        {successMessage && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <p className="text-green-300">{successMessage}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-2xl sticky top-20">
              <h3 className="text-xl font-bold mb-6">Filters</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Job title or company"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Location Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Location</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
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
                <label className="block text-sm font-medium mb-2">Job Type</label>
                <select
                  value={selectedJobType}
                  onChange={(e) => setSelectedJobType(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
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
                <label className="block text-sm font-medium mb-2">Salary Range</label>
                <select
                  value={selectedSalary}
                  onChange={(e) => setSelectedSalary(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400"
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
                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition text-sm"
              >
                Clear Filters
              </button>

              {/* Results Count */}
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-sm text-gray-400">
                  Showing <span className="font-bold text-cyan-400">{filteredJobs.length}</span> of <span className="font-bold">{jobs.length}</span> jobs
                </p>
              </div>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            {filteredJobs.length === 0 ? (
              <div className="bg-gray-800 p-12 rounded-2xl text-center">
                <Briefcase className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No jobs found matching your criteria</p>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedLocation("");
                    setSelectedJobType("");
                    setSelectedSalary("");
                  }}
                  className="mt-4 px-6 py-2 bg-cyan-500 text-gray-900 rounded-lg font-medium hover:bg-cyan-600 transition"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <div
                    key={job._id}
                    className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:border-cyan-500/50 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">{job.title}</h3>
                          {appliedJobs.has(job._id) && (
                            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
                              Applied
                            </span>
                          )}
                        </div>
                        <p className="text-cyan-400 font-semibold mb-4">{job.company}</p>

                        <p className="text-gray-300 mb-4">{job.description}</p>

                        {/* Job Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          {job.location && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <MapPin className="w-4 h-4" />
                              <span>{job.location}</span>
                            </div>
                          )}
                          {job.jobType && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Briefcase className="w-4 h-4" />
                              <span>{job.jobType}</span>
                            </div>
                          )}
                          {job.salary && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <DollarSign className="w-4 h-4" />
                              <span>${job.salary.toLocaleString()}</span>
                            </div>
                          )}
                          {job.postedDate && (
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Clock className="w-4 h-4" />
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
                                  className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Apply Button */}
                      <div className="flex-shrink-0">
                        <button
                          onClick={() => handleApply(job._id)}
                          disabled={appliedJobs.has(job._id) || applyingId === job._id}
                          className={`px-6 py-3 rounded-lg font-semibold transition whitespace-nowrap ${
                            appliedJobs.has(job._id)
                              ? "bg-green-500/20 text-green-400 cursor-default"
                              : applyingId === job._id
                              ? "bg-gray-700 text-gray-400 cursor-not-allowed flex items-center gap-2"
                              : "bg-cyan-500 text-gray-900 hover:bg-cyan-600"
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
