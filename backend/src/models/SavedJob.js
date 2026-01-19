const mongoose = require('mongoose');

const savedJobSchema = new mongoose.Schema({
  // User who saved
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: String,
  
  // Job saved
  job: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  jobId: String,
  jobTitle: String,
  companyName: String,
  
  // Notes
  notes: String,
  
  // Tracking
  savedDate: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Ensure one user can only save a job once
savedJobSchema.index({ user: 1, job: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', savedJobSchema);
