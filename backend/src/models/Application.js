const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Job & Applicant
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobId: String,
  jobTitle: String,
  companyName: String,
  
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicantId: String,
  applicantName: String,
  applicantEmail: String,
  applicantPhone: String,
  
  // Resume Used
  resume: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume'
  },
  resumeUrl: String,
  resumeId: String,
  
  // Application Details
  coverLetter: String,
  portfolio: String,
  linkedin: String,
  website: String,
  
  // Status
  status: {
    type: String,
    enum: ['applied', 'reviewing', 'shortlisted', 'rejected', 'accepted'],
    default: 'applied'
  },
  
  // Feedback
  recruiterFeedback: String,
  recruiterRating: { type: Number, min: 1, max: 5 },
  
  // Interview
  interviewScheduled: Date,
  interviewStatus: {
    type: String,
    enum: ['pending', 'scheduled', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Tracking
  appliedDate: { type: Date, default: Date.now },
  reviewedDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
