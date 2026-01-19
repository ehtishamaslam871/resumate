const Interview = require('../models/Interview');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const geminiService = require('../services/geminiService');

// ==================== START INTERVIEW ====================
exports.startInterview = async (req, res) => {
  try {
    const { jobId, applicationId } = req.body;

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Get user's latest resume
    const resume = await Resume.findOne({ user: req.user.id }).sort({ uploadDate: -1 });
    if (!resume) return res.status(404).json({ message: 'No resume found' });

    // Check if interview already exists
    const existingInterview = await Interview.findOne({
      candidate: req.user.id,
      job: jobId,
      status: { $in: ['in_progress', 'completed'] }
    });

    if (existingInterview && existingInterview.status === 'in_progress') {
      return res.status(400).json({ message: 'Interview already in progress for this job' });
    }

    // Generate interview questions using Gemini
    console.log('🤖 Generating interview questions with Gemini...');
    const questionResult = await geminiService.generateInterviewQuestions(
      job.description || job.title,
      resume.parsedText || 'Resume text not available'
    );

    if (!questionResult.success) {
      return res.status(400).json({ message: 'Failed to generate questions', error: questionResult.error });
    }

    // Format questions
    const formattedQuestions = (questionResult.questions || []).map((q, idx) => ({
      questionId: `q_${idx}`,
      question: q.question || q,
      difficulty: q.difficulty || 'medium',
      expectedKeywords: q.expectedKeywords || []
    }));

    const user = await User.findById(req.user.id);

    const interview = new Interview({
      candidate: req.user.id,
      candidateId: req.user.id.toString(),
      candidateName: user.name,
      
      job: jobId,
      jobId: jobId.toString(),
      jobTitle: job.title,
      companyName: job.company,
      
      application: applicationId || null,
      
      questions: formattedQuestions,
      currentQuestionIndex: 0,
      answers: [],
      scores: [],
      
      status: 'in_progress',
      startedAt: new Date()
    });

    await interview.save();

    // Notify recruiter that interview started
    await Notification.create({
      user: job.recruiter,
      userId: job.recruiterId,
      type: 'interview_started',
      title: 'Interview Started',
      message: `${user.name} has started the interview for ${job.title}`,
      relatedInterview: interview._id,
      relatedUser: req.user.id,
      actionUrl: `/recruiter/interviews/${interview._id}`,
      actionLabel: 'View Interview'
    });

    res.status(201).json({
      message: 'Interview started successfully',
      interview,
      firstQuestion: formattedQuestions[0]
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== SUBMIT ANSWER ====================
exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId, answer } = req.body;

    // Get interview
    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Check authorization
    if (interview.candidate.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    // Get current question
    const currentQuestion = interview.questions[interview.currentQuestionIndex];
    if (!currentQuestion) return res.status(400).json({ message: 'No more questions' });

    // Evaluate answer with Gemini
    console.log('🤖 Evaluating answer with Gemini...');
    const evaluationResult = await geminiService.evaluateAnswer(
      currentQuestion.question,
      answer,
      currentQuestion.expectedKeywords || []
    );

    if (!evaluationResult.success) {
      return res.status(400).json({ message: 'Failed to evaluate answer', error: evaluationResult.error });
    }

    const evaluation = evaluationResult.evaluation;

    // Save answer
    interview.answers.push({
      questionId: currentQuestion.questionId,
      question: currentQuestion.question,
      answer: answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      timestamp: new Date()
    });

    interview.scores.push(evaluation.score);
    interview.currentQuestionIndex += 1;

    // Check if interview is complete
    if (interview.currentQuestionIndex >= interview.questions.length) {
      interview.status = 'completed';
      interview.completedAt = new Date();

      // Calculate metrics
      const avgScore = interview.scores.length > 0 
        ? Math.round(interview.scores.reduce((a, b) => a + b) / interview.scores.length)
        : 0;

      interview.averageScore = avgScore;
      interview.recommendation = avgScore >= 75 ? 'hire' : avgScore >= 60 ? 'maybe' : 'reject';

      // Generate final feedback
      console.log('🤖 Generating final feedback with Gemini...');
      const feedbackResult = await geminiService.generateInterviewFeedback(
        interview.answers,
        interview.scores
      );

      if (feedbackResult.success) {
        interview.finalFeedback = feedbackResult.feedback || '';
        interview.overallReview = feedbackResult.overallReview || '';
      }

      // Update application status if exists
      if (interview.application) {
        await Application.findByIdAndUpdate(interview.application, {
          interviewId: interview._id,
          status: 'interviewed'
        });
      }
    }

    await interview.save();

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      evaluation,
      currentQuestion: interview.currentQuestionIndex,
      totalQuestions: interview.questions.length,
      nextQuestion: interview.questions[interview.currentQuestionIndex] || null,
      interviewComplete: interview.status === 'completed',
      finalFeedback: interview.finalFeedback || null,
      averageScore: interview.averageScore || null
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET INTERVIEW FEEDBACK ====================
exports.getInterviewFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId)
      .populate('job')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Check authorization
    if (interview.candidate._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (interview.status !== 'completed') {
      return res.status(400).json({ message: 'Interview not completed yet' });
    }

    res.json({
      interview,
      feedback: interview.finalFeedback,
      overallReview: interview.overallReview,
      scores: interview.scores,
      averageScore: interview.averageScore,
      recommendation: interview.recommendation,
      questionsAnswered: interview.answers.length,
      totalQuestions: interview.questions.length
    });
  } catch (err) {
    console.error('Get interview feedback error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET USER INTERVIEWS ====================
exports.getUserInterviews = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = { candidate: req.user.id };
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const interviews = await Interview.find(filter)
      .populate('job', 'title company')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Interview.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      interviews
    });
  } catch (err) {
    console.error('Get user interviews error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET RECRUITER INTERVIEW FEEDBACK ====================
exports.getRecruiterFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const interview = await Interview.findById(interviewId)
      .populate('job')
      .populate('candidate', 'name email');

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Verify recruiter owns the job
    const job = await Job.findById(interview.job);
    if (job.recruiter.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      interview,
      feedback: interview.finalFeedback,
      overallReview: interview.overallReview,
      scores: interview.scores,
      averageScore: interview.averageScore,
      recommendation: interview.recommendation,
      answers: interview.answers,
      completedAt: interview.completedAt
    });
  } catch (err) {
    console.error('Get recruiter feedback error:', err);
    res.status(500).json({ message: err.message });
  }
};
