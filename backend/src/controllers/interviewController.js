const Interview = require('../models/Interview');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Application = require('../models/Application');
const Notification = require('../models/Notification');
const modelService = require('../services/modelService');

const DEFAULT_TOTAL_QUESTIONS = 10;
const DEFAULT_ROLE_SPECIFIC_QUESTIONS = 5;

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

const buildFallbackQuestionPools = ({ role, techStack = [], experienceLevel = 'mid-level' }) => {
  const stack = normalizeTechStack(techStack).slice(0, 6);
  const focusA = stack[0] || 'core responsibilities';
  const focusB = stack[1] || 'quality and compliance';
  const focusC = stack[2] || 'stakeholder communication';
  const expLabel = String(experienceLevel || 'mid-level');

  const generalBank = [
    {
      question: `For a ${expLabel} ${role} role, how would you position your strongest value in the first 90 seconds of an interview?`,
      category: 'behavioral',
      difficulty: 'easy',
      expectedKeywords: ['experience', 'motivation', 'impact'],
      sampleAnswer: 'I would briefly summarize my strongest role-relevant wins, quantify impact, and connect my experience to this role requirements in a concise story.'
    },
    {
      question: 'Describe a time you received critical feedback. How did you respond and improve?',
      category: 'behavioral',
      difficulty: 'easy',
      expectedKeywords: ['feedback', 'improvement', 'ownership'],
      sampleAnswer: 'I acknowledged the feedback, clarified expectations, created an improvement plan with checkpoints, and demonstrated measurable improvement in the next delivery cycle.'
    },
    {
      question: 'How do you prioritize tasks when you have tight deadlines and multiple stakeholders?',
      category: 'behavioral',
      difficulty: 'medium',
      expectedKeywords: ['priority', 'communication', 'deadline', 'planning'],
      sampleAnswer: 'I align on business impact, classify tasks by urgency and dependency, communicate trade-offs early, and keep stakeholders updated through short planning cycles.'
    },
    {
      question: `Tell me about a disagreement on your team while delivering ${role} work. How did you resolve it?`,
      category: 'behavioral',
      difficulty: 'medium',
      expectedKeywords: ['communication', 'alignment', 'ownership', 'result'],
      sampleAnswer: 'I focused on shared goals, clarified constraints, proposed options with trade-offs, and aligned on the option that best balanced quality and timeline.'
    },
    {
      question: `How do you break down ambiguous requirements for a ${role} assignment before implementation?`,
      category: 'situational',
      difficulty: 'medium',
      expectedKeywords: ['requirements', 'assumptions', 'scope', 'validation'],
      sampleAnswer: 'I clarify goals and constraints, write assumptions, define milestones, validate scope with stakeholders, and iterate with quick feedback loops.'
    },
    {
      question: 'Describe a project where you had to balance speed and quality. What decision framework did you use?',
      category: 'situational',
      difficulty: 'medium',
      expectedKeywords: ['trade-off', 'risk', 'priority', 'outcome'],
      sampleAnswer: 'I identified must-haves versus nice-to-haves, measured risk impact, shipped incrementally, and used monitoring and rollback plans to protect quality.'
    },
    {
      question: `What does success look like in your first 30-60-90 days as a ${role}?`,
      category: 'general',
      difficulty: 'easy',
      expectedKeywords: ['ramp-up', 'impact', 'collaboration', 'goals'],
      sampleAnswer: 'I focus on understanding systems and team practices first, then deliver scoped wins, and finally drive measurable impact on key project outcomes.'
    },
  ];

  const roleSpecificBank = [
    {
      question: `Walk me through a challenging ${role} assignment where ${focusA} was critical. What trade-offs did you make and why?`,
      category: 'role_specific',
      difficulty: 'medium',
      expectedKeywords: [focusA, 'trade-off', 'decision', 'result'],
      sampleAnswer: `In one assignment, I relied on ${focusA} to deliver a successful outcome. I explained the constraints, my decision process, and the measurable result.`
    },
    {
      question: `A key KPI drops unexpectedly in your ${role} workflow. How would you investigate and resolve it step by step?`,
      category: 'role_specific',
      difficulty: 'medium',
      expectedKeywords: ['root cause', 'data', 'stakeholder communication', 'corrective action'],
      sampleAnswer: 'I would quantify impact, gather evidence, identify likely causes, validate the root cause, implement corrective actions, and communicate progress and outcomes.'
    },
    {
      question: `For a ${expLabel} ${role}, if you had to improve an existing process related to ${focusA}, what metrics would you track and why?`,
      category: 'role_specific',
      difficulty: 'hard',
      expectedKeywords: [focusA, 'metrics', 'performance', 'quality'],
      sampleAnswer: 'I would define baseline metrics for quality, efficiency, and customer impact, then track improvements over time to ensure sustainable results.'
    },
    {
      question: `How would you document and standardize a repeatable procedure for ${focusB} in a ${role} team?`,
      category: 'role_specific',
      difficulty: 'medium',
      expectedKeywords: ['process', 'standardization', 'quality checks', focusB],
      sampleAnswer: 'I would map current steps, define a standard operating procedure, set acceptance criteria, train the team, and review outcomes regularly.'
    },
    {
      question: `What is your approach to quality assurance in a ${role} workflow that depends on ${focusC}?`,
      category: 'role_specific',
      difficulty: 'medium',
      expectedKeywords: [focusC, 'quality checks', 'risk mitigation', 'edge cases'],
      sampleAnswer: 'I use checkpoints, clear quality criteria, and edge-case planning to reduce errors and improve consistency across the workflow.'
    },
    {
      question: `How would you improve turnaround time and consistency in a ${role} process involving ${focusA} and ${focusB}?`,
      category: 'role_specific',
      difficulty: 'hard',
      expectedKeywords: ['bottleneck analysis', 'workflow optimization', 'measurement', 'continuous improvement'],
      sampleAnswer: 'I identify bottlenecks, prioritize high-impact improvements, pilot changes in phases, and validate success with before/after performance data.'
    },
  ];

  return {
    generalQuestions: formatQuestions(generalBank),
    roleSpecificQuestions: formatQuestions(roleSpecificBank).map((q) => ({ ...q, category: 'role_specific' })),
  };
};

