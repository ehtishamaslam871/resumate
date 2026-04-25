import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { applicationAPI, jobAPI, interviewAPI } from '../services/api';
import { Loader, AlertCircle, CheckCircle, Calendar, Mail, Zap, FileText, UserCheck, UserX } from 'lucide-react';

export default function RecruiterShortlist() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shortlisting, setShortlisting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScheduling, setShowScheduling] = useState({});
  const [scheduleData, setScheduleData] = useState({});
  const [updatingStatusId, setUpdatingStatusId] = useState('');
  const [loadingReportId, setLoadingReportId] = useState('');

  useEffect(() => {
    fetchJobAndCandidates();
  }, [jobId]);

  const fetchJobAndCandidates = async () => {
    try {
      setLoading(true);
      const jobResponse = await jobAPI.getJobById(jobId);
      setJob(jobResponse.job || jobResponse);
      
      const appResponse = await applicationAPI.getJobApplications(jobId);
      setCandidates(appResponse.applications || []);
    } catch (err) {
      setError('Error loading candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleAiShortlist = async () => {
    try {
      setShortlisting(true);
      await applicationAPI.aiShortlistApplications(jobId, { topN: 5 });
      await fetchJobAndCandidates();
      setSuccess('AI shortlisting complete. Candidate list updated.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError('Error running AI shortlisting');
    } finally {
      setShortlisting(false);
    }
  };

  const handleScheduleInterview = async (applicationId) => {
    const { date, link } = scheduleData[applicationId] || {};
    if (!date) {
      alert('Please select an interview date and time');
      return;
    }

    try {
      const response = await interviewAPI.sendInterviewToCandidate(
        applicationId,
        new Date(date).toISOString(),
        (link || '').trim()
      );
      if (response.success) {
        setSuccess('Interview invitation sent successfully.');
        setTimeout(() => setSuccess(''), 2500);
        setShowScheduling(prev => ({ ...prev, [applicationId]: false }));
        setScheduleData(prev => ({ ...prev, [applicationId]: {} }));
        await fetchJobAndCandidates();
      }
    } catch (err) {
      setError(err.message || 'Error scheduling interview');
    }
  };

  const handleStatusUpdate = async (applicationId, status) => {
    try {
      setUpdatingStatusId(applicationId);
      await applicationAPI.updateApplicationStatus(applicationId, status);
      setSuccess(`Candidate ${status} successfully.`);
      setTimeout(() => setSuccess(''), 2500);
      await fetchJobAndCandidates();
    } catch (err) {
      setError(err.message || 'Unable to update application status');
    } finally {
      setUpdatingStatusId('');
    }
  };

  const handleViewInterviewReport = async (applicationId) => {
    try {
      setLoadingReportId(applicationId);
      const response = await interviewAPI.getInterviewByApplication(applicationId);
      const interviewId = response?.interview?._id;
      if (!interviewId) {
        throw new Error('Interview not found for this application');
      }
      navigate(`/recruiter/interview-report/${interviewId}`);
    } catch (err) {
      setError(err.message || 'Unable to load interview report');
    } finally {
      setLoadingReportId('');
    }
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

        {success && (
          <div className="mb-8 p-6 bg-neon-green/20 border border-neon-green/50 rounded-2xl flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
            <p className="text-neon-green text-base">{success}</p>
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
              const resolvedScore = candidate.aiScore ?? candidate.resumeScore ?? candidate.resume?.score ?? candidate.score ?? null;
              const scoreColor = (resolvedScore ?? 0) >= 80 
                ? 'bg-neon-green/20 text-neon-green border-neon-green/50' 
                : (resolvedScore ?? 0) >= 60 
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
                      <h3 className="text-2xl font-bold text-gray-100 mb-2">{candidate.applicantName || 'Anonymous'}</h3>
                      <div className="flex items-center gap-2 text-gray-400 text-base">
                        <Mail className="w-4 h-4 text-neon-cyan" />
                        {candidate.applicantEmail || 'No email'}
                      </div>
                      <div className="mt-2 text-xs text-gray-400">Status: {candidate.status || 'applied'}</div>
                    </div>
                    <div className={`${scoreColor} border px-6 py-3 rounded-lg text-center`}>
                      <div className="text-3xl font-bold">{resolvedScore == null ? 'N/A' : `${Math.round(resolvedScore)}%`}</div>
                      <div className="text-xs font-bold uppercase tracking-wider">Resume / Match Score</div>
                    </div>
                  </div>

                  {/* Strengths & Gaps */}
                  {candidate.aiStrengths && candidate.aiStrengths.length > 0 && (
                    <div className="grid md:grid-cols-2 gap-6 mb-6 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                      <div>
                        <p className="text-xs text-neon-green uppercase tracking-wide font-bold mb-3">✓ Strengths</p>
                        <ul className="space-y-2">
                          {candidate.aiStrengths.slice(0, 3).map((s, i) => (
                            <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-neon-green flex-shrink-0" /> {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {candidate.aiGaps && candidate.aiGaps.length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-400 uppercase tracking-wide font-bold mb-3">⚠ Gaps</p>
                          <ul className="space-y-2">
                            {candidate.aiGaps.slice(0, 3).map((g, i) => (
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
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      {candidate.status !== 'shortlisted' && candidate.status !== 'accepted' ? (
                        <button
                          onClick={() => handleStatusUpdate(candidate._id, 'shortlisted')}
                          disabled={updatingStatusId === candidate._id}
                          className="flex-1 px-6 py-3 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-lg hover:bg-yellow-500/30 transition font-bold flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          {updatingStatusId === candidate._id ? 'Updating...' : 'Shortlist Candidate'}
                        </button>
                      ) : !showScheduling[candidate._id] ? (
                        <button
                          onClick={() => setShowScheduling(prev => ({ ...prev, [candidate._id]: true }))}
                          className="flex-1 px-6 py-3 btn-primary rounded-lg font-bold flex items-center justify-center gap-2 text-base"
                        >
                          <Calendar className="w-5 h-5" />
                          {candidate.interviewStatus === 'scheduled' ? 'Resend Interview' : 'Schedule Interview'}
                        </button>
                      ) : null}

                      <button
                        onClick={() => handleViewInterviewReport(candidate._id)}
                        disabled={loadingReportId === candidate._id || candidate.interviewStatus !== 'completed'}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                          candidate.interviewStatus === 'completed'
                            ? 'bg-neon-cyan/10 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan/20'
                            : 'bg-dark-800/40 border border-dark-700 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {loadingReportId === candidate._id ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                        View Interview Report
                      </button>
                    </div>

                    {(candidate.status === 'shortlisted' || candidate.status === 'reviewing') && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleStatusUpdate(candidate._id, 'accepted')}
                          disabled={updatingStatusId === candidate._id}
                          className="flex-1 px-4 py-3 bg-neon-green/20 border border-neon-green/50 text-neon-green rounded-lg hover:bg-neon-green/30 transition font-bold flex items-center justify-center gap-2"
                        >
                          <UserCheck className="w-4 h-4" />
                          Accept Candidate
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(candidate._id, 'rejected')}
                          disabled={updatingStatusId === candidate._id}
                          className="flex-1 px-4 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-500/30 transition font-bold flex items-center justify-center gap-2"
                        >
                          <UserX className="w-4 h-4" />
                          Reject Candidate
                        </button>
                      </div>
                    )}

                    {showScheduling[candidate._id] && (
                      <div className="w-full space-y-4 bg-dark-800/30 p-6 rounded-xl border border-dark-700/50">
                        <input
                          type="datetime-local"
                          value={scheduleData[candidate._id]?.date || ''}
                          onChange={(e) => setScheduleData(prev => ({
                            ...prev,
                            [candidate._id]: { ...prev[candidate._id], date: e.target.value }
                          }))}
                          className="input-modern w-full"
                        />
                        <input
                          type="text"
                          placeholder="Interview Link (optional; leave blank for auto-generated internal link)"
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

