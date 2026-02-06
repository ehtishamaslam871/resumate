const Application = require('../models/Application');
const Job = require('../models/Job');
const Resume = require('../models/Resume');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getRecommendedJobs, aiShortlistCandidates } = require('../services/matchingService');

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

    // Get resume if provided
    let resume = null;
    if (resumeId) {
      resume = await Resume.findById(resumeId);
    }

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
      message: `${user.name} applied for ${job.title}`,
      relatedApplication: application._id,
      relatedJob: jobId,
      relatedUser: req.user.id,
      actionUrl: `/recruiter/applications/${application._id}`,
      actionLabel: 'View Application'
    });

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

    res.json({
      total: applications.length,
      applications
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
      actionUrl: `/jobs/${application.job}/application/${applicationId}`,
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

    const jobsWithApplicationStatus = recommendedJobs.map(job => ({
      ...job,
      hasApplied: appliedJobIds.includes(job._id.toString())
    }));

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
        aiShortlistScore: candidate.aiScore,
        status: candidate.isShortlisted ? 'shortlisted' : 'reviewing'
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
