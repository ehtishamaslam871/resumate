const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const modelService = require('../services/modelService');

const evaluateAnswerFallback = (question, answer, expectedKeywords = []) => {
  const normalized = String(answer || '').toLowerCase();
  const wordCount = normalized.split(/\s+/).filter(Boolean).length;
  const keywords = Array.isArray(expectedKeywords) ? expectedKeywords.filter(Boolean) : [];
  const keywordMatches = keywords.filter((k) => normalized.includes(String(k).toLowerCase()));
  const missedKeywords = keywords.filter((k) => !keywordMatches.includes(k));

  const keywordCoverage = keywords.length ? keywordMatches.length / keywords.length : (wordCount >= 40 ? 0.8 : 0.55);
  const depthScore = wordCount >= 90 ? 0.9 : wordCount >= 45 ? 0.7 : wordCount >= 20 ? 0.5 : 0.3;
  const score = Math.min(100, Math.max(35, Math.round((keywordCoverage * 0.65 + depthScore * 0.35) * 100)));

  const strengths = [];
  const improvements = [];

  if (keywordMatches.length) strengths.push(`Covered key topics: ${keywordMatches.join(', ')}`);
  if (wordCount >= 45) strengths.push('Provided a reasonably detailed response.');
  if (!strengths.length) strengths.push('Attempted to address the question directly.');

  if (missedKeywords.length) improvements.push(`Include more role-specific details around: ${missedKeywords.join(', ')}`);
  if (wordCount < 30) improvements.push('Add more depth with specific examples and outcomes.');
  if (!improvements.length) improvements.push('Add quantifiable impact to make your answer stronger.');

  return {
    score,
    feedback: `Fallback evaluation: Your answer shows ${Math.round(keywordCoverage * 100)}% keyword coverage with ${wordCount} words. Focus on concrete examples and measurable impact for stronger interview performance.`,
    strengths,
    improvements,
    keywordsCovered: keywordMatches,
    keywordsMissed: missedKeywords,
  };
};

