const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userId: String,
  originalName: String,
  filename: String,
  url: String,
  fileSize: Number,
  mimeType: String,
  
  // Parsed data
  parsedText: String,
  isParsed: { type: Boolean, default: false },
  
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
    improvements: [String],
    experience: [Object],
    education: [Object]
  },
  
  aiModel: String, // 'gemini-1.5-pro-latest', 'gpt-4', etc.
  isDefault: { type: Boolean, default: false },
  
  // Metadata
  uploadDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resume', resumeSchema);
