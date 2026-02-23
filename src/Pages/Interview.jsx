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
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [answerHistory, setAnswerHistory] = useState([]); // track submitted answers & evaluations
  const messagesEndRef = useRef(null);

  // Fetch interview questions on mount
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        // Check both localStorage keys for user
        const user = JSON.parse(
          localStorage.getItem('resumate_user') || 
          localStorage.getItem('user') || 
          'null'
        );
        if (!user) {
          navigate('/auth');
          return;
        }

        // Start interview session
        const response = await api.interview.startInterview(jobId);
        setInterview(response.interview);
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

  // Submit current answer to backend and advance to next question
  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || !interview) return;
    
    setSubmitting(true);
    try {
      const response = await api.interview.submitAnswer(interview._id, currentAnswer.trim());
      
      // Track this answer + evaluation
      setAnswerHistory(prev => [...prev, {
        question: questions[currentQuestionIndex]?.question || questions[currentQuestionIndex],
        answer: currentAnswer.trim(),
        evaluation: response.evaluation
      }]);
      
      if (response.interviewComplete) {
        // Interview is done
        setCompleted(true);
        setFeedback({
          score: response.averageScore,
          finalFeedback: response.finalFeedback,
          strengths: response.evaluation?.strengths || [],
          areasForImprovement: response.evaluation?.improvements || []
        });
      } else {
        // Move to next question
        setCurrentQuestionIndex(response.currentQuestion);
        setCurrentAnswer('');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    if (currentAnswer.trim()) {
      await handleSubmitAnswer();
    }
  };

  const handleSubmitInterview = async () => {
    if (currentAnswer.trim()) {
      await handleSubmitAnswer();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-950 text-white">
        <Navbar />
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Loading interview...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-950 text-white">
        <Navbar />
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <main className="max-w-4xl mx-auto px-6 py-16">
          <div className="p-8 bg-red-500/20 border border-red-500/50 rounded-2xl flex items-start gap-4">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2 text-lg">Error Starting Interview</h3>
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
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-4xl mx-auto px-6 py-16">
        {!completed ? (
          <div>
            {/* Interview Header */}
            <div className="mb-12">
              <h1 className="text-4xl font-bold mb-3 text-gray-100">Interview Session</h1>
              <p className="text-neon-cyan font-semibold text-lg">{interview.jobTitle}</p>
            </div>

            {/* Progress Bar */}
            <div className="card-glass p-8 rounded-2xl mb-12 border border-neon-cyan/20">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-400 font-medium">
                  Question {currentQuestionIndex + 1} of {totalQuestions}
                </p>
                <p className="text-neon-cyan font-bold text-lg">{formatTime(recordingTime)}</p>
              </div>
              <div className="w-full bg-dark-800/50 rounded-full h-3 overflow-hidden border border-dark-600">
                <div
                  className="bg-gradient-to-r from-neon-cyan to-neon-purple h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Question Section */}
            <div className="card-glass p-10 rounded-2xl mb-10 border border-neon-cyan/20">
              <div className="mb-10">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-4">
                  <span className="w-12 h-12 bg-gradient-to-br from-neon-cyan to-neon-purple text-dark-950 rounded-full flex items-center justify-center font-bold text-lg">
                    {currentQuestionIndex + 1}
                  </span>
                  <span className="text-gray-100">{currentQuestion?.question || currentQuestion}</span>
                </h2>
                <p className="text-gray-400 text-lg">
                  Take your time to provide a thoughtful answer. Speak naturally and try to be specific with examples.
                </p>
              </div>

              {/* Answer Input */}
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-neon-cyan">Your Answer</label>
                <textarea
                  value={currentAnswer}
                  onChange={handleAnswerChange}
                  placeholder="Type or paste your answer here. You can include multiple paragraphs."
                  className="input-modern w-full h-48 resize-none"
                />
                <p className="text-xs text-gray-500 text-right">
                  Character count: {currentAnswer.length}
                </p>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex gap-4 mb-10">
              {currentQuestionIndex > 0 && answerHistory.length > 0 && (
                <button
                  onClick={() => {
                    // Just view previous - can't re-answer since already submitted
                    // This is informational only
                  }}
                  className="btn-secondary px-8 py-3 font-bold opacity-50 cursor-not-allowed"
                  disabled
                  title="Previous answers have already been submitted"
                >
                  ← Previous (Submitted)
                </button>
              )}

              {currentQuestionIndex < totalQuestions - 1 ? (
                <button
                  onClick={handleNextQuestion}
                  disabled={!currentAnswer.trim() || submitting}
                  className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    currentAnswer.trim() && !submitting
                      ? 'btn-primary'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next Question →
                </button>
              ) : (
                <button
                  onClick={() => handleSubmitInterview()}
                  disabled={!currentAnswer.trim() || submitting}
                  className={`flex-1 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 ${
                    currentAnswer.trim() && !submitting
                      ? 'bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 hover:shadow-lg hover:shadow-neon-green/50 shadow-neon-green/30'
                      : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
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
            <div className="card-glass p-8 rounded-2xl border border-neon-cyan/20">
              <h3 className="font-bold text-neon-cyan mb-4 text-lg">💡 Interview Tips</h3>
              <ul className="space-y-3 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-neon-green font-bold mt-1">✓</span>
                  <span>Answer the question directly and provide specific examples</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green font-bold mt-1">✓</span>
                  <span>Be concise but thorough (1-3 minutes per question)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green font-bold mt-1">✓</span>
                  <span>Highlight relevant skills and achievements</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-neon-green font-bold mt-1">✓</span>
                  <span>Show enthusiasm for the role and company</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Completion Screen */
          <div className="card-glass card-glass-hover p-12 rounded-2xl text-center border border-neon-green/20">
            <div className="mb-8">
              <div className="w-24 h-24 bg-neon-green/20 border border-neon-green/50 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-16 h-16 text-neon-green" />
              </div>
              <h2 className="text-4xl font-bold mb-3 text-gray-100">Interview Completed!</h2>
              <p className="text-gray-400 text-lg mb-8">Thank you for completing the interview. We'll review your responses and get back to you soon.</p>
            </div>

            {/* Feedback Section */}
            {feedback && (
              <div className="bg-dark-800/50 p-8 rounded-xl mb-10 text-left max-w-2xl mx-auto border border-dark-600">
                <h3 className="font-bold text-neon-cyan mb-6 text-lg">Interview Feedback</h3>
                
                {feedback.score && (
                  <div className="mb-8 p-6 bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 rounded-lg">
                    <p className="text-gray-400 mb-3 font-medium">Overall Score</p>
                    <div className="flex items-center gap-6">
                      <div className="text-5xl font-bold text-neon-cyan">{Math.round(feedback.score)}%</div>
                      <div className="text-sm text-gray-300">
                        <p className="font-semibold mb-1">Performance Level</p>
                        <p className={feedback.score >= 80 ? 'text-neon-green font-bold' : feedback.score >= 60 ? 'text-yellow-400 font-bold' : 'text-red-400 font-bold'}>
                          {feedback.score >= 80 ? '● Excellent' : feedback.score >= 60 ? '● Good' : '● Needs Improvement'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {feedback.strengths && (
                  <div className="mb-6">
                    <p className="font-bold text-neon-green mb-3">✓ Your Strengths</p>
                    <ul className="space-y-2">
                      {feedback.strengths.map((strength, idx) => (
                        <li key={idx} className="text-gray-300 flex items-start gap-3">
                          <span className="text-neon-green mt-1">•</span>
                          <span>{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {feedback.areasForImprovement && (
                  <div>
                    <p className="font-bold text-yellow-400 mb-3">→ Areas for Improvement</p>
                    <ul className="space-y-2">
                      {feedback.areasForImprovement.map((area, idx) => (
                        <li key={idx} className="text-gray-300 flex items-start gap-3">
                          <span className="text-yellow-400 mt-1">•</span>
                          <span>{area}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <p className="text-gray-500 text-sm mb-8">Redirecting to your profile in a few seconds...</p>

            <button
              onClick={() => navigate('/profile')}
              className="btn-primary px-8 py-3 font-bold"
            >
              Go to Profile
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
