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
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading jobs...</p>
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

      <main className="max-w-6xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent mb-2">
              My Job Postings
            </h1>
            <p className="text-gray-400">Manage your active and closed job listings</p>
          </div>
          <button
            onClick={() => navigate('/recruiter/jobs/new')}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition transform hover:scale-105 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Post New Job
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 bg-gray-800/40 backdrop-blur border border-gray-700/50 p-2 rounded-lg w-fit">
          {['all', 'active', 'closed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                filter === tab
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 shadow-lg shadow-cyan-500/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)} ({filteredJobs.length})
            </button>
          ))}
        </div>

        {/* Jobs Grid */}
        {filteredJobs.length === 0 ? (
          <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-16 rounded-2xl text-center shadow-lg shadow-cyan-500/10">
            <div className="text-6xl mb-4 opacity-50">📋</div>
            <h3 className="text-2xl font-bold mb-2">No Jobs Found</h3>
            <p className="text-gray-400 mb-6">Post your first job to start recruiting</p>
            <button
              onClick={() => navigate('/recruiter/jobs/new')}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
            >
              Post a Job
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredJobs.map((job) => (
              <div
                key={job._id}
                className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-6 rounded-2xl hover:border-cyan-500/50 transition group shadow-lg shadow-cyan-500/5"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white group-hover:text-cyan-400 transition mb-2">
                      {job.title}
                    </h3>
                    <p className="text-cyan-400 font-semibold mb-2">{job.company}</p>
                    <p className="text-gray-400 text-sm line-clamp-2">{job.description?.substring(0, 100)}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    job.status === 'open'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                      : 'bg-gray-700/50 text-gray-400 border border-gray-600/50'
                  }`}>
                    {job.status === 'open' ? '🟢 Active' : '⚫ Closed'}
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6 bg-gray-900/50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Location</p>
                    <p className="text-cyan-400 font-semibold">{job.location || 'Remote'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Type</p>
                    <p className="text-cyan-400 font-semibold">{job.jobType || 'Full-time'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Applications</p>
                    <p className="text-cyan-400 font-semibold">12</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Posted</p>
                    <p className="text-cyan-400 font-semibold">3 days ago</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate(`/job/${job._id}`)}
                    className="flex-1 px-4 py-2 bg-cyan-500/10 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/recruiter/jobs/${job._id}/edit`)}
                    className="flex-1 px-4 py-2 bg-teal-500/10 border border-teal-500/50 text-teal-400 rounded-lg hover:bg-teal-500/20 transition flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this job?')) {
                        setDeleting(job._id);
                        setTimeout(() => setDeleting(null), 1000);
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/20 transition flex items-center justify-center gap-2"
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
