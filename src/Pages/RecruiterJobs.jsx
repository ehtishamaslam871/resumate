import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { jobAPI } from '../services/api';
import { Plus, Edit2, Trash2, Eye, Filter, Loader, AlertCircle } from 'lucide-react';

export default function RecruiterJobs() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchRecruiterJobs();
  }, []);

  const fetchRecruiterJobs = async () => {
    try {
      setLoading(true);
      const response = await jobAPI.getRecruiterJobs();
      if (response.success) {
        setJobs(response.jobs || []);
      } else {
        setError(response.message || 'Failed to load jobs');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Error loading jobs');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredJobs = () => {
    if (filter === 'active') return jobs.filter(j => j.status === 'open');
    if (filter === 'closed') return jobs.filter(j => j.status === 'closed');
    return jobs;
  };

  const filteredJobs = getFilteredJobs();

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
        <Navbar />
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5 rounded-full blur-3xl"></div>
        </div>
        <div className="flex items-center justify-center min-h-[70vh] relative z-10">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading jobs...</p>
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

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-5xl font-bold text-gray-100 mb-3">My Job Postings</h1>
            <p className="text-neon-cyan font-semibold text-lg">Manage your active and closed job listings</p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs/new')}
            className="btn-primary flex items-center gap-2 px-8 py-3 font-bold text-lg shadow-lg shadow-neon-cyan/50"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </button>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-base">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-3 mb-10 card-glass p-3 w-fit rounded-xl border border-neon-cyan/20">
          {['all', 'active', 'closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2.5 rounded-lg font-bold transition text-base ${
                filter === tab
                  ? 'bg-gradient-to-r from-neon-cyan to-neon-purple text-dark-950 shadow-lg shadow-neon-cyan/50'
                  : 'text-gray-400 hover:text-gray-100 hover:bg-dark-800/50'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredJobs.length})
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
            <div className="text-6xl mb-4 opacity-50">📋</div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">No Jobs Found</h3>
            <p className="text-gray-400 mb-8 text-base">Post your first job to start recruiting</p>
            <button
              onClick={() => navigate('/recruiter/jobs/new')}
              className="btn-primary px-8 py-3 font-bold"
            >
              Post a Job
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="card-glass card-glass-hover p-8 rounded-2xl border border-neon-cyan/20"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-100 mb-2">{job.title}</h3>
                    <p className="text-neon-cyan font-semibold mb-3 text-base">{job.company}</p>
                    <p className="text-gray-400 text-sm line-clamp-2">{job.description?.substring(0, 100)}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap ${
                    job.status === 'open'
                      ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                      : 'bg-dark-800/50 text-gray-400 border border-dark-600'
                  }`}>
                    {job.status === 'open' ? '🟢 Active' : '⚫ Closed'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Location</p>
                    <p className="text-neon-cyan font-semibold text-base">{job.location || 'Remote'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Type</p>
                    <p className="text-neon-cyan font-semibold text-base">{job.jobType || 'Full-time'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Applications</p>
                    <p className="text-neon-cyan font-semibold text-base">12</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-2">Posted</p>
                    <p className="text-neon-cyan font-semibold text-base">3 days ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="flex-1 px-4 py-3 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                    className="flex-1 px-4 py-3 bg-neon-blue/10 border border-neon-blue/50 text-neon-blue rounded-lg hover:bg-neon-blue/20 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm('Delete this job?')) {
                        setDeleting(job._id);
                        try {
                          await jobAPI.deleteJob(job._id);
                          setJobs(prev => prev.filter(j => j._id !== job._id));
                        } catch (err) {
                          console.error('Delete failed:', err);
                          setError('Failed to delete job');
                        } finally {
                          setDeleting(null);
                        }
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === job._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