// ==================== GENERATE INTERVIEW QUESTIONS ====================
exports.generateInterviewQuestions = async (req, res) => {
  try {
    const { jobId, applicationId } = req.body;
    const recruiterID = req.user.id;

    // Verify job and application exist
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const application = await Application.findById(applicationId)
      .populate('resume');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter owns the job
    if (job.recruiter.toString() !== recruiterID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    console.log(`🤖 Generating interview questions for ${job.title}`);

    const resumeText = application.resume?.parsedText || 'Resume text not available';
    const jobDescription = `${job.title}. ${job.description || ''}. Required Skills: ${(job.requiredSkills || []).join(', ')}`;

    const result = await modelService.generateInterviewQuestions(jobDescription, resumeText);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate questions' });
    }

    const questions = result.questions || [];

    // Create interview record
    const interview = new Interview({
      candidate: application.applicant,
      job: jobId,
      questions: questions.map((q, idx) => ({
        questionId: idx + 1,
        question: q.question || q.text || q.questionText,
        category: q.category || q.type,
        difficulty: q.difficulty,
        expectedKeywords: q.expectedKeywords || [],
        sampleAnswer: q.sampleAnswer || q.idealAnswer || ''
      })),
      status: 'pending'
    });

    await interview.save();

    // Update application
    await Application.findByIdAndUpdate(applicationId, {
      interviewStatus: 'scheduled'
    });

    res.json({
      success: true,
      message: 'Interview questions generated successfully',
      interview
    });
  } catch (err) {
    console.error('Generate questions error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== SCHEDULE INTERVIEW ====================
exports.scheduleInterview = async (req, res) => {
  try {
    const { applicationId, interviewDate, interviewLink } = req.body;
    const recruiterID = req.user.id;

    // Get application
    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter
    if (application.recruiter?.toString() !== recruiterID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update application
    await Application.findByIdAndUpdate(applicationId, {
      interviewScheduled: interviewDate,
      interviewStatus: 'scheduled'
    });

    // Get candidate details
    const candidate = await User.findById(application.applicant);
    const job = await Job.findById(application.job);

    // Send notification to candidate
    await Notification.create({
      user: application.applicant,
      type: 'interview_scheduled',
      title: 'Interview Scheduled',
      message: `Interview scheduled for ${job.title} position on ${new Date(interviewDate).toLocaleDateString()}`,
      relatedApplication: applicationId,
      relatedJob: application.job,
      actionUrl: interviewLink,
      actionLabel: 'Join Interview'
    });

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      interviewDate,
      interviewLink
    });
  } catch (err) {
    console.error('Schedule interview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET INTERVIEW FOR CANDIDATE ====================
exports.getCandidateInterview = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const candidateID = req.user.id;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Verify candidate
    if (interview.candidate.toString() !== candidateID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      interview
    });
  } catch (err) {
    console.error('Get interview error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== SUBMIT INTERVIEW ANSWER ====================
exports.submitAnswer = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const { questionId, answer } = req.body;
    const candidateID = req.user.id;

    const interview = await Interview.findById(interviewId);
    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Verify candidate
    if (interview.candidate.toString() !== candidateID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const parsedQuestionId = Number(questionId);
    // Accept both string/number question ids and fallback to question index when possible
    const question = interview.questions.find(
      (q, idx) =>
        q.questionId === parsedQuestionId ||
        q.questionId === questionId ||
        idx === parsedQuestionId - 1 ||
        idx === parsedQuestionId
    );
    if (!question) return res.status(404).json({ message: 'Question not found' });

    console.log(`🤖 Evaluating answer for question ${questionId}`);

    // Evaluate answer using AI (with local fallback)
    const evaluationResult = await modelService.evaluateAnswer(
      question.question,
      answer,
      question.expectedKeywords || []
    );

    const evaluationFromModel = evaluationResult.evaluation || evaluationResult.data || evaluationResult;
    const evaluation = (evaluationResult.success && typeof evaluationFromModel?.score === 'number')
      ? evaluationFromModel
      : evaluateAnswerFallback(question.question, answer, question.expectedKeywords || []);

    if (!evaluationResult.success) {
      console.warn('⚠️ Model evaluation unavailable, using fallback scoring logic.');
    }

    const answerData = {
      questionId: question.questionId,
      question: question.question,
      answer,
      score: evaluation?.score || 0,
      feedback: evaluation?.feedback || '',
      strengths: evaluation?.strengths || [],
      improvements: evaluation?.improvements || [],
      keywordsCovered: evaluation?.keywordsCovered || [],
      keywordsMissed: evaluation?.keywordsMissed || []
    };

    interview.answers.push(answerData);
    interview.scores.push(answerData.score);
    interview.currentQuestionIndex = interview.answers.length;

    // If all questions answered, mark as completed
    if (interview.answers.length === interview.questions.length) {
      interview.status = 'completed';
      interview.completedAt = new Date();

      // Generate overall feedback
      const feedbackResult = await modelService.generateInterviewFeedback(
        interview.answers,
        interview.scores
      );

      interview.finalFeedback = feedbackResult.feedback || feedbackResult.data || {
        overallScore: Math.round(interview.scores.reduce((a, b) => a + b, 0) / interview.scores.length),
        performanceLevel: 'To be determined',
        summary: 'Interview completed',
        topStrengths: [],
        areasForImprovement: [],
        recommendation: 'To be reviewed'
      };
    }

    await interview.save();

    res.json({
      success: true,
      message: 'Answer recorded successfully',
      score: answerData.score,
      feedback: answerData.feedback,
      nextQuestion: interview.questions[interview.currentQuestionIndex] || null,
      progress: `${interview.answers.length}/${interview.questions.length}`
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET INTERVIEW FEEDBACK (RECRUITER) ====================
exports.getInterviewFeedback = async (req, res) => {
  try {
    const { interviewId } = req.params;
    const recruiterID = req.user.id;

    const interview = await Interview.findById(interviewId)
      .populate('candidate', 'name email')
      .populate('job', 'title company');

    if (!interview) return res.status(404).json({ message: 'Interview not found' });

    // Verify recruiter
    const job = await Job.findById(interview.job);
    if (job.recruiter.toString() !== recruiterID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({
      success: true,
      interview,
      feedback: interview.finalFeedback,
      answers: interview.answers
    });
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== SEND INTERVIEW LINK TO CANDIDATE ====================
exports.sendInterviewToCandidate = async (req, res) => {
  try {
    const { applicationId, interviewDate, interviewLink } = req.body;
    const recruiterID = req.user.id;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter
    const job = await Job.findById(application.job);
    if (job.recruiter.toString() !== recruiterID.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get candidate
    const candidate = await User.findById(application.applicant);

    // Create/Get interview
    let interview = await Interview.findOne({
      candidate: application.applicant,
      job: application.job
    });

    if (!interview) {
      // Generate questions first
      const questionResult = await modelService.generateInterviewQuestions(
        job.description,
        application.resume?.parsedText || ''
      );

      interview = new Interview({
        candidate: application.applicant,
        job: application.job,
        questions: (questionResult.questions || []).map((q, idx) => ({
          questionId: idx + 1,
          question: q.question || q.text || q.questionText,
          category: q.category || q.type,
          difficulty: q.difficulty,
          expectedKeywords: q.expectedKeywords || [],
          sampleAnswer: q.sampleAnswer || q.idealAnswer || ''
        })),
        status: 'pending'
      });
      await interview.save();
    }

    // Update interview with scheduling info
    interview.startedAt = interviewDate;
    interview.transcriptUrl = interviewLink;
    interview.status = 'pending';
    await interview.save();

    // Update application
    await Application.findByIdAndUpdate(applicationId, {
      interviewScheduled: interviewDate,
      interviewStatus: 'scheduled'
    });

    // Send notification to candidate
    const notificationMessage = `You have been invited for an interview for the ${job.title} position. 
The interview is scheduled for ${new Date(interviewDate).toLocaleString()}.
Interview Link: ${interviewLink}`;

    await Notification.create({
      user: application.applicant,
      type: 'interview_invitation',
      title: 'Interview Invitation',
      message: notificationMessage,
      relatedApplication: applicationId,
      relatedJob: application.job,
      actionUrl: interviewLink,
      actionLabel: 'Start Interview'
    });

    res.json({
      success: true,
      message: 'Interview link sent to candidate successfully',
      interview
    });
  } catch (err) {
    console.error('Send interview error:', err);
    res.status(500).json({ message: err.message });
  }
};
