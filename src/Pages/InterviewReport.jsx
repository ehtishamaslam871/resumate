import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { interviewAPI } from '../services/api';
import { AlertCircle, ArrowLeft, CheckCircle, Loader, Trophy } from 'lucide-react';

const levelClass = (score) => {
  if (score == null) return 'text-gray-300';
  if (score >= 80) return 'text-neon-green';
  if (score >= 60) return 'text-neon-cyan';
  return 'text-red-300';
};

export default function InterviewReport() {
  const { interviewId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [report, setReport] = useState(null);

  useEffect(() => {
    const loadReport = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await interviewAPI.getInterviewReport(interviewId);
        setReport(response);
      } catch (err) {
        setError(err.message || 'Unable to load interview report');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) loadReport();
  }, [interviewId]);

  const rows = useMemo(() => {
    if (!report?.reportQuestions) return [];
    return report.reportQuestions;
  }, [report]);

  const avg = useMemo(() => {
    const direct = report?.averageScore ?? report?.feedback?.overallScore;
    if (typeof direct === 'number') return direct;
    const scored = rows.map((r) => r.score).filter((s) => typeof s === 'number');
    if (!scored.length) return null;
    return Math.round(scored.reduce((a, b) => a + b, 0) / scored.length);
  }, [report, rows]);

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 h-[22rem] w-[22rem] rounded-full bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 blur-3xl" />
      <div className="fixed bottom-0 left-0 -z-10 h-[24rem] w-[24rem] rounded-full bg-gradient-to-tr from-neon-blue/10 to-neon-pink/10 blur-3xl" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/interview')}
            className="btn-secondary inline-flex items-center gap-2 px-4 py-2 font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Interviews
          </button>
        </div>

        {loading && (
          <div className="card-glass rounded-2xl p-14 text-center">
            <Loader className="h-10 w-10 text-neon-cyan animate-spin mx-auto mb-4" />
            <p className="text-gray-300">Loading your interview report...</p>
          </div>
        )}

        {!loading && error && (
          <div className="mb-6 rounded-xl border border-red-500/50 bg-red-500/15 p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {!loading && !error && report && (
          <>
            <section className="card-glass rounded-2xl border border-neon-cyan/20 p-5 sm:p-6 mb-6">
              <p className="text-xs uppercase tracking-wider text-neon-cyan font-semibold mb-2">Interview Report</p>
              <h1 className="text-3xl font-bold text-gray-100">{report?.interview?.jobTitle || 'Practice Interview'}</h1>
              <p className="text-gray-400 mt-1">{report?.interview?.companyName || 'Mock Interview'} • {report?.questionsAnswered || 0}/{report?.totalQuestions || 0} answered</p>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Overall Score</p>
                  <p className={`text-3xl font-bold mt-1 ${levelClass(avg)}`}>{avg == null ? '--' : `${Math.round(avg)}%`}</p>
                </div>
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Recommendation</p>
                  <p className="text-lg font-bold mt-1 text-gray-100">{report?.recommendation ? String(report.recommendation).toUpperCase() : 'N/A'}</p>
                </div>
                <div className="rounded-xl border border-dark-700 bg-dark-900/60 p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider">Status</p>
                  <p className="text-lg font-bold mt-1 text-neon-green inline-flex items-center gap-2"><Trophy className="h-4 w-4" /> Completed</p>
                </div>
              </div>
            </section>

            {rows.length === 0 ? (
              <div className="card-glass rounded-2xl border border-dark-700 p-8 text-center text-gray-400">
                No question-level report data available yet.
              </div>
            ) : (
              <section className="space-y-4">
                {rows.map((row, idx) => (
                  <details key={row.questionId || idx} open={idx === 0} className="card-glass rounded-2xl border border-dark-700 p-4 sm:p-5">
                    <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-xs text-gray-400 font-semibold">Question {idx + 1}</p>
                        <p className="text-base sm:text-lg font-bold text-gray-100 pr-4">{row.question}</p>
                      </div>
                      <span className={`text-sm font-bold ${levelClass(row.score)}`}>{row.score == null ? '--' : `${Math.round(row.score)} / 100`}</span>
                    </summary>

                    <div className="mt-4 space-y-3">
                      <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-3">
                        <p className="text-sm font-bold text-red-300 mb-1">Your Answer</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{row.userAnswer || 'No answer submitted.'}</p>
                      </div>

                      <div className="rounded-xl border border-neon-green/40 bg-neon-green/10 p-3">
                        <p className="text-sm font-bold text-neon-green mb-1">Suggested Good Answer</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{row.sampleAnswer || 'No model answer available for this question.'}</p>
                      </div>

                      <div className="rounded-xl border border-neon-cyan/40 bg-neon-cyan/10 p-3">
                        <p className="text-sm font-bold text-neon-cyan mb-1">AI Feedback & Insights</p>
                        <p className="text-sm text-gray-200 whitespace-pre-wrap">{row.feedback || 'No feedback available.'}</p>
                      </div>

                      {(row.strengths?.length || row.improvements?.length) ? (
                        <div className="grid sm:grid-cols-2 gap-3">
                          <div className="rounded-xl border border-neon-green/30 bg-neon-green/5 p-3">
                            <p className="text-xs font-bold text-neon-green uppercase tracking-wider mb-2">Strengths</p>
                            <ul className="space-y-1 text-sm text-gray-200">
                              {(row.strengths || []).length ? row.strengths.map((s, i) => <li key={i}>• {s}</li>) : <li>• None noted</li>}
                            </ul>
                          </div>
                          <div className="rounded-xl border border-yellow-400/30 bg-yellow-400/5 p-3">
                            <p className="text-xs font-bold text-yellow-300 uppercase tracking-wider mb-2">Improvements</p>
                            <ul className="space-y-1 text-sm text-gray-200">
                              {(row.improvements || []).length ? row.improvements.map((s, i) => <li key={i}>• {s}</li>) : <li>• None noted</li>}
                            </ul>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </details>
                ))}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
