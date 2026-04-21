import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle,
  Clock,
  Loader,
  Plus,
  Sparkles,
  X,
} from 'lucide-react';

const emptyForm = {
  role: '',
  techStack: '',
  experienceLevel: 'mid-level',
};

const prettyStatus = (status) => {
  if (!status) return 'Pending';
  return status.replace('_', ' ').replace(/\b\w/g, (m) => m.toUpperCase());
};

export default function Interview() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [creatingFromJob, setCreatingFromJob] = useState(false);
  const [error, setError] = useState('');
  const [interviews, setInterviews] = useState([]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(emptyForm);
  const [creatingMock, setCreatingMock] = useState(false);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.interview.getUserInterviews();
      setInterviews(response.interviews || []);
    } catch (err) {
      const message = /Failed to fetch/i.test(err.message || '')
        ? 'Backend is offline or unreachable. Please start the backend server and try again.'
        : (err.message || 'Failed to load interviews');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!jobId) {
      loadInterviews();
      return;
    }

    const startFromJob = async () => {
      try {
        setCreatingFromJob(true);
        setError('');
        const response = await api.interview.startInterview(jobId);
        if (response?.interview?._id) {
          navigate(`/interview-session/${response.interview._id}`, { replace: true });
          return;
        }
        throw new Error('Unable to start interview for this job');
      } catch (err) {
        setError(err.message || 'Unable to start interview for this job');
      } finally {
        setCreatingFromJob(false);
        setLoading(false);
      }
    };

    startFromJob();
  }, [jobId, navigate]);

  const stats = useMemo(() => {
    const pending = interviews.filter((item) => item.status === 'pending').length;
    const inProgress = interviews.filter((item) => item.status === 'in_progress').length;
    const completed = interviews.filter((item) => item.status === 'completed').length;
    const totalQuestions = interviews.reduce((sum, item) => sum + (item.questions?.length || 0), 0);
    const totalAnswered = interviews.reduce((sum, item) => sum + (item.answers?.length || 0), 0);
    const overallProgress = totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0;

    return { pending, inProgress, completed, totalQuestions, totalAnswered, overallProgress };
  }, [interviews]);

  const handleCreateInterview = async (e) => {
    e.preventDefault();
    if (!createForm.role.trim()) return;

    try {
      setCreatingMock(true);
      setError('');
      const response = await api.interview.createMockInterview({
        role: createForm.role.trim(),
        techStack: createForm.techStack,
        experienceLevel: createForm.experienceLevel,
        questionCount: 10,
      });

      const created = response?.interview;
      if (!created?._id) {
        throw new Error('Interview created but session ID is missing');
      }

      setShowCreateModal(false);
      setCreateForm(emptyForm);
      await loadInterviews();
      navigate(`/interview-session/${created._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create interview');
    } finally {
      setCreatingMock(false);
    }
  };

  const continueInterview = (interviewId) => {
    navigate(`/interview-session/${interviewId}`);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/5 blur-3xl" />
      <div className="fixed bottom-0 left-0 -z-10 h-[30rem] w-[30rem] rounded-full bg-gradient-to-tr from-neon-blue/10 to-neon-pink/10 blur-3xl" />

      <main className="mx-auto max-w-6xl px-6 pb-12 pt-24 sm:pt-28">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-neon-cyan">
              <Sparkles className="h-3.5 w-3.5" /> Interview Studio
            </p>
            <h1 className="text-4xl font-bold text-gray-100">Practice and Track Your Interviews</h1>
            <p className="mt-2 text-gray-400">Create mock sessions, continue pending rounds, and monitor your performance over time.</p>
          </div>

          {!jobId && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary inline-flex items-center gap-2 px-5 py-3 font-bold"
            >
              <Plus className="h-4 w-4" /> Create New Interview
            </button>
          )}
        </div>

        {(loading || creatingFromJob) && (
          <div className="card-glass rounded-2xl p-16 text-center">
            <Loader className="mx-auto mb-4 h-12 w-12 animate-spin text-neon-cyan" />
            <h2 className="text-xl font-bold text-gray-100">Preparing interview workspace...</h2>
            <p className="mt-1 text-gray-400">This may take a few seconds while questions are generated.</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-red-500/50 bg-red-500/15 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!loading && !jobId && (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              <div className="card-glass rounded-2xl border border-dark-700 p-5">
                <p className="text-sm text-gray-400">Pending</p>
                <p className="mt-2 text-3xl font-bold text-yellow-300">{stats.pending}</p>
              </div>
              <div className="card-glass rounded-2xl border border-dark-700 p-5">
                <p className="text-sm text-gray-400">In Progress</p>
                <p className="mt-2 text-3xl font-bold text-neon-cyan">{stats.inProgress}</p>
              </div>
              <div className="card-glass rounded-2xl border border-dark-700 p-5">
                <p className="text-sm text-gray-400">Completed</p>
                <p className="mt-2 text-3xl font-bold text-neon-green">{stats.completed}</p>
              </div>
            </div>

            <div className="mb-8 card-glass rounded-2xl border border-dark-700 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-300 font-semibold">Overall Interview Progress</p>
                <p className="text-sm font-bold text-neon-cyan">{stats.overallProgress}%</p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full border border-dark-700 bg-dark-800/70">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                  style={{ width: `${stats.overallProgress}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                {stats.totalAnswered} of {stats.totalQuestions} interview questions answered across all sessions.
              </p>
            </div>

            {interviews.length === 0 ? (
              <div className="card-glass rounded-2xl border border-dark-700 p-14 text-center">
                <CalendarClock className="mx-auto mb-4 h-14 w-14 text-gray-500" />
                <h3 className="text-2xl font-bold text-gray-100">No interviews yet</h3>
                <p className="mx-auto mt-2 max-w-lg text-gray-400">
                  Start your first mock interview and get AI-driven feedback to improve confidence before real recruiter rounds.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary mt-6 inline-flex items-center gap-2 px-6 py-3 font-bold"
                >
                  <Plus className="h-4 w-4" /> Create Interview
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {interviews.map((item) => {
                  const title = item.jobTitle || item.job?.title || 'Interview Session';
                  const company = item.companyName || item.job?.company || (item.sessionType === 'mock' ? 'Mock Interview' : 'ResuMate');
                  const total = item.questions?.length || 0;
                  const done = item.answers?.length || 0;
                  const completion = total > 0 ? Math.round((done / total) * 100) : 0;

                  return (
                    <div key={item._id} className="card-glass rounded-2xl border border-dark-700 p-5">
                      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-100">{title}</h3>
                          <p className="text-sm text-neon-cyan">{company}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === 'completed'
                            ? 'border border-neon-green/50 bg-neon-green/10 text-neon-green'
                            : item.status === 'in_progress'
                            ? 'border border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                            : 'border border-yellow-400/50 bg-yellow-400/10 text-yellow-300'
                        }`}>
                          {prettyStatus(item.status)}
                        </span>
                      </div>

                      <div className="mb-4 grid gap-3 text-sm text-gray-400 sm:grid-cols-3">
                        <p className="inline-flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" /> {item.durationMinutes || 15} min
                        </p>
                        <p>{done}/{total} questions answered ({completion}%)</p>
                        <p>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Recently created'}</p>
                      </div>

                      <div className="h-2 w-full overflow-hidden rounded-full border border-dark-700 bg-dark-800/70">
                        <div
                          className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple"
                          style={{ width: `${completion}%` }}
                        />
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        <button
                          onClick={() => navigate(`/interview-report/${item._id}`)}
                          className={`px-5 py-2.5 text-sm font-bold rounded-lg transition ${
                            item.status === 'completed'
                              ? 'btn-secondary'
                              : 'bg-dark-800/50 text-gray-500 border border-dark-700 cursor-not-allowed'
                          }`}
                          disabled={item.status !== 'completed'}
                          title={item.status !== 'completed' ? 'Complete interview to unlock report' : 'View detailed report'}
                        >
                          View Report
                        </button>
                        <button
                          onClick={() => continueInterview(item._id)}
                          className="btn-primary px-5 py-2.5 text-sm font-bold"
                        >
                          {item.status === 'completed' ? 'Review Session' : item.status === 'in_progress' ? 'Continue Interview' : 'Begin Preparation'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !creatingMock && setShowCreateModal(false)} />
          <div className="relative z-10 w-full max-w-xl rounded-2xl border border-neon-cyan/30 bg-dark-900 p-7 shadow-2xl">
            <div className="mb-6 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">Create Interview</h2>
                <p className="mt-1 text-sm text-gray-400">Set your target role and stack to generate relevant questions.</p>
              </div>
              <button
                onClick={() => !creatingMock && setShowCreateModal(false)}
                className="rounded-lg border border-dark-700 p-2 text-gray-400 transition hover:border-neon-cyan/40 hover:text-neon-cyan"
                aria-label="Close create interview dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateInterview} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Target Role</label>
                <input
                  value={createForm.role}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                  className="input-modern"
                  placeholder="Example: Frontend Developer"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Tech Stack (comma separated)</label>
                <input
                  value={createForm.techStack}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, techStack: e.target.value }))}
                  className="input-modern"
                  placeholder="React, Node.js, MongoDB"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-300">Experience Level</label>
                <select
                  value={createForm.experienceLevel}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, experienceLevel: e.target.value }))}
                  className="input-modern"
                >
                  <option value="entry-level">Low (Entry Level)</option>
                  <option value="mid-level">Medium (Mid Level)</option>
                  <option value="high">High (Senior/Lead)</option>
                </select>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => !creatingMock && setShowCreateModal(false)}
                  className="btn-secondary px-4 py-2 font-semibold"
                  disabled={creatingMock}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary px-5 py-2 font-bold" disabled={creatingMock}>
                  {creatingMock ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader className="h-4 w-4 animate-spin" /> Creating...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" /> Generate Interview
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
