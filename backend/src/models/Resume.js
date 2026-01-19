const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: String,
  url: String,
  
  // Parsed data
  parsedText: String,
  
  // Extracted information
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
  
  skills: [String],
  score: { type: Number, default: 0 },
  
  // AI Analysis
  aiAnalysis: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    strengths: [String],
    improvements: [String]
  },
  
  aiModel: String, // 'gemini-pro', 'gpt-4', etc.
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
