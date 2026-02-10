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
      <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
        <Navbar />
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5 rounded-full blur-3xl"></div>
        </div>
        <div className="flex items-center justify-center min-h-[80vh] relative z-10">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Analyzing recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
      <Navbar />

      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-16 relative z-10">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-neon-cyan" />
            <h1 className="text-5xl font-bold text-gray-100">
              Personalized Recommendations
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Based on your resume and skills, we found <span className="text-neon-cyan font-bold">{jobs.length}</span> perfectly matched positions
          </p>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-400 text-base">Error</p>
              <p className="text-red-300 text-sm mt-1">{error}</p>
            </div>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
            <div className="text-6xl mb-6 opacity-50">🔍</div>
            <h3 className="text-2xl font-bold text-gray-100 mb-4">No Recommendations Yet</h3>
            <p className="text-gray-400 mb-8 text-lg">Upload your resume to get personalized job recommendations based on your skills and experience.</p>
            <button
              onClick={() => navigate('/upload')}
              className="btn-primary px-8 py-4 font-bold text-lg"
            >
              Upload Your Resume
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {jobs.map((job) => {
              const matchScore = job.matchScore || 0;
              const matchBadge = matchScore >= 80 
                ? { bg: 'bg-neon-green/20', border: 'border-neon-green/50', text: 'text-neon-green', label: 'Excellent Match' }
                : matchScore >= 60 
                ? { bg: 'bg-yellow-500/20', border: 'border-yellow-500/50', text: 'text-yellow-400', label: 'Good Match' }
                : { bg: 'bg-neon-blue/20', border: 'border-neon-blue/50', text: 'text-neon-blue', label: 'Possible Match' };
              
              return (
                <div
                  key={job._id}
                  className="card-glass card-glass-hover p-8 rounded-2xl border border-neon-cyan/20"
                >
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-100 mb-2">{job.title}</h3>
                      <p className="text-neon-cyan font-semibold text-lg mb-3">{job.company}</p>
                      <p className="text-gray-300 line-clamp-2">{job.description?.substring(0, 150)}...</p>
                    </div>
                    <div className={`${matchBadge.bg} ${matchBadge.border} border px-8 py-6 rounded-2xl flex flex-col items-center justify-center min-w-fit`}>
                      <div className={`text-5xl font-bold ${matchBadge.text}`}>{Math.round(matchScore)}%</div>
                      <div className={`text-xs font-bold mt-3 ${matchBadge.text} uppercase tracking-wider`}>{matchBadge.label}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Skills Match</p>
                      <p className="text-neon-cyan font-semibold text-base">{Math.round(job.breakdown?.skills || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Experience</p>
                      <p className="text-neon-cyan font-semibold text-base">{Math.round(job.breakdown?.experience || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Location Match</p>
                      <p className="text-neon-cyan font-semibold text-base">{Math.round(job.breakdown?.location || 0)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Salary Range</p>
                      <p className="text-neon-cyan font-semibold text-base">${(job.salary / 1000).toFixed(0)}k</p>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => handleApply(job._id)}
                      disabled={applying[job._id]}
                      className={`flex-1 min-w-fit px-8 py-3 rounded-lg font-bold text-base transition flex items-center justify-center gap-2 ${
                        applying[job._id]
                          ? 'bg-dark-800/50 text-gray-400 cursor-not-allowed'
                          : 'btn-primary shadow-lg shadow-neon-cyan/50'
                      }`}
                    >
                      {applying[job._id] ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Applying...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-5 h-5" />
                          Apply Now
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/job/${job.title}`)}
                      className="flex-1 min-w-fit px-8 py-3 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan rounded-lg font-bold hover:bg-neon-cyan/20 transition"
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