const normalizeQuestionText = (value = '') => String(value || '').trim().toLowerCase();

const isTechnicalQuestion = (question = {}, techStack = []) => {
  const category = normalizeQuestionText(question.category || question.type || '');
  const questionText = normalizeQuestionText(question.question || question.questionText || question.text || '');
  const stack = normalizeTechStack(techStack).map((item) => item.toLowerCase());

  const generalHints = ['general', 'behavioral', 'situational', 'culture'];
  const roleSpecificHints = [
    'technical', 'role-specific', 'role specific', 'domain', 'operations',
    'process', 'procedure', 'quality', 'compliance', 'safety', 'inventory',
    'customer', 'patient', 'equipment', 'sales', 'production', 'workflow'
  ];

  if (generalHints.some((hint) => category.includes(hint))) {
    return false;
  }

  if (category) {
    return true;
  }

  if (!questionText) return false;

  if (stack.some((item) => item.length > 1 && questionText.includes(item))) {
    return true;
  }

  return roleSpecificHints.some((hint) => questionText.includes(hint));
};

const mergeUniqueQuestions = (target = [], candidates = [], limit = Infinity) => {
  const seen = new Set(target.map((q) => normalizeQuestionText(q.question)));

  candidates.forEach((candidate) => {
    if (target.length >= limit) return;

    const normalizedQuestion = normalizeQuestionText(candidate?.question || candidate?.questionText || candidate?.text || '');
    if (!normalizedQuestion || seen.has(normalizedQuestion)) return;

    target.push({
      ...candidate,
      question: candidate.question || candidate.questionText || candidate.text || '',
    });
    seen.add(normalizedQuestion);
  });

  return target;
};

