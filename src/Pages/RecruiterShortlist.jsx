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
      <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
        <Navbar />
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5 rounded-full blur-3xl"></div>
        </div>
        <div className="flex items-center justify-center min-h-[70vh] relative z-10">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading candidates...</p>
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
            <h1 className="text-5xl font-bold text-gray-100 mb-3">
              {job?.title} - Candidates
            </h1>
            <p className="text-neon-cyan font-semibold text-lg">{candidates.length} applications received</p>
          </div>
          <button
            onClick={handleAiShortlist}
            disabled={shortlisting}
            className={`px-8 py-3 rounded-lg font-bold transition flex items-center gap-2 text-lg shadow-lg ${
              shortlisting
                ? 'bg-dark-800/50 text-gray-400 cursor-not-allowed'
                : 'btn-primary shadow-neon-cyan/50'
            }`}
          >
            {shortlisting ? <Loader className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
            {shortlisting ? 'AI Shortlisting...' : 'Run AI Shortlist'}
          </button>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-base">{error}</p>
          </div>
        )}

        {/* Candidates List */}
        {candidates.length === 0 ? (
          <div className="card-glass p-16 rounded-2xl text-center border border-neon-cyan/20">
            <div className="text-6xl mb-4 opacity-50">👥</div>
            <h3 className="text-2xl font-bold text-gray-100 mb-2">No Applications Yet</h3>
            <p className="text-gray-400">Wait for candidates to apply to this job</p>
          </div>
        ) : (
          <div className="space-y-6">
            {candidates.map((candidate) => {
              const aiScore = candidate.aiScore || candidate.score || 0;
              const scoreColor = aiScore >= 80 
                ? 'bg-neon-green/20 text-neon-green border-neon-green/50' 
                : aiScore >= 60 
                ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50'
                : 'bg-red-500/20 text-red-400 border-red-500/50';
              
              return (
                <div
                  key={candidate._id}
                  className="card-glass card-glass-hover p-8 rounded-2xl border border-neon-cyan/20"
                >
                  {/* Candidate Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-100 mb-2">{candidate.candidateName || 'Anonymous'}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-base">
                        <Mail className="w-4 h-4 text-neon-cyan" />
                        {candidate.candidateEmail || 'No email'}
                      </div>
                    </div>
                    <div className={`${scoreColor} border px-6 py-3 rounded-lg text-center`}>
                      <div className="text-3xl font-bold">{Math.round(aiScore)}%</div>
                      <div className="text-xs font-bold uppercase tracking-wider">Match Score</div>
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  {candidate.strengths && candidate.strengths.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 mb-6 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                      <div>
                        <p className="text-xs text-neon-green uppercase tracking-wide font-bold mb-3">✓ Strengths</p>
                        <ul className="space-y-2">
                          {candidate.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {candidate.gaps && candidate.gaps.length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-400 uppercase tracking-wide font-bold mb-3">⚠ Gaps</p>
                          <ul className="space-y-2">
                            {candidate.gaps.slice(0, 3).map((g, i) => (
                              <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" /> {g}
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
                          className="flex-1 px-6 py-3 btn-primary rounded-lg font-bold flex items-center justify-center gap-2 text-base"
                        >
                          <Calendar className="w-5 h-5" />
                          Schedule Interview
                        </button>
                        <button
                          onClick={() => navigate(`/candidate/${candidate._id}`)}
                          className="flex-1 px-6 py-3 bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan rounded-lg hover:bg-neon-cyan/20 transition font-bold"
                        >
                          View Profile
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-4 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                        <input
                          type="date"
                          value={scheduleData[candidate._id]?.date || ''}
                          onChange={(e) => setScheduleData(prev => ({
                            ...prev,
                            [candidate._id]: { ...prev[candidate._id], date: e.target.value }
                          }))}
                          className="input-modern w-full"
                        />
                        <input
                          type="text"
                          placeholder="Interview Link (Zoom, Teams, etc.)"
                          value={scheduleData[candidate._id]?.link || ''}
                          onChange={(e) => setScheduleData(prev => ({
                            ...prev,
                            [candidate._id]: { ...prev[candidate._id], link: e.target.value }
                          }))}
                          className="input-modern w-full"
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleScheduleInterview(candidate._id)}
                            className="flex-1 px-4 py-3 bg-neon-green/20 border border-neon-green/50 text-neon-green rounded-lg hover:bg-neon-green/30 transition font-bold"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setShowScheduling(prev => ({ ...prev, [candidate._id]: false }))}
                            className="flex-1 px-4 py-3 btn-secondary rounded-lg font-bold"
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

