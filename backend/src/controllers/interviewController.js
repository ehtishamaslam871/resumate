const Interview = require('../models/Interview');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const modelService = require('../services/modelService');

const normalizeTechStack = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value)
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const mapExperienceToDifficulty = (experienceLevel = '') => {
  const normalized = String(experienceLevel).toLowerCase();
  if (normalized.includes('high') || normalized.includes('senior') || normalized.includes('expert') || normalized.includes('lead')) {
    return 'hard';
  }
  if (normalized.includes('mid') || normalized.includes('intermediate')) {
    return 'medium';
  }
  if (normalized.includes('low') || normalized.includes('entry') || normalized.includes('junior') || normalized.includes('beginner')) {
    return 'easy';
  }
  return 'mixed';
};

const buildSuggestedAnswerFallback = (question = '', expectedKeywords = []) => {
  const keywords = Array.isArray(expectedKeywords)
    ? expectedKeywords.map((k) => String(k).trim()).filter(Boolean).slice(0, 5)
    : [];

  const keywordsLine = keywords.length
    ? `Mention concrete details around: ${keywords.join(', ')}.`
    : 'Mention specific tools, decisions, and measurable impact.';

  return `A strong answer should follow STAR: briefly set context, explain your actions and trade-offs, then quantify the result. ${keywordsLine}`;
};

const evaluateAnswerFallback = (question, answer, expectedKeywords = []) => {
  const normalized = String(answer || '').toLowerCase();
  const words = normalized.split(/\s+/).filter(Boolean);
  const keywords = Array.isArray(expectedKeywords) ? expectedKeywords.filter(Boolean) : [];
  const covered = keywords.filter((k) => normalized.includes(String(k).toLowerCase()));
  const missed = keywords.filter((k) => !covered.includes(k));

  const coverage = keywords.length ? covered.length / keywords.length : (words.length >= 40 ? 0.75 : 0.55);
  const depth = words.length >= 90 ? 0.9 : words.length >= 45 ? 0.7 : words.length >= 20 ? 0.5 : 0.3;
  const score = Math.min(100, Math.max(35, Math.round((coverage * 0.65 + depth * 0.35) * 100)));

  return {
    score,
    feedback: `Fallback evaluation: Your response has ${Math.round(coverage * 100)}% keyword coverage and ${words.length} words. Improve by using specific examples and measurable outcomes.`,
    strengths: covered.length ? [`Covered important terms: ${covered.join(', ')}`] : ['Addressed the question directly.'],
    improvements: missed.length ? [`Add details on: ${missed.join(', ')}`] : ['Quantify impact to make your answer stronger.'],
    keywordsCovered: covered,
    keywordsMissed: missed,
  };
};

const formatQuestions = (rawQuestions = []) => {
  return rawQuestions
    .map((q, idx) => ({
      questionId: idx + 1,
      question: q?.question || q?.questionText || q?.text || String(q || '').trim(),
      category: q?.category || q?.type || 'general',
      difficulty: q?.difficulty || 'medium',
      expectedKeywords: Array.isArray(q?.expectedKeywords) ? q.expectedKeywords : [],
      sampleAnswer: q?.sampleAnswer || q?.idealAnswer || ''
    }))
    .filter((q) => q.question);
};