const composeInterviewQuestions = ({
  rawQuestions = [],
  role,
  techStack = [],
  experienceLevel = 'mid-level',
  totalCount = DEFAULT_TOTAL_QUESTIONS,
  roleSpecificCount = DEFAULT_ROLE_SPECIFIC_QUESTIONS,
  technicalCount,
}) => {
  const safeTotalCount = Math.max(4, Number(totalCount) || DEFAULT_TOTAL_QUESTIONS);
  const requestedRoleSpecificCount = Number(roleSpecificCount ?? technicalCount);
  const safeRoleSpecificCount = Math.min(
    Math.max(Number.isFinite(requestedRoleSpecificCount) ? requestedRoleSpecificCount : DEFAULT_ROLE_SPECIFIC_QUESTIONS, 1),
    safeTotalCount - 1
  );
  const safeGeneralCount = safeTotalCount - safeRoleSpecificCount;

  const formatted = formatQuestions(rawQuestions);
  const roleSpecificFromAI = formatted.filter((q) => isTechnicalQuestion(q, techStack));
  const generalFromAI = formatted.filter((q) => !isTechnicalQuestion(q, techStack));

  const fallbackPools = buildFallbackQuestionPools({ role, techStack, experienceLevel });

  const selectedGeneral = mergeUniqueQuestions([], generalFromAI, safeGeneralCount);
  mergeUniqueQuestions(selectedGeneral, fallbackPools.generalQuestions, safeGeneralCount);

  const selectedRoleSpecific = mergeUniqueQuestions([], roleSpecificFromAI, safeRoleSpecificCount);
  mergeUniqueQuestions(selectedRoleSpecific, fallbackPools.roleSpecificQuestions, safeRoleSpecificCount);

  const combined = [];
  mergeUniqueQuestions(combined, selectedGeneral, safeGeneralCount);
  mergeUniqueQuestions(combined, selectedRoleSpecific, safeTotalCount);
  mergeUniqueQuestions(combined, fallbackPools.generalQuestions, safeTotalCount);
  mergeUniqueQuestions(combined, fallbackPools.roleSpecificQuestions, safeTotalCount);

  return combined
    .slice(0, safeTotalCount)
    .map((question, idx) => ({
      ...question,
      questionId: idx + 1,
    }));
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
    const targetQuestionCount = DEFAULT_TOTAL_QUESTIONS;
    const targetRoleSpecificCount = DEFAULT_ROLE_SPECIFIC_QUESTIONS;
    const questionResult = await modelService.generateInterviewQuestions(
      job.description || job.title,
      resume.parsedText || 'Resume text not available',
      {
        skills: job.requiredSkills || [],
        experienceLevel: jobExperienceLevel,
        difficulty: mapExperienceToDifficulty(jobExperienceLevel),
        count: targetQuestionCount,
      }
    );

    const rawGeneratedQuestions = questionResult.questions || [];
    const formattedQuestions = composeInterviewQuestions({
      rawQuestions: rawGeneratedQuestions,
      role: job.title || 'Job Role',
      techStack: job.requiredSkills || [],
      experienceLevel: jobExperienceLevel,
      totalCount: targetQuestionCount,
      roleSpecificCount: targetRoleSpecificCount,
    });
    let questionSource = 'ai';

    if (!questionResult.success || rawGeneratedQuestions.length === 0) {
      questionSource = 'fallback';
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
      actionUrl: `/recruiter/interview-report/${interview._id}`,
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
    const { role, techStack, focusAreas, experienceLevel } = req.body;

    if (!role || !String(role).trim()) {
      return res.status(400).json({ message: 'Role is required' });
    }

    const stack = normalizeTechStack(focusAreas || techStack);
    const normalizedExperience = experienceLevel || 'mid-level';
    const targetQuestionCount = DEFAULT_TOTAL_QUESTIONS;
    const targetRoleSpecificCount = DEFAULT_ROLE_SPECIFIC_QUESTIONS;
    const promptRole = [
      `${String(role).trim()} interview practice`,
      `Experience: ${normalizedExperience}`,
      stack.length ? `Focus areas: ${stack.join(', ')}` : 'Focus areas: role responsibilities and domain skills',
    ].join('. ');
    const resumeContext = stack.length
      ? `Skills: ${stack.join(', ')}`
      : 'Skills: communication, problem solving, collaboration';

    const questionResult = await modelService.generateInterviewQuestions(promptRole, resumeContext, {
      skills: stack,
      experienceLevel: normalizedExperience,
      difficulty: mapExperienceToDifficulty(normalizedExperience),
      count: targetQuestionCount,
    });
    const rawGeneratedQuestions = questionResult.questions || [];
    const questions = composeInterviewQuestions({
      rawQuestions: rawGeneratedQuestions,
      role: String(role).trim(),
      techStack: stack,
      experienceLevel: normalizedExperience,
      totalCount: targetQuestionCount,
      roleSpecificCount: targetRoleSpecificCount,
    });
    let questionSource = 'ai';

    if (!questionResult.success || rawGeneratedQuestions.length === 0) {
      questionSource = 'fallback';
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
