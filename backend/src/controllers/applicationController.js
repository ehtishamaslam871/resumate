const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Notification = require('../models/Notification');
const { getRecommendedJobs, aiShortlistCandidates, calculateMatchScore } = require('../services/matchingService');
const fs = require('fs');
const path = require('path');

const resolveResumeFileCandidates = (filename) => {
  if (!filename) return [];
  return [
    path.resolve(__dirname, '../../uploads', filename),
    path.resolve(__dirname, '../../../uploads', filename),
  ];
};

const resumeFileExists = (resumeDoc) => {
  if (!resumeDoc?.filename) return false;
  const candidates = resolveResumeFileCandidates(resumeDoc.filename);
  return candidates.some((filePath) => fs.existsSync(filePath));
};

const getExistingResumeFilePath = (resumeDoc) => {
  if (!resumeDoc?.filename) return null;
  const candidates = resolveResumeFileCandidates(resumeDoc.filename);
  return candidates.find((filePath) => fs.existsSync(filePath)) || null;
};

const normalizeInterviewReport = (interviewDoc) => {
  const feedback = interviewDoc?.finalFeedback;
  const feedbackObject = feedback && typeof feedback === 'object' ? feedback : null;
  const feedbackText = typeof feedback === 'string' ? feedback : '';

  const overallScoreRaw = feedbackObject?.overallScore ?? interviewDoc?.averageScore;
  const overallScore = Number.isFinite(Number(overallScoreRaw)) ? Number(overallScoreRaw) : null;

  const recommendation = feedbackObject?.recommendation || interviewDoc?.recommendation || null;
  const summary = feedbackObject?.summary || feedbackText || interviewDoc?.overallReview || '';

  return {
    interviewId: interviewDoc?._id,
    title: interviewDoc?.jobTitle || 'Practice Interview',
    completedAt: interviewDoc?.completedAt || interviewDoc?.createdAt,
    overallScore,
    performanceLevel: feedbackObject?.performanceLevel || null,
    recommendation,
    summary,
    detailedFeedback: feedbackObject?.detailedFeedback || interviewDoc?.overallReview || '',
  };
};

const buildPracticeInterviewSnapshot = async (candidateId, reportLimit = 5) => {
  const userId = candidateId?.toString();
  if (!userId) {
    return {
      stats: { totalCount: 0, completedCount: 0, averageScore: null, latestCompletedAt: null },
      reports: []
    };
  }

  const [totalCount, completedInterviews] = await Promise.all([
    Interview.countDocuments({ candidate: userId, sessionType: 'mock' }),
    Interview.find({ candidate: userId, sessionType: 'mock', status: 'completed' })
      .select('jobTitle completedAt createdAt averageScore recommendation finalFeedback overallReview')
      .sort({ completedAt: -1, createdAt: -1 })
      .limit(Math.max(reportLimit, 20))
      .lean()
  ]);

  const reports = completedInterviews
    .slice(0, reportLimit)
    .map((doc) => normalizeInterviewReport(doc));

  const scorePool = completedInterviews
    .map((doc) => {
      const normalized = normalizeInterviewReport(doc);
      return Number.isFinite(normalized.overallScore) ? normalized.overallScore : null;
    })
    .filter((score) => score != null);

  const averageScore = scorePool.length
    ? Math.round(scorePool.reduce((sum, score) => sum + score, 0) / scorePool.length)
    : null;

  const latestCompletedAt = completedInterviews[0]?.completedAt || completedInterviews[0]?.createdAt || null;

  return {
    stats: {
      totalCount,
      completedCount: completedInterviews.length,
      averageScore,
      latestCompletedAt,
    },
    reports,
  };
};

