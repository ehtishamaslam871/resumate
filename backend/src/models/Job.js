const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
  // Job Details
  title: { type: String, required: true },
  company: { type: String, required: true },
  description: { type: String, required: true },
  requirements: [String],
  
  // Location & Type
  location: String,
  locationType: { type: String, enum: ['on-site', 'remote', 'hybrid'] },
  
  // Compensation
  salaryMin: Number,
  salaryMax: Number,
  currency: { type: String, default: 'USD' },
  
  // Skills Required
  skills: [String],
  requiredSkills: [String], // Keep for backward compatibility
  
  // Job Type
  jobType: {
    type: String,
    enum: ['full-time', 'part-time', 'contract', 'internship'],
    default: 'full-time'
  },
  experienceLevel: {
    type: String,
    enum: ['entry-level', 'mid-level', 'senior', 'lead'],
    default: 'mid-level'
  },
  
  // Recruiter Info
  recruiter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recruiterId: String,
  recruiterName: String,
  recruiterEmail: String,
  
  // Status
  status: {
    type: String,
    enum: ['open', 'closed', 'draft'],
    default: 'open'
  },
  
  // Tracking
  applicantCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  postedDate: { type: Date, default: Date.now },
  deadline: Date,
  
  // Backward compatibility
  salaryRange: { min: Number, max: Number },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
