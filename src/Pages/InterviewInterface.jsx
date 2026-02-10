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
      <div className="min-h-screen bg-dark-950 text-white flex items-center justify-center">
        <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
        <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>
        <div className="text-center">
          <Loader className="w-16 h-16 animate-spin text-neon-cyan mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Loading Interview...</p>
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
  const progress = ((currentQuestion + 1) / interview.questions.length) * 100;
  const answered = Object.values(feedback).filter(f => f).length;

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-hidden">
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-4xl mx-auto px-6 py-12 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 btn-secondary font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Exit
          </button>
          <div className="flex items-center gap-3 card-glass px-5 py-2 rounded-lg border border-neon-cyan/20">
            <Clock className="w-5 h-5 text-neon-cyan" />
            <span className="text-neon-cyan font-semibold">15 min session</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-4xl font-bold text-gradient">
              Interview Session
            </h2>
            <span className="badge-primary text-sm">
              {answered}/{interview.questions.length} answered
            </span>
          </div>
          <div className="w-full h-3 bg-dark-800/50 rounded-full overflow-hidden border border-dark-600">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-6 bg-red-500/20 border border-red-500/50 rounded-xl flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-300 text-lg">{error}</p>
          </div>
        )}

        {/* Current Question */}
        <div className="card-glass p-10 rounded-2xl mb-10 border border-neon-cyan/20">
          {/* Question Header */}
          <div className="flex items-start gap-4 mb-8">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold flex-shrink-0 text-lg">
              {currentQuestion + 1}
            </div>
            <div className="flex-1">
              <p className="text-gray-400 text-sm mb-2 font-semibold">Question {currentQuestion + 1} of {interview.questions.length}</p>
              <h3 className="text-3xl font-bold text-gray-100">{question.text || question.questionText}</h3>
            </div>
          </div>

          {/* Answer Input */}
          {!feedback[currentQuestion] ? (
            <div className="space-y-6">
              <textarea
                value={answers[currentQuestion] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Type your answer here... (Think clearly and provide a detailed response)"
                className="input-modern w-full h-48 resize-none"
                rows="6"
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400 font-medium">
                  {answers[currentQuestion]?.length || 0} characters
                </span>
                <button
                  onClick={() => handleSubmitAnswer(currentQuestion)}
                  disabled={submitting || !answers[currentQuestion]?.trim()}
                  className={`font-bold transition transform flex items-center gap-2 ${
                    submitting
                      ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed px-6 py-3 rounded-lg'
                      : 'btn-primary px-8 py-3 hover:scale-105'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Evaluating...
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      Submit Answer
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="p-6 bg-neon-green/10 border border-neon-green/50 rounded-xl flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-neon-green flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-neon-green text-lg mb-2">Great answer!</p>
                  <p className="text-gray-300 text-base leading-relaxed">{feedback[currentQuestion]?.feedback || feedback[currentQuestion]}</p>
                </div>
              </div>
              {currentQuestion < interview.questions.length - 1 && (
                <button
                  onClick={() => setCurrentQuestion(currentQuestion + 1)}
                  className="w-full btn-primary py-3 font-bold text-lg"
                >
                  Next Question →
                </button>
              )}
            </div>
          )}
        </div>

        {/* Question Navigator */}
        <div className="card-glass p-8 rounded-2xl mb-10 border border-neon-cyan/20">
          <h3 className="text-sm font-bold text-neon-cyan mb-6 uppercase tracking-wider">Progress ({answered}/{interview.questions.length})</h3>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
            {interview.questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQuestion(i)}
                className={`aspect-square rounded-lg font-bold text-sm transition transform hover:scale-110 ${
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

        {/* Finish Button */}
        {answered === interview.questions.length && (
          <div className="text-center pt-8">
            <button
              onClick={() => navigate(`/interview/${interviewId}/feedback`)}
              className="px-10 py-4 bg-gradient-to-r from-neon-green to-neon-cyan text-dark-950 rounded-lg font-bold text-lg shadow-lg shadow-neon-green/50 hover:shadow-neon-green/70 transition transform hover:scale-105"
            >
              Complete Interview & View Results
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
