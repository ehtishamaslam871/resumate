const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');
const groqService = require('../services/groqService');

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

    const prompt = `Generate 10 technical and behavioral interview questions for a ${job.title} position.
    
Job Description: ${job.description}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Experience Level: ${job.experienceLevel}

For each question, provide:
1. The question
2. Category (Technical or Behavioral)
3. Difficulty (Easy, Medium, Hard)
4. Expected keywords to listen for

Return ONLY valid JSON (no markdown):
{
  "questions": [
    {
      "id": 1,
      "question": "question text",
      "category": "Technical or Behavioral",
      "difficulty": "Easy/Medium/Hard",
      "expectedKeywords": ["keyword1", "keyword2"]
    }
  ]
}`;

    const result = await groqService.parseResume(prompt);

    if (!result.success) {
      return res.status(500).json({ message: 'Failed to generate questions' });
    }

    const questions = result.data.questions || [];

    // Create interview record
    const interview = new Interview({
      candidate: application.applicant,
      job: jobId,
      questions: questions.map((q, idx) => ({
        questionId: idx + 1,
        question: q.question,
        category: q.category,
        difficulty: q.difficulty,
        expectedKeywords: q.expectedKeywords || []
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

    // Get question
    const question = interview.questions.find(q => q.questionId === questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

    console.log(`🤖 Evaluating answer for question ${questionId}`);

    // Evaluate answer using AI
    const evaluationResult = await groqService.evaluateAnswer(
      question.question,
      answer,
      question.expectedKeywords || []
    );

    // Store answer
    const answerData = {
      questionId,
      question: question.question,
      answer,
      score: evaluationResult.data?.score || 0,
      feedback: evaluationResult.data?.feedback || '',
      strengths: evaluationResult.data?.strengths || [],
      improvements: evaluationResult.data?.improvements || [],
      keywordsCovered: evaluationResult.data?.keywordsCovered || [],
      keywordsMissed: evaluationResult.data?.keywordsMissed || []
    };

    interview.answers.push(answerData);
    interview.scores.push(answerData.score);
    interview.currentQuestionIndex = questionId;

    // If all questions answered, mark as completed
    if (interview.answers.length === interview.questions.length) {
      interview.status = 'completed';
      interview.completedAt = new Date();

      // Generate overall feedback
      const feedbackResult = await groqService.generateInterviewFeedback(
        interview.answers,
        interview.scores
      );

      interview.finalFeedback = feedbackResult.data || {
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
      nextQuestion: interview.questions[interview.currentQuestionIndex + 1] || null,
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
      const questionResult = await groqService.generateInterviewQuestions(
        job.description,
        application.resume?.parsedText || ''
      );

      interview = new Interview({
        candidate: application.applicant,
        job: application.job,
        questions: questionResult.data?.questions || [],
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
