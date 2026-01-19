import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { Send, Loader, CheckCircle, AlertCircle, Volume2, Pause, Play } from 'lucide-react';

export default function Interview() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const messagesEndRef = useRef(null);

  // Fetch interview questions on mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('resumate_user') || 'null');
        if (!user) {
          navigate('/auth');
          return;
        }

        // Start interview session
        const response = await api.interview.start(jobId);
        setInterview(response.interview);
        setAnswers(new Array(response.interview.questions?.length || 5).fill(''));
      } catch (err) {
        setError(err.message || 'Failed to load interview');
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchInterview();
    }
  }, [jobId, navigate]);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentQuestionIndex]);

  // Timer for recording
  useEffect(() => {
    let interval;
    if (interview && !completed) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [interview, completed]);

  const handleAnswerChange = (e) => {
    setCurrentAnswer(e.target.value);
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim()) {
      const newAnswers = [...answers];
      newAnswers[currentQuestionIndex] = currentAnswer;
      setAnswers(newAnswers);

      if (currentQuestionIndex < (interview?.questions?.length || 5) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setCurrentAnswer('');
      } else {
        // Submit interview
        await handleSubmitInterview(newAnswers);
      }
    }
  };

  const handleSubmitInterview = async (finalAnswers) => {
    setSubmitting(true);
    try {
      const response = await api.interview.submit({
        interviewId: interview._id,
        answers: finalAnswers,
      });

      setCompleted(true);
      setFeedback(response.feedback);

      // Redirect after 5 seconds
      setTimeout(() => {
        navigate('/profile');
      }, 5000);
    } catch (err) {
      setError(err.message || 'Failed to submit interview');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2">Error Starting Interview</h3>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!interview) {
    return null;
  }

  const questions = interview.questions || [];
  const currentQuestion = questions[currentQuestionIndex];
  const totalQuestions = questions.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 py-16">
        {!completed ? (
          <div>
            {/* Interview Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Interview Session</h1>
              <p className="text-gray-400">{interview.jobTitle}</p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8 bg-gray-800 p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-3">
                <p className="text-gray-400">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <p className="text-cyan-400 font-semibold">{formatTime(recordingTime)}</p>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Section */}
            <div className="bg-gray-800 p-8 rounded-2xl mb-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <span className="w-10 h-10 bg-cyan-500 text-gray-900 rounded-full flex items-center justify-center font-bold">
                    {currentQuestionIndex + 1}
                  </span>
                  {currentQuestion}
                </h2>
                <p className="text-gray-400">
                  Take your time to provide a thoughtful answer. Speak naturally and try to be specific with examples.
                </p>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                <label className="block text-sm font-medium">Your Answer</label>
                <textarea
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Type or paste your answer here. You can include multiple paragraphs."
                  className="w-full h-40 px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-cyan-400 resize-none"
                />
                <p className="text-xs text-gray-500">
                  Character count: {currentAnswer.length}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4">
              {currentQuestionIndex > 0 && (
                <button
                  onClick={() => {
                    setCurrentAnswer(answers[currentQuestionIndex - 1] || '');
                    setCurrentQuestionIndex(currentQuestionIndex - 1);
                  }}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition"
                >
                  ← Previous Question
                </button>
              )}

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer.trim() || submitting}
                  className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    currentAnswer.trim() && !submitting
                      ? 'bg-cyan-500 text-gray-900 hover:bg-cyan-600'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitInterview(answers)}
                  disabled={!currentAnswer.trim() || submitting}
                  className={`flex-1 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                    currentAnswer.trim() && !submitting
                      ? 'bg-green-500 text-gray-900 hover:bg-green-600'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Submit Interview
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tips Section */}
            <div className="mt-8 bg-cyan-500/10 border border-cyan-500/30 p-6 rounded-2xl">
              <h3 className="font-bold text-cyan-300 mb-3">💡 Interview Tips</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>✓ Answer the question directly and provide specific examples</li>
                <li>✓ Be concise but thorough (1-3 minutes per question)</li>
                <li>✓ Highlight relevant skills and achievements</li>
                <li>✓ Show enthusiasm for the role and company</li>
              </ul>
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-12 rounded-2xl text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-12 h-12 text-green-400" />
              </div>
              <h2 className="text-3xl font-bold mb-2">Interview Completed!</h2>
              <p className="text-gray-400 mb-6">Thank you for completing the interview. We'll review your responses and get back to you soon.</p>
            </div>

            {/* Feedback Section */}
            {feedback && (
              <div className="bg-gray-700/50 p-6 rounded-lg mb-8 text-left max-w-2xl mx-auto">
                <h3 className="font-bold text-cyan-300 mb-4">Interview Feedback</h3>
                
                {feedback.score && (
                  <div className="mb-6 p-4 bg-gray-600/50 rounded-lg">
                    <p className="text-gray-400 mb-2">Overall Score</p>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold text-cyan-400">{Math.round(feedback.score)}%</div>
                      <div className="text-sm text-gray-300">
                        <p className="font-medium">Performance</p>
                        <p className={feedback.score >= 80 ? 'text-green-400' : feedback.score >= 60 ? 'text-yellow-400' : 'text-red-400'}>
                          {feedback.score >= 80 ? 'Excellent' : feedback.score >= 60 ? 'Good' : 'Needs Improvement'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {feedback.strengths && (
                  <div className="mb-4">
                    <p className="font-medium text-green-400 mb-2">✓ Strengths</p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx}>• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.areasForImprovement && (
                  <div>
                    <p className="font-medium text-yellow-400 mb-2">→ Areas for Improvement</p>
                    <ul className="space-y-1 text-sm text-gray-300">
                      {feedback.areasForImprovement.map((area, idx) => (
                        <li key={idx}>• {area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="text-gray-500 text-sm mb-6">Redirecting to your profile in a few seconds...</p>

            <button
              onClick={() => navigate('/profile')}
              className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
            >
              Go to Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
