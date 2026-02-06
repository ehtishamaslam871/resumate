import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationAPI, jobAPI, interviewAPI } from '../services/api';
import { Loader, AlertCircle, CheckCircle, Calendar, Mail, Zap, TrendingUp } from 'lucide-react';

export default function RecruiterShortlist() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlisting, setShortlisting] = useState(false);
  const [error, setError] = useState('');
  const [showScheduling, setShowScheduling] = useState({});
  const [scheduleData, setScheduleData] = useState({});

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId]);

  const fetchJobAndCandidates = async () => {
    try {
      setLoading(true);
      const jobResponse = await jobAPI.getJobById(jobId);
      if (jobResponse.success) setJob(jobResponse.job);
      
      const appResponse = await applicationAPI.getJobApplications(jobId);
      if (appResponse.success) setCandidates(appResponse.applications || []);
    } catch (err) {
      setError('Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleAiShortlist = async () => {
    try {
      setShortlisting(true);
      const response = await applicationAPI.aiShortlistApplications(jobId, { topN: 5, minScore: 60 });
      if (response.success) {
        const updatedCandidates = candidates.map(candidate => {
          const aiResult = response.shortlistedCandidates?.find(c => c.applicationId === candidate._id);
          return {
            ...candidate,
            aiScore: aiResult?.score || candidate.score,
            aiReasoning: aiResult?.reasoning || '',
            strengths: aiResult?.strengths || [],
            gaps: aiResult?.gaps || [],
            isShortlisted: aiResult ? true : false
          };
        });
        setCandidates(updatedCandidates.sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0)));
      }
    } catch (err) {
      setError('Error running AI shortlisting');
    } finally {
      setShortlisting(false);
    }
  };

  const handleScheduleInterview = async (candidateId) => {
    const { date, link } = scheduleData[candidateId] || {};
    if (!date || !link) {
      alert('Please fill in date and interview link');
      return;
    }

    try {
      const response = await interviewAPI.scheduleInterview(candidateId, date, link);
      if (response.success) {
        alert('Interview scheduled!');
        setShowScheduling(prev => ({ ...prev, [candidateId]: false }));
        setScheduleData(prev => ({ ...prev, [candidateId]: {} }));
      }
    } catch (err) {
      alert('Error scheduling interview');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return { bg: 'bg-green-500/20', border: 'border-green-500/30', text: 'text-green-400' };
    if (score >= 60) return { bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', text: 'text-yellow-400' };
    return { bg: 'bg-red-500/20', border: 'border-red-500/30', text: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[70vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading candidates...</p>
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
              {job?.title} - Candidates
            </h1>
            <p className="text-gray-400">{candidates.length} applications received</p>
          </div>
          <button
            onClick={handleAiShortlist}
            disabled={shortlisting}
            className={`px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 flex items-center gap-2 ${
              shortlisting
                ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 hover:shadow-lg hover:shadow-cyan-500/50'
            }`}
          >
            {shortlisting ? <Loader className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {shortlisting ? 'AI Shortlisting...' : 'Run AI Shortlist'}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Candidates List */}
        {candidates.length === 0 ? (
          <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-16 rounded-2xl text-center shadow-lg shadow-cyan-500/10">
            <div className="text-6xl mb-4 opacity-50">👥</div>
            <h3 className="text-2xl font-bold mb-2">No Applications Yet</h3>
            <p className="text-gray-400">Wait for candidates to apply to this job</p>
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((candidate) => {
              const scoreColor = getScoreColor(candidate.aiScore || candidate.score || 0);
              return (
                <div
                  key={candidate._id}
                  className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-6 rounded-2xl hover:border-cyan-500/50 transition shadow-lg shadow-cyan-500/5"
                >
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">{candidate.candidateName || 'Anonymous'}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Mail className="w-4 h-4" />
                        {candidate.candidateEmail || 'No email'}
                      </div>
                    </div>
                    <div className={`${scoreColor.bg} ${scoreColor.border} border px-4 py-2 rounded-lg`}>
                      <div className={`text-2xl font-bold ${scoreColor.text}`}>{Math.round(candidate.aiScore || candidate.score || 0)}%</div>
                      <div className={`text-xs font-semibold ${scoreColor.text}`}>Match Score</div>
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-4 mb-4 bg-gray-900/50 p-4 rounded-lg">
                      <div>
                        <p className="text-xs text-green-400 uppercase tracking-wide font-semibold mb-2">Strengths</p>
                        <ul className="space-y-1">
                          {candidate.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-400" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {candidate.gaps && candidate.gaps.length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-400 uppercase tracking-wide font-semibold mb-2">Gaps</p>
                          <ul className="space-y-1">
                            {candidate.gaps.slice(0, 3).map((g, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                <AlertCircle className="w-3 h-3 text-yellow-400" /> {g}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {!showScheduling[candidate._id] ? (
                      <>
                        <button
                          onClick={() => setShowScheduling(prev => ({ ...prev, [candidate._id]: true }))}
                          className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition flex items-center justify-center gap-2"
                        >
                          <Calendar className="w-4 h-4" />
                          Schedule Interview
                        </button>
                        <button
                          onClick={() => navigate(`/candidate/${candidate._id}`)}
                          className="flex-1 px-4 py-2 border border-cyan-500/50 text-cyan-400 rounded-lg hover:bg-cyan-500/10 transition"
                        >
                          View Profile
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-3 bg-gray-900/50 p-4 rounded-lg">
                        <input
                          type="date"
                          value={scheduleData[candidate._id]?.date || ''}
                          onChange={(e) => setScheduleData(prev => ({
                            ...prev,
                            [candidate._id]: { ...prev[candidate._id], date: e.target.value }
                          }))}
                          className="w-full p-2 bg-gray-700/50 border border-gray-600/30 rounded text-white placeholder-gray-500"
                        />
                        <input
                          type="text"
                          placeholder="Interview Link (Zoom, Teams, etc.)"
                          value={scheduleData[candidate._id]?.link || ''}
                          onChange={(e) => setScheduleData(prev => ({
                            ...prev,
                            [candidate._id]: { ...prev[candidate._id], link: e.target.value }
                          }))}
                          className="w-full p-2 bg-gray-700/50 border border-gray-600/30 rounded text-white placeholder-gray-500"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleScheduleInterview(candidate._id)}
                            className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/50 text-green-400 rounded hover:bg-green-500/30 transition"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowScheduling(prev => ({ ...prev, [candidate._id]: false }))}
                            className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600/50 text-gray-400 rounded hover:bg-gray-700 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
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

