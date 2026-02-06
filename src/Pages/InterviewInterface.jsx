import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewAPI } from '../services/api';
import { Loader, AlertCircle, CheckCircle, ArrowLeft, Mic, Clock } from 'lucide-react';

export default function InterviewInterface() {
  const { interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({});

  useEffect(() => {
    fetchInterview();
  }, [interviewId]);

  const fetchInterview = async () => {
    try {
      setLoading(true);
      const response = await interviewAPI.getInterview(interviewId);
      if (response.success) {
        setInterview(response.interview);
        const initialAnswers = {};
        response.interview.questions?.forEach((_, i) => {
          initialAnswers[i] = response.interview.answers?.[i]?.answerText || '';
        });
        setAnswers(initialAnswers);
      } else {
        setError(response.message || 'Failed to load interview');
      }
    } catch (err) {
      console.error('Error fetching interview:', err);
      setError('Error loading interview');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, text) => {
    setAnswers(prev => ({ ...prev, [questionIndex]: text }));
  };

  const handleSubmitAnswer = async (questionIndex) => {
    const answer = answers[questionIndex];
    if (!answer.trim()) {
      alert('Please enter an answer');
      return;
    }

    try {
      setSubmitting(true);
      const response = await interviewAPI.submitInterviewAnswer(interviewId, questionIndex, answer);
      if (response.success) {
        setFeedback(prev => ({ ...prev, [questionIndex]: response.evaluation }));
        setTimeout(() => {
          if (questionIndex < interview.questions.length - 1) {
            setCurrentQuestion(questionIndex + 1);
          }
        }, 2000);
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading Interview...</p>
        </div>
      </div>
    );
  }

  if (!interview?.questions) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center text-white">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Interview Not Found</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 px-6 py-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const question = interview.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / interview.questions.length) * 100;
  const answered = Object.values(feedback).filter(f => f).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white overflow-hidden">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-500/10 to-cyan-500/20 rounded-full blur-3xl"></div>
      </div>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-700/50 rounded-lg hover:bg-gray-800/40 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit Interview
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span>15 min session</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Interview Session
            </h2>
            <span className="text-gray-400">
              {answered}/{interview.questions.length} answered
            </span>
          </div>
          <div className="w-full h-2 bg-gray-800/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Current Question */}
        <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-8 rounded-2xl mb-8 shadow-lg shadow-cyan-500/10">
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
              {currentQuestion + 1}
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-1">Question {currentQuestion + 1} of {interview.questions.length}</p>
              <h3 className="text-2xl font-bold text-white">{question.text || question.questionText}</h3>
            </div>
          </div>

          {/* Answer Input */}
          {!feedback[currentQuestion] ? (
            <div className="space-y-4">
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Type your answer here... (Think clearly and provide a detailed response)"
                className="w-full p-4 bg-gray-700/50 border border-gray-600/30 rounded-lg focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition text-white placeholder-gray-500 resize-none"
                rows="6"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">
                  {answers[currentQuestion]?.length || 0} characters
                </span>
                <button
                  onClick={() => handleSubmitAnswer(currentQuestion)}
                  disabled={submitting || !answers[currentQuestion]?.trim()}
                  className={`px-8 py-3 rounded-lg font-semibold transition transform hover:scale-105 flex items-center gap-2 ${
                    submitting
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 hover:shadow-lg hover:shadow-cyan-500/50'
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
              <div className="p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-400">Great answer!</p>
                  <p className="text-green-300 text-sm mt-2 leading-relaxed">{feedback[currentQuestion]?.feedback || feedback[currentQuestion]}</p>
                </div>
              </div>
              {currentQuestion < interview.questions.length - 1 && (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
                >
                  Next Question →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Question Navigator */}
        <div className="bg-gray-800/40 backdrop-blur border border-gray-700/50 p-6 rounded-2xl mb-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-4 uppercase tracking-wide">Progress ({answered}/{interview.questions.length})</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {interview.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`aspect-square rounded-lg font-semibold text-sm transition ${
                  currentQuestion === i
                    ? 'bg-gradient-to-br from-cyan-500 to-teal-500 text-gray-900 ring-2 ring-cyan-400'
                    : feedback[i]
                    ? 'bg-green-500/30 text-green-400 border border-green-500/50'
                    : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Finish Button */}
        {answered === interview.questions.length && (
          <div className="text-center">
            <button
              onClick={() => navigate(`/interview/${interviewId}/feedback`)}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-gray-900 rounded-lg font-semibold hover:shadow-lg hover:shadow-green-500/50 transition transform hover:scale-105"
            >
              Complete Interview & View Results
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
