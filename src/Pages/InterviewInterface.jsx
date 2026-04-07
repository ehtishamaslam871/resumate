import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import Navbar from '../components/Navbar';
import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CameraOff,
  CheckCircle,
  Clock,
  Loader,
  Mic,
  Play,
  Sparkles,
} from 'lucide-react';

const getQuestionText = (question) => question?.question || question?.questionText || question?.text || '';

export default function InterviewInterface() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('precheck');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({});
  const [cameraEnabled, setCameraEnabled] = useState(false);

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await interviewAPI.getInterview(interviewId);
      const loadedInterview = response?.interview;
      if (!loadedInterview) {
        throw new Error(response?.message || 'Failed to load interview');
      }

      setInterview(loadedInterview);

      const existingAnswers = loadedInterview.answers || [];
      const initialAnswers = {};
      const initialFeedback = {};

      existingAnswers.forEach((answerItem, idx) => {
        const questionIndex = typeof answerItem?.questionId === 'number' ? answerItem.questionId - 1 : idx;
        initialAnswers[questionIndex] = answerItem.answer || answerItem.answerText || '';
        if (answerItem.feedback) {
          initialFeedback[questionIndex] = {
            feedback: answerItem.feedback,
            score: answerItem.score,
          };
        }
      });

      setAnswers(initialAnswers);
      setFeedback(initialFeedback);

      const answeredCount = existingAnswers.length;
      setCurrentQuestion(Math.min(answeredCount, Math.max((loadedInterview.questions?.length || 1) - 1, 0)));

      if (loadedInterview.status === 'completed') {
        setStage('completed');
      } else if (loadedInterview.status === 'in_progress') {
        setStage('session');
      } else {
        setStage('precheck');
      }
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError(err.message || 'Error loading interview');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, text) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: text }));
  };

  const startSession = async () => {
    try {
      setSubmitting(true);
      setError('');
      await interviewAPI.startInterviewSession(interviewId);
      setStage('session');
      await fetchInterview();
    } catch (err) {
      setError(err.message || 'Unable to start interview session');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitAnswer = async (questionIndex) => {
    const answer = answers[questionIndex];
    if (!answer.trim()) {
      setError('Please enter an answer before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      const normalizedQuestionId =
        interview?.questions?.[questionIndex]?.questionId ?? questionIndex + 1;
      const response = await interviewAPI.submitInterviewAnswer(interviewId, normalizedQuestionId, answer);
      if (response?.success) {
        setFeedback(prev => ({
          ...prev,
          [questionIndex]: {
            feedback: response.feedback || 'Answer submitted successfully.',
            score: response.score,
          },
        }));

        const answeredCount = Object.keys({ ...feedback, [questionIndex]: true }).length;
        const total = interview?.questions?.length || 0;

        if (answeredCount >= total) {
          await fetchInterview();
          setStage('completed');
        } else if (questionIndex < total - 1) {
          setTimeout(() => {
            setCurrentQuestion(questionIndex + 1);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = useMemo(() => Object.keys(feedback).length, [feedback]);
  const totalQuestions = interview?.questions?.length || 0;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentAnswerLength = (answers[currentQuestion] || '').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white">
        <Navbar />
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="flex min-h-[80vh] items-center justify-center">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading Interview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview?.questions) {
    return (
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 text-xl mb-8">Interview Not Found</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary px-8 py-3 font-bold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const question = interview.questions[currentQuestion];

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-8 relative z-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 btn-secondary font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <div className="flex items-center gap-3 card-glass px-5 py-2 rounded-lg border border-neon-cyan/20">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <span className="text-neon-cyan font-semibold">{interview.durationMinutes || 15} min session</span>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-lg">{error}</p>
          </div>
        )}

        {stage === 'precheck' && (
          <div className="space-y-6">
            <div className="card-glass p-10 rounded-2xl border border-neon-cyan/20">
              <p className="text-xs uppercase tracking-wider text-neon-cyan font-semibold mb-3">Preparation</p>
              <h2 className="text-3xl font-bold text-gray-100 mb-2">Ready to begin your interview?</h2>
              <p className="text-gray-400 mb-6">Complete this quick checklist before you start.</p>

              <div className="grid gap-4 sm:grid-cols-2 mb-8">
                <div className="rounded-xl border border-neon-green/30 bg-neon-green/10 p-4">
                  <p className="font-semibold text-neon-green mb-1">Environment Check</p>
                  <p className="text-sm text-gray-300">Quiet room, stable network, and browser tab ready.</p>
                </div>
                <div className="rounded-xl border border-neon-cyan/30 bg-neon-cyan/10 p-4">
                  <p className="font-semibold text-neon-cyan mb-1">Answer Style</p>
                  <p className="text-sm text-gray-300">Use structured examples and keep answers concise.</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCameraEnabled((prev) => !prev)}
                  className="btn-secondary inline-flex items-center gap-2 px-5 py-2.5"
                >
                  {cameraEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  {cameraEnabled ? 'Disable Camera Preview' : 'Enable Camera Preview'}
                </button>
                <button
                  onClick={startSession}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 font-bold"
                  disabled={submitting}
                >
                  {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Start Interview
                </button>
              </div>

              {cameraEnabled && (
                <div className="mt-5 rounded-xl border border-neon-cyan/30 bg-dark-900/80 p-4">
                  <p className="text-sm text-neon-cyan font-semibold mb-1">Camera Preview Enabled</p>
                  <p className="text-xs text-gray-400">You are ready to continue with a live interview setup.</p>
                </div>
              )}
            </div>

            <div className="card-glass p-6 rounded-2xl border border-dark-700">
              <h3 className="font-bold text-gray-100 mb-3 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-neon-cyan" /> Smart Tips
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Speak like you are explaining to a teammate, not reading a script.</li>
                <li>Use STAR format for behavioral questions.</li>
                <li>If stuck, clarify assumptions before diving into solution details.</li>
              </ul>
            </div>
          </div>
        )}

        {stage === 'session' && (
          <>
            <div className="mb-6">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end mb-3">
                <div>
                  <h2 className="text-3xl font-bold text-gradient">Interview Session</h2>
                  <p className="text-sm text-gray-400 mt-1">{interview.jobTitle || 'Practice Interview'} • {interview.companyName || 'ResuMate'}</p>
                </div>
                <span className="badge-primary text-sm h-fit">
                  {answeredCount}/{totalQuestions} answered ({Math.round(progress)}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-dark-800/50 rounded-full overflow-hidden border border-dark-600">
                <div
                  className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start">
              <div className="card-glass p-5 sm:p-6 rounded-2xl border border-neon-cyan/20">
                <div className="flex items-start gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold flex-shrink-0 text-base">
                    {currentQuestion + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-400 text-xs sm:text-sm mb-1.5 font-semibold">Question {currentQuestion + 1} of {totalQuestions}</p>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-100 leading-tight">{getQuestionText(question)}</h3>
                  </div>
                </div>

                {!feedback[currentQuestion] ? (
                  <div className="space-y-4">
                    <textarea
                      value={answers[currentQuestion] || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                      placeholder="Type your answer here..."
                      className="input-modern w-full h-32 sm:h-40 resize-none"
                      rows="5"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <span className="text-xs sm:text-sm text-gray-400 font-medium">
                        {currentAnswerLength} characters
                      </span>
                      <button
                        onClick={() => handleSubmitAnswer(currentQuestion)}
                        disabled={submitting || !answers[currentQuestion]?.trim()}
                        className={`font-bold transition transform flex items-center gap-2 ${
                          submitting
                            ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed px-5 py-2.5 rounded-lg'
                            : 'btn-primary px-6 py-2.5 hover:scale-105'
                        }`}
                      >
                        {submitting ? (
                          <>
                            <Loader className="w-4 h-4 animate-spin" />
                            Evaluating...
                          </>
                        ) : (
                          <>
                            <Mic className="w-4 h-4" />
                            Submit Answer
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-neon-green/10 border border-neon-green/50 rounded-xl flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-neon-green flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-neon-green mb-1">Answer captured</p>
                        <p className="text-gray-300 text-sm leading-relaxed">{feedback[currentQuestion]?.feedback}</p>
                      </div>
                    </div>
                    {currentQuestion < totalQuestions - 1 && (
                      <button
                        onClick={() => setCurrentQuestion(currentQuestion + 1)}
                        className="w-full btn-primary py-2.5 font-bold"
                      >
                        Next Question {'>'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <aside className="space-y-4 xl:sticky xl:top-20">
                <div className="card-glass p-4 rounded-2xl border border-neon-cyan/20">
                  <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-wider mb-3">Session Summary</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p>Answered: <span className="text-neon-green font-semibold">{answeredCount}</span></p>
                    <p>Remaining: <span className="text-gray-100 font-semibold">{Math.max(totalQuestions - answeredCount, 0)}</span></p>
                    <p>Current: <span className="text-neon-cyan font-semibold">Q{currentQuestion + 1}</span></p>
                  </div>
                </div>

                <div className="card-glass p-4 rounded-2xl border border-neon-cyan/20">
                  <h3 className="text-xs font-bold text-neon-cyan uppercase tracking-wider mb-3">Question Navigator</h3>
                  <div className="grid grid-cols-5 xl:grid-cols-4 gap-2">
                    {interview.questions.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentQuestion(i)}
                        className={`aspect-square rounded-lg font-bold text-sm transition transform hover:scale-105 ${
                          currentQuestion === i
                            ? 'bg-gradient-to-br from-neon-cyan to-neon-purple text-dark-950 ring-2 ring-neon-cyan/50'
                            : feedback[i]
                            ? 'bg-neon-green/20 text-neon-green border border-neon-green/50'
                            : 'bg-dark-800/50 text-gray-400 border border-dark-600 hover:border-neon-cyan/30'
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}

        {stage === 'completed' && (
          <div className="card-glass p-10 rounded-2xl border border-neon-green/30 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-neon-green/50 bg-neon-green/10">
              <CheckCircle className="h-10 w-10 text-neon-green" />
            </div>
            <h2 className="text-3xl font-bold text-gray-100">Interview Completed</h2>
            <p className="mt-2 text-gray-400">
              Great work. Your responses have been recorded and feedback is available in your profile/interview history.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => navigate(`/interview-report/${interviewId}`)} className="btn-secondary px-6 py-3 font-bold">View Report</button>
              <button onClick={() => navigate('/interview')} className="btn-primary px-6 py-3 font-bold">Back to Dashboard</button>
              <button onClick={() => navigate('/profile')} className="btn-secondary px-6 py-3 font-bold">Go to Profile</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
