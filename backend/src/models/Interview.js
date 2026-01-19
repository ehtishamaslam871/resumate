const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  
  // Questions
  questions: [{
    questionId: Number,
    question: String,
    category: String,
    difficulty: String,
    expectedKeywords: [String]
  }],
  
  // Answers and feedback
  answers: [{
    questionId: Number,
    question: String,
    answer: String,
    score: Number,
    feedback: String,
    strengths: [String],
    improvements: [String],
    keywordsCovered: [String],
    keywordsMissed: [String]
  }],
  
  // Tracking
  currentQuestionIndex: { type: Number, default: 0 },
  scores: [Number],
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  
  // Final feedback
  finalFeedback: {
    overallScore: Number,
    performanceLevel: String,
    summary: String,
    topStrengths: [String],
    areasForImprovement: [String],
    recommendation: String,
    detailedFeedback: String
  },
  
  transcriptUrl: String,
  startedAt: Date,
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Interview', interviewSchema);