const buildFallbackQuestions = ({ role, techStack = [], experienceLevel = 'mid-level', count = 5 }) => {
  const stack = normalizeTechStack(techStack).slice(0, 6);
  const focusA = stack[0] || 'problem solving';
  const focusB = stack[1] || 'system design';
  const expLabel = String(experienceLevel || 'mid-level');

  const bank = [
    {
      question: `For a ${expLabel} ${role} role, how would you position your strongest value in the first 90 seconds of an interview?`,
      category: 'behavioral',
      difficulty: 'easy',
      expectedKeywords: ['experience', 'motivation', 'impact'],
      sampleAnswer: 'I would briefly summarize my strongest role-relevant wins, quantify impact, and connect my experience to this role requirements in a concise story.'
    },
    {
      question: `Walk me through a challenging ${role} project where you used ${focusA}. What trade-offs did you make and why?`,
      category: 'technical',
      difficulty: 'medium',
      expectedKeywords: [focusA, 'trade-off', 'decision', 'result'],
      sampleAnswer: `In one project, I used ${focusA} to deliver core functionality quickly, then balanced speed vs maintainability by extracting reusable modules and documenting constraints.`
    },
    {
      question: `You are on-call for a ${role} feature built with ${focusB}. How would you debug a production issue step by step?`,
      category: 'situational',
      difficulty: 'medium',
      expectedKeywords: [focusB, 'logs', 'hypothesis', 'root cause'],
      sampleAnswer: 'I would first assess impact, collect logs/metrics, form hypotheses, reproduce the issue in a controlled environment, validate the root cause, then deploy and monitor a fix.'
    },
    {
      question: 'Describe a time you received critical feedback. How did you respond and improve?',
      category: 'behavioral',
      difficulty: 'easy',
      expectedKeywords: ['feedback', 'improvement', 'ownership'],
      sampleAnswer: 'I acknowledged the feedback, clarified expectations, created an improvement plan with checkpoints, and demonstrated measurable improvement in the next delivery cycle.'
    },
    {
      question: `For a ${expLabel} ${role}, if you had to improve an existing feature built with ${focusA}, what metrics would you track and why?`,
      category: 'technical',
      difficulty: 'hard',
      expectedKeywords: [focusA, 'metrics', 'performance', 'quality'],
      sampleAnswer: 'I would track user-facing latency, failure rate, conversion/engagement metrics, and maintainability indicators to ensure both product and engineering quality improve.'
    },
    {
      question: 'How do you prioritize tasks when you have tight deadlines and multiple stakeholders?',
      category: 'behavioral',
      difficulty: 'medium',
      expectedKeywords: ['priority', 'communication', 'deadline', 'planning'],
      sampleAnswer: 'I align on business impact, classify tasks by urgency and dependency, communicate trade-offs early, and keep stakeholders updated through short planning cycles.'
    },
  ];

  return formatQuestions(bank.slice(0, Math.max(3, Number(count) || 5)));
};

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

    // Generate interview questions using local model, with template fallback
    console.log('🤖 Generating interview questions with local Llama model...');
    const jobExperienceLevel = job.experienceLevel || job.level || job.seniority || 'mid-level';
    const questionResult = await modelService.generateInterviewQuestions(
      job.description || job.title,
      resume.parsedText || 'Resume text not available',
      {
        skills: job.requiredSkills || [],
        experienceLevel: jobExperienceLevel,
        difficulty: mapExperienceToDifficulty(jobExperienceLevel),
        count: 5,
      }
    );

    let formattedQuestions = formatQuestions(questionResult.questions || []);
    let questionSource = 'ai';

    if (!questionResult.success || formattedQuestions.length === 0) {
      questionSource = 'fallback';
      formattedQuestions = buildFallbackQuestions({
        role: job.title || 'Job Role',
        techStack: job.requiredSkills || [],
        experienceLevel: jobExperienceLevel,
        count: 5,
      });
      console.warn('Interview question generation fell back to template set:', questionResult.error || 'empty AI response');
    }

    const user = await User.findById(req.user.id);

    const interview = new Interview({
      candidate: req.user.id,
      sessionType: 'job_application',
      job: jobId,
      jobTitle: job.title,
      companyName: job.company,
      recruiterName: job.recruiterName || '',
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
      firstQuestion: formattedQuestions[0],
      questionSource
    });
  } catch (err) {
    console.error('Start interview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== CREATE MOCK INTERVIEW ====================
exports.createMockInterview = async (req, res) => {
  try {
    const { role, techStack, experienceLevel, questionCount = 5 } = req.body;

    if (!role || !String(role).trim()) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const stack = normalizeTechStack(techStack);
    const normalizedExperience = experienceLevel || 'mid-level';
    const promptRole = [
      `${String(role).trim()} interview practice`,
      `Experience: ${normalizedExperience}`,
      stack.length ? `Tech stack: ${stack.join(', ')}` : 'Tech stack: general',
    ].join('. ');
    const resumeContext = stack.length
      ? `Skills: ${stack.join(', ')}`
      : 'Skills: communication, problem solving, collaboration';

    const questionResult = await modelService.generateInterviewQuestions(promptRole, resumeContext, {
      skills: stack,
      experienceLevel: normalizedExperience,
      difficulty: mapExperienceToDifficulty(normalizedExperience),
      count: Math.max(3, Number(questionCount) || 5),
    });
    let questions = formatQuestions(
      (questionResult.questions || []).slice(0, Math.max(3, Number(questionCount) || 5))
    );
    let questionSource = 'ai';

    if (!questionResult.success || questions.length === 0) {
      questionSource = 'fallback';
      questions = buildFallbackQuestions({
        role: String(role).trim(),
        techStack: stack,
        experienceLevel: normalizedExperience,
        count: questionCount,
      });
      console.warn('Mock interview question generation fell back to template set:', questionResult.error || 'empty AI response');
    }

    const interview = new Interview({
      candidate: req.user.id,
      sessionType: 'mock',
      jobTitle: String(role).trim(),
      companyName: 'Mock Interview',
      experienceLevel: normalizedExperience,
      techStack: stack,
      durationMinutes: 15,
      questions,
      status: 'pending',
      currentQuestionIndex: 0,
      answers: [],
      scores: []
    });

    await interview.save();

    res.status(201).json({
      success: true,
      message: 'Mock interview created successfully',
      interview,
      questionSource
    });
  } catch (err) {
    console.error('Create mock interview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== START PENDING INTERVIEW SESSION ====================
exports.startInterviewSession = async (req, res) => {
  try {
    const { interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    if (interview.candidate.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (interview.status === 'completed') {
      return res.status(400).json({ message: 'Interview already completed' });
    }

    if (!interview.startedAt) {
      interview.startedAt = new Date();
    }
    interview.status = 'in_progress';

    await interview.save();

    res.json({
      success: true,
      message: 'Interview session started',
      interview
    });
  } catch (err) {
    console.error('Start interview session error:', err);
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
    if (interview.candidate.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (interview.status !== 'in_progress') {
      return res.status(400).json({ message: 'Interview is not in progress' });
    }

    // Get current question
    const currentQuestion = interview.questions[interview.currentQuestionIndex];
    if (!currentQuestion) return res.status(400).json({ message: 'No more questions' });

    // Evaluate answer with local Llama model
    console.log('🤖 Evaluating answer with local Llama model...');
    const evaluationResult = await modelService.evaluateAnswer(
      currentQuestion.question,
      answer,
      currentQuestion.expectedKeywords || []
    );

    const evaluationFromModel = evaluationResult.evaluation || evaluationResult.data || evaluationResult;
    const evaluation = (evaluationResult.success && typeof evaluationFromModel?.score === 'number')
      ? evaluationFromModel
      : evaluateAnswerFallback(currentQuestion.question, answer, currentQuestion.expectedKeywords || []);

    if (!evaluationResult.success) {
      console.warn('⚠️ Model evaluation unavailable, using fallback scoring logic.');
    }

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
      console.log('🤖 Generating final feedback with local Llama model...');
      const feedbackResult = await modelService.generateInterviewFeedback(
        interview.answers,
        interview.scores
      );

      if (feedbackResult.success) {
        interview.finalFeedback = feedbackResult.feedback || '';
        interview.overallReview = feedbackResult.overallReview || '';
      } else {
        interview.finalFeedback = {
          overallScore: avgScore,
          performanceLevel: avgScore >= 80 ? 'strong' : avgScore >= 60 ? 'moderate' : 'needs_improvement',
          summary: 'Final feedback generated using local fallback summary.',
          topStrengths: ['Completed all interview questions.'],
          areasForImprovement: ['Add more concrete, measurable examples.'],
          recommendation: avgScore >= 75 ? 'hire' : avgScore >= 60 ? 'maybe' : 'reject',
          detailedFeedback: 'Model server was unavailable during final feedback generation. This is a heuristic summary.'
        };
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
    if (interview.candidate._id.toString() !== req.user.id.toString()) {
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
      reportQuestions: (interview.questions || []).map((q, idx) => {
        const answer = (interview.answers || []).find((a) => a.questionId === q.questionId) || interview.answers?.[idx] || null;
        return {
          questionId: q.questionId,
          question: q.question,
          difficulty: q.difficulty,
          expectedKeywords: q.expectedKeywords || [],
          sampleAnswer: q.sampleAnswer || buildSuggestedAnswerFallback(q.question, q.expectedKeywords || []),
          userAnswer: answer?.answer || '',
          score: answer?.score ?? null,
          feedback: answer?.feedback || '',
          strengths: answer?.strengths || [],
          improvements: answer?.improvements || [],
        };
      }),
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
      .sort({ createdAt: -1 })
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
    if (job.recruiter.toString() !== req.user.id.toString()) {
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
