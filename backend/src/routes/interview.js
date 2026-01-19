const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const interviewController = require('../controllers/interviewController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// ==================== CANDIDATE ROUTES ====================

// Start a new interview for a job
router.post('/start', interviewController.startInterview);

// Submit an answer to an interview question
router.post('/submit-answer', interviewController.submitAnswer);

// Get interview feedback (candidate)
router.get('/feedback/:interviewId', interviewController.getInterviewFeedback);

// Get all interviews for the current user
router.get('/my-interviews', interviewController.getUserInterviews);

// ==================== RECRUITER ROUTES ====================

// Get interview feedback (recruiter)
router.get('/recruiter/feedback/:interviewId', interviewController.getRecruiterFeedback);

module.exports = router;
