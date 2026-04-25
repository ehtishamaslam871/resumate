import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';
import { AlertCircle, ArrowLeft, Loader, Trophy } from 'lucide-react';

const levelClass = (score) => {
  if (score == null) return 'text-gray-300';
  if (score >= 80) return 'text-neon-green';
  if (score >= 60) return 'text-neon-cyan';
  return 'text-red-300';
};

export default function RecruiterInterviewReport() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await interviewAPI.getInterviewFeedback(interviewId);
        setPayload(response);
      } catch (err) {
        setError(err.message || 'Unable to load interview report');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) loadReport();
  }, [interviewId]);

  const interview = payload?.interview;
  const feedback = payload?.feedback || {};
  const answers = useMemo(() => payload?.answers || [], [payload]);

  const avgScore = useMemo(() => {
    if (typeof feedback.overallScore === 'number') return Math.round(feedback.overallScore);
    const scored = answers.map((item) => item.score).filter((score) => typeof score === 'number');
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  }, [answers, feedback]);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 blur-3xl" />
      <div className="fixed bottom-0 left-0 -z-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-neon-blue/10 to-neon-pink/10 blur-3xl" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate(-1)}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        </div>

        {loading && (
          <div className="card-glass rounded-2xl p-14 text-center">
            <Loader className="h-10 w-10 text-neon-cyan animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading candidate interview report...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/15 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && interview && (
          <>
            <section className="card-glass rounded-2xl border border-neon-cyan/20 p-5 sm:p-6 mb-6">
              <p className="text-xs uppercase tracking-wider text-neon-cyan font-semibold mb-2">Recruiter View</p>
              <h1 className="text-3xl font-bold text-gray-100">{interview?.job?.title || interview?.jobTitle || 'Interview Report'}</h1>
              <p className="text-gray-400 mt-1">
                Candidate: {interview?.candidate?.name || 'Unknown'} ({interview?.candidate?.email || 'No email'})
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Overall Score</p>
                  <p className={`text-3xl font-bold mt-1 ${levelClass(avgScore)}`}>
                    {avgScore == null ? '--' : `${avgScore}%`}
                  </p>
                </div>
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Performance Level</p>
                  <p className="text-lg font-bold mt-1 text-gray-100">{feedback.performanceLevel || 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
                  <p className="text-lg font-bold mt-1 text-neon-green inline-flex items-center gap-2">
                    <Trophy className="h-4 w-4" /> {interview.status === 'completed' ? 'Completed' : interview.status}
                  </p>
                </div>
              </div>
            </section>

            {feedback.summary && (
              <section className="card-glass rounded-2xl border border-dark-700 p-5 sm:p-6 mb-6">
                <h2 className="text-lg font-bold text-gray-100 mb-2">Summary</h2>
                <p className="text-gray-300">{feedback.summary}</p>
              </section>
            )}

            <section className="space-y-4">
              {answers.length === 0 ? (
                <div className="card-glass rounded-2xl border border-dark-700 p-8 text-center text-gray-400">
                  No answer-level data available yet.
                </div>
              ) : answers.map((row, idx) => (
                <details key={`${row.questionId || idx}-${idx}`} open={idx === 0} className="card-glass rounded-2xl border border-dark-700 p-4 sm:p-5">
                  <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Question {idx + 1}</p>
                      <p className="text-base sm:text-lg font-bold text-gray-100 pr-4">{row.question}</p>
                    </div>
                    <span className={`text-sm font-bold ${levelClass(row.score)}`}>
                      {row.score == null ? '--' : `${Math.round(row.score)} / 100`}
                    </span>
                  </summary>

                  <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                      <p className="text-sm font-bold text-red-300 mb-1">Candidate Answer</p>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{row.answer || 'No answer submitted.'}</p>
                    </div>

                    <div className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 p-3">
                      <p className="text-sm font-bold text-neon-cyan mb-1">AI Feedback</p>
                      <p className="text-sm text-gray-200 whitespace-pre-wrap">{row.feedback || 'No feedback available.'}</p>
                    </div>
                  </div>
                </details>
              ))}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