// ==================== CREATE APPLICATION ====================
exports.createApplication = async (req, res) => {
  try {
    const { jobId, resumeId, coverLetter, portfolio, linkedin, website } = req.body;

    // Get job details
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check if already applied
    const existingApp = await Application.findOne({
      job: jobId,
      applicant: req.user.id
    });
    if (existingApp) return res.status(409).json({ message: 'Already applied to this job' });

    // Get user details
    const user = await User.findById(req.user.id);

    // Get resume (prefer selected resume, fallback to latest resume)
    let resume = null;
    if (resumeId) {
      resume = await Resume.findOne({ _id: resumeId, user: req.user.id });
    }
    if (!resume) {
      resume = await Resume.findOne({ user: req.user.id }).sort({ uploadDate: -1, createdAt: -1 });
    }

    if (resume && !resumeFileExists(resume)) {
      const candidateResumes = await Resume.find({ user: req.user.id }).sort({ uploadDate: -1, createdAt: -1 });
      const fallbackResume = candidateResumes.find((doc) => resumeFileExists(doc));
      if (fallbackResume) {
        resume = fallbackResume;
      } else {
        return res.status(400).json({
          message: 'Selected resume file is not available. Please re-upload your resume and apply again.'
        });
      }
    }

    const normalizedResumeScore = Number(resume?.score);
    const resumeScore = Number.isFinite(normalizedResumeScore) ? normalizedResumeScore : null;

    const practiceInterviewSnapshot = await buildPracticeInterviewSnapshot(req.user.id);

    // Create application
    const application = new Application({
      job: jobId,
      jobId: jobId.toString(),
      jobTitle: job.title,
      companyName: job.company,
      
      applicant: req.user.id,
      applicantId: req.user.id.toString(),
      applicantName: user.name,
      applicantEmail: user.email,
      applicantPhone: user.phone,
      
      resume: resume?._id,
      resumeUrl: resume?.url,
      resumeId: resume?._id ? resume._id.toString() : undefined,
      resumeScore,
      practiceInterviewStats: practiceInterviewSnapshot.stats,
      practiceInterviewReports: practiceInterviewSnapshot.reports,
      
      coverLetter,
      portfolio,
      linkedin,
      website,
      
      status: 'applied',
      appliedDate: new Date()
    });

    await application.save();

    // Update job applicant count
    job.applicantCount = (job.applicantCount || 0) + 1;
    await job.save();

    // Create notification for recruiter
    await Notification.create({
      user: job.recruiter,
      userId: job.recruiterId,
      type: 'application_received',
      title: 'New Application Received',
      message: `${user.name} applied for ${job.title} (Resume score: ${resumeScore ?? 'N/A'} | Practice interviews: ${practiceInterviewSnapshot.stats.completedCount})`,
      relatedApplication: application._id,
      relatedJob: jobId,
      relatedUser: req.user.id,
      actionUrl: '/recruiter',
      actionLabel: 'View Application'
    });

    // Auto-score: Calculate match score between resume and job
    try {
      if (resume) {
        const matchResult = calculateMatchScore(resume, job);
        const normalizedMatchScore = Number(matchResult.totalScore);
        application.aiScore = Number.isFinite(normalizedMatchScore) ? normalizedMatchScore : resumeScore;
        application.matchBreakdown = matchResult.breakdown;
        application.matchedSkills = matchResult.matchedSkills;
        application.missingSkills = matchResult.missingSkills;

        if (application.aiScore == null && resumeScore != null) {
          application.aiScore = resumeScore;
        }

        // Auto-shortlist if score >= 80
        if ((application.aiScore || 0) >= 80) {
          application.status = 'shortlisted';
          application.aiRecommendation = 'Strong fit — auto-shortlisted';

          // Notify recruiter about high-quality candidate
          await Notification.create({
            user: job.recruiter,
            userId: job.recruiterId,
            type: 'application_received',
            title: 'Top Candidate Auto-Shortlisted',
            message: `${user.name} scored ${application.aiScore}% for ${job.title} and has been auto-shortlisted`,
            relatedApplication: application._id,
            relatedJob: jobId,
            relatedUser: req.user.id,
            actionUrl: '/recruiter',
            actionLabel: 'Review Candidate'
          });

          // Notify candidate that the application was shortlisted
          await Notification.create({
            user: req.user.id,
            userId: req.user.id.toString(),
            type: 'application_status_updated',
            title: 'Application Shortlisted',
            message: `Great news! Your application for ${job.title} was auto-shortlisted with a ${application.aiScore}% score.`,
            relatedApplication: application._id,
            relatedJob: jobId,
            actionUrl: '/profile',
            actionLabel: 'View Application'
          });
        } else {
          application.aiRecommendation = (application.aiScore || 0) >= 60 ? 'Good fit' : 'Average fit';
        }

        await application.save();
      }
    } catch (scoreErr) {
      console.error('Auto-scoring failed (non-blocking):', scoreErr.message);
    }

    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (err) {
    console.error('Create application error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET USER APPLICATIONS ====================
exports.getUserApplications = async (req, res) => {
  try {
    const { status, sort } = req.query;

    const filter = { applicant: req.user.id };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('job')
      .populate('resume')
      .sort(sort === 'newest' ? { appliedDate: -1 } : { appliedDate: -1 })
      .limit(100);

    res.json({
      total: applications.length,
      applications
    });
  } catch (err) {
    console.error('Get user applications error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET JOB APPLICATIONS (RECRUITER) ====================
exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { status, sort } = req.query;

    // Verify recruiter owns this job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const filter = { job: jobId };
    if (status) filter.status = status;

    const applications = await Application.find(filter)
      .populate('applicant')
      .populate('resume')
      .sort(sort === 'newest' ? { appliedDate: -1 } : { appliedDate: -1 });

    const practiceSnapshotCache = new Map();

    const normalizedApplications = await Promise.all(applications.map(async (doc) => {
      const app = doc.toObject();
      const parsedResumeScore = Number(app.resume?.score);
      const resolvedResumeScore = Number.isFinite(parsedResumeScore) ? parsedResumeScore : null;

      if (app.resumeScore == null && resolvedResumeScore != null) {
        app.resumeScore = resolvedResumeScore;
      }
      if (app.aiScore == null && app.resumeScore != null) {
        app.aiScore = app.resumeScore;
      }
      if (!app.aiReasoning && app.aiScore != null && app.resumeScore != null && app.aiScore === app.resumeScore) {
        app.aiReasoning = 'Score sourced from parsed resume analysis.';
      }

      const hasPracticeStats = app.practiceInterviewStats && (
        Number.isFinite(Number(app.practiceInterviewStats.totalCount)) ||
        Number.isFinite(Number(app.practiceInterviewStats.completedCount))
      );

      if (!hasPracticeStats) {
        const applicantId = app.applicant?._id?.toString?.() || app.applicant?.toString?.() || app.applicantId;
        if (applicantId) {
          if (!practiceSnapshotCache.has(applicantId)) {
            practiceSnapshotCache.set(applicantId, await buildPracticeInterviewSnapshot(applicantId));
          }
          const snapshot = practiceSnapshotCache.get(applicantId);
          app.practiceInterviewStats = snapshot.stats;
          app.practiceInterviewReports = snapshot.reports;
        }
      }

      return app;
    }));

    res.json({
      total: normalizedApplications.length,
      applications: normalizedApplications
    });
  } catch (err) {
    console.error('Get job applications error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== UPDATE APPLICATION STATUS ====================
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status, feedback, rating } = req.body;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Verify recruiter owns this job
    const job = await Job.findById(application.job);
    if (job.recruiter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update application
    application.status = status;
    if (feedback) application.recruiterFeedback = feedback;
    if (rating) application.recruiterRating = rating;
    application.reviewedDate = new Date();
    await application.save();

    // Create notification for applicant
    const statusMessages = {
      'reviewing': 'Your application is being reviewed',
      'shortlisted': 'Congratulations! You\'ve been shortlisted',
      'rejected': 'Your application status has been updated',
      'accepted': 'Congratulations! Your application has been accepted'
    };

    await Notification.create({
      user: application.applicant,
      userId: application.applicantId,
      type: 'application_status_updated',
      title: 'Application Status Updated',
      message: statusMessages[status] || `Application status: ${status}`,
      relatedApplication: applicationId,
      relatedJob: application.job,
      actionUrl: '/profile',
      actionLabel: 'View Details'
    });

    res.json({
      message: 'Application updated successfully',
      application
    });
  } catch (err) {
    console.error('Update application status error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET APPLICATION DETAIL ====================
exports.getApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId)
      .populate('job')
      .populate('applicant')
      .populate('resume');

    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Check authorization (applicant or recruiter of the job)
    const job = await Job.findById(application.job);
    const isApplicant = application.applicant._id.toString() === req.user.id;
    const isRecruiter = job.recruiter.toString() === req.user.id;

    if (!isApplicant && !isRecruiter) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ application });
  } catch (err) {
    console.error('Get application detail error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET APPLICATION RESUME FILE ====================
exports.getApplicationResumeFile = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId).populate('resume');
    if (!application) return res.status(404).json({ message: 'Application not found' });

    const isApplicant = application.applicant?.toString() === req.user.id.toString();
    let isRecruiter = false;

    if (!isApplicant) {
      const job = await Job.findById(application.job).select('recruiter');
      isRecruiter = !!job && job.recruiter?.toString() === req.user.id.toString();
    }

    if (!isApplicant && !isRecruiter) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let resume = application.resume;
    if (!resume || !resume.filename) {
      if (!application.resume) {
        return res.status(404).json({ message: 'Resume not linked with this application' });
      }
      resume = await Resume.findById(application.resume);
    }

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const filePath = getExistingResumeFilePath(resume);
    if (!filePath) {
      return res.status(404).json({ message: 'Resume file not found on server' });
    }

    const mimeType = resume.mimeType || 'application/octet-stream';
    const safeFileName = (resume.originalName || `resume-${application._id}`)
      .replace(/[\r\n"]/g, '')
      .trim() || `resume-${application._id}`;

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${safeFileName}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');

    return res.sendFile(filePath);
  } catch (err) {
    console.error('Get application resume file error:', err);
    return res.status(500).json({ message: err.message });
  }
};

// ==================== DELETE APPLICATION ====================
exports.deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: 'Application not found' });

    // Only applicant can delete
    if (application.applicant.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only if status is 'applied'
    if (application.status !== 'applied') {
      return res.status(400).json({ message: 'Cannot delete application with this status' });
    }

    await Application.findByIdAndDelete(applicationId);

    // Update job applicant count
    await Job.findByIdAndUpdate(application.job, { $inc: { applicantCount: -1 } });

    res.json({ message: 'Application deleted successfully' });
  } catch (err) {
    console.error('Delete application error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET RECOMMENDED JOBS FOR JOB SEEKER ====================
exports.getRecommendedJobs = async (req, res) => {
  try {
    const jobSeekerID = req.user.id;

    // Get job seeker's latest resume
    const resume = await Resume.findOne({ user: jobSeekerID }).sort({ uploadDate: -1 });

    if (!resume) {
      return res.status(400).json({ message: 'Please upload a resume first to get job recommendations' });
    }

    // Get all open jobs
    const openJobs = await Job.find({ status: 'open' })
      .populate('recruiter', 'name email')
      .limit(100);

    // Get recommended jobs with match scores
    const recommendedJobs = getRecommendedJobs(resume, openJobs);

    // Check which jobs user has already applied to
    const appliedJobIds = (await Application.find({ applicant: jobSeekerID }).distinct('job')).map(id => id.toString());

    const jobsWithApplicationStatus = recommendedJobs.map(job => {
      const matchData = job.matchData || {};
      return {
        ...job,
        matchScore: matchData.totalScore || 0,
        breakdown: matchData.breakdown || { skills: 0, experience: 0, location: 0 },
        matchedSkills: matchData.matchedSkills || [],
        missingSkills: matchData.missingSkills || [],
        hasApplied: appliedJobIds.includes(job._id.toString())
      };
    });

    res.json({
      success: true,
      totalJobs: jobsWithApplicationStatus.length,
      jobs: jobsWithApplicationStatus
    });
  } catch (err) {
    console.error('Get recommended jobs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== AI SHORTLIST CANDIDATES FOR JOB ====================
exports.aiShortlistApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { topN = 5 } = req.body;

    // Verify recruiter owns this job
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });
    if (job.recruiter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Get all applications for this job
    const applications = await Application.find({ job: jobId })
      .populate('applicant')
      .populate('resume');

    if (applications.length === 0) {
      return res.json({
        success: true,
        message: 'No applications yet',
        shortlistedCandidates: []
      });
    }

    console.log(`Starting AI shortlisting for ${job.title} with ${applications.length} candidates`);

    // Run AI shortlisting
    const shortlistedCandidates = await aiShortlistCandidates(applications, job, topN);

    // Update applications with AI scores
    for (const candidate of shortlistedCandidates) {
      await Application.findByIdAndUpdate(candidate._id, {
        aiScore: candidate.aiScore,
        aiReasoning: candidate.aiReasoning,
        aiStrengths: candidate.aiStrengths || [],
        aiGaps: candidate.aiGaps || [],
        aiRecommendation: candidate.recommendation || 'To be reviewed',
        status: candidate.isShortlisted ? 'shortlisted' : 'reviewing'
      });

      // Notify shortlisted candidates
      if (candidate.isShortlisted) {
        try {
          await Notification.create({
            user: candidate.applicant?._id || candidate.applicant,
            type: 'application_status_updated',
            title: 'You\'ve Been Shortlisted!',
            message: `Your application for ${job.title} has been shortlisted with a ${candidate.aiScore}% match score`,
            relatedApplication: candidate._id,
            relatedJob: jobId,
            actionUrl: '/profile',
            actionLabel: 'View Application'
          });
        } catch (notifErr) {
          console.error('Failed to send shortlist notification:', notifErr.message);
        }
      }
    }

    // Notify recruiter with summary
    const shortlistedCount = shortlistedCandidates.filter(c => c.isShortlisted).length;
    if (shortlistedCount > 0) {
      await Notification.create({
        user: req.user.id,
        type: 'system_alert',
        title: 'AI Shortlisting Complete',
        message: `${shortlistedCount} candidates shortlisted for ${job.title} out of ${applications.length} applicants`,
        relatedJob: jobId,
        actionUrl: '/recruiter',
        actionLabel: 'View Results'
      });
    }

    res.json({
      success: true,
      message: `AI shortlisted ${shortlistedCandidates.length} candidates`,
      shortlistedCandidates: shortlistedCandidates.map(c => ({
        _id: c._id,
        applicantName: c.applicantName,
        applicantEmail: c.applicantEmail,
        aiScore: c.aiScore,
        aiReasoning: c.aiReasoning,
        aiStrengths: c.aiStrengths,
        aiGaps: c.aiGaps,
        recommendation: c.recommendation
      }))
    });
  } catch (err) {
    console.error('AI shortlist error:', err);
    res.status(500).json({ message: err.message });
  }
};
