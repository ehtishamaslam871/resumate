const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true },
  email: { type: String, unique: true, sparse: true, lowercase: true },
  password: { type: String },
  phone: { type: String },
  
  // Role & Auth
  role: {
    type: String,
    enum: ['job_seeker', 'recruiter', 'admin'],
    default: 'job_seeker'
  },
  
  // OAuth
  googleId: String,
  googleEmail: String,
  
  // Profile
  profilePicture: String,
  headline: String,
  bio: String,
  location: String,
  country: String,
  countryCode: String,
  
  // Job Seeker Specific
  skills: [String],
  experience: [{
    jobTitle: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    field: String,
    year: String
  }],
  
  // Recruiter Specific
  companyName: String,
  companySize: String,
  industry: String,
  website: String,
  
  // Account Status
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  emailVerified: { type: Boolean, default: false },
  
  // Tracking
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    this.password = await bcrypt.hash(this.password, 10);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model('User', userSchema);
