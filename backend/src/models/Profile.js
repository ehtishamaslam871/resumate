const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  // Link to User
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  userId: String,
  
  // Profile Fields
  profilePicture: String,
  coverImage: String,
  headline: String,
  bio: String,
  location: String,
  country: String,
  countryCode: String,
  timezone: String,
  
  // Social Links
  linkedin: String,
  github: String,
  portfolio: String,
  twitter: String,
  website: String,
  
  // Job Seeker Profile
  currentPosition: String,
  currentCompany: String,
  yearsOfExperience: Number,
  careerObjectives: String,
  
  // Skills & Endorsements
  skills: [{
    name: String,
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'] },
    endorsements: { type: Number, default: 0 }
  }],
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],
  
  // Recruiter Profile
  companyName: String,
  companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
  industry: String,
  companyWebsite: String,
  companyLogo: String,
  companyDescription: String,
  
  // Preferences
  jobPreferences: {
    desiredJobTitles: [String],
    preferredLocations: [String],
    preferredJobTypes: [String],
    expectedSalaryMin: Number,
    expectedSalaryMax: Number,
    currency: { type: String, default: 'USD' },
    openToRemote: Boolean,
    openToRelocate: Boolean
  },
  
  // Recruiter Preferences
  hiringPreferences: {
    focusAreas: [String],
    budgetMin: Number,
    budgetMax: Number,
    preferredCandidateLevel: [String]
  },
  
  // Metrics
  viewCount: { type: Number, default: 0 },
  connectionCount: { type: Number, default: 0 },
  endorsementCount: { type: Number, default: 0 },
  
  // Visibility & Privacy
  isPublic: { type: Boolean, default: true },
  showEmail: { type: Boolean, default: false },
  showPhone: { type: Boolean, default: false },
  
  // Tracking
  lastUpdated: { type: Date, default: Date.now },
  profileCompletionPercentage: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Profile', profileSchema);
