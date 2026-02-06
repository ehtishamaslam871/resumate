import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationAPI } from '../services/api';
import { Loader, AlertCircle, ArrowRight, Zap } from 'lucide-react';

export default function JobRecommendations() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [applying, setApplying] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchRecommendedJobs();
  }, []);

  const fetchRecommendedJobs = async () => {
    try {
      setLoading(true);
      const response = await applicationAPI.getRecommendedJobs();
      if (response.success) {
        setJobs(response.jobs || []);
        setError('');
      } else {
        setError(response.message || 'Failed to load recommendations');
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      setError('Error loading job recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (jobId) => {
    try {
      setApplying(prev => ({ ...prev, [jobId]: true }));
      const response = await applicationAPI.createApplication(jobId);
      if (response.success) {
        alert('Application submitted successfully!');
        fetchRecommendedJobs();
      } else {
        alert(response.message || 'Failed to apply');
      }
    } catch (err) {
      console.error('Error applying:', err);
      alert('Error submitting application');
    } finally {
      setApplying(prev => ({ ...prev, [jobId]: false }));
    }
  };

  const getMatchBadge = (score) => {
    if (score >= 80) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400', label: 'Excellent Match' };
    if (score >= 60) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400', label: 'Good Match' };
    return { bg: 'bg-blue-500/20', border: 'border-blue-500/30', text: 'text-blue-400', label: 'Possible Match' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Analyzing recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Personalized Recommendations
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Based on your resume and skills, we found <span className="text-cyan-400 font-bold">{jobs.length}</span> perfectly matched positions
          </p>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-400">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-16 rounded-2xl text-center shadow-lg shadow-cyan-500/10">
            <div className="text-6xl mb-6 opacity-50">🔍</div>
            <h3 className="text-2xl font-bold mb-4">No Recommendations Yet</h3>
            <p className="text-gray-400 mb-8 text-lg">Upload your resume to get personalized job recommendations based on your skills and experience.</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition transform hover:scale-105"
            >
              Upload Your Resume
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => {
              const matchBadge = getMatchBadge(job.matchScore || 0);
              return (
                <div
                  key={job._id}
                  className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-6 rounded-2xl hover:border-cyan-500/50 transition group shadow-lg shadow-cyan-500/5"
                >
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition mb-2">{job.title}</h3>
                      <p className="text-cyan-400 font-semibold text-lg mb-3">{job.company}</p>
                      <p className="text-gray-300 line-clamp-2 mb-4">{job.description?.substring(0, 150)}...</p>
                    </div>
                    <div className={`${matchBadge.bg} ${matchBadge.border} border px-6 py-4 rounded-xl flex flex-col items-center justify-center min-w-fit shadow-lg ${matchBadge.text.replace('text-', 'shadow-')}/20`}>
                      <div className={`text-4xl font-bold ${matchBadge.text}`}>{Math.round(job.matchScore)}%</div>
                      <div className={`text-xs font-semibold mt-2 ${matchBadge.text}`}>{matchBadge.label}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-gray-900/50 p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Skills Match</p>
                      <p className="text-cyan-400 font-semibold">{Math.round(job.breakdown?.skills || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Experience</p>
                      <p className="text-cyan-400 font-semibold">{Math.round(job.breakdown?.experience || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location Match</p>
                      <p className="text-cyan-400 font-semibold">{Math.round(job.breakdown?.location || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Salary Range</p>
                      <p className="text-cyan-400 font-semibold">${(job.salary / 1000).toFixed(0)}k</p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applying[job._id]}
                      className={`flex-1 min-w-fit px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 flex items-center justify-center gap-2 ${
                        applying[job._id]
                          ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 hover:shadow-lg hover:shadow-cyan-500/50'
                      }`}
                    >
                      {applying[job._id] ? (
                        <>
                          <Loader className="w-4 h-4 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4" />
                          Apply Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/job/${job.title}`)}
                      className="flex-1 min-w-fit px-6 py-3 border border-cyan-500/50 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-500/10 transition"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
