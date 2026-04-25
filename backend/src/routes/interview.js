const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const interviewController = require('../controllers/interviewController');
const interviewScheduleController = require('../controllers/interviewScheduleController');

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

// Create a standalone mock interview session
router.post('/mock/create', interviewController.createMockInterview);

// Start a pending interview session
router.post('/:interviewId/start-session', interviewController.startInterviewSession);

// Resolve interview by application for recruiter workflow
router.get('/by-application/:applicationId', interviewScheduleController.getInterviewByApplication);

// Get interview for candidate
router.get('/:interviewId', interviewScheduleController.getCandidateInterview);

// Submit answer to interview question
router.post('/:interviewId/answer', interviewScheduleController.submitAnswer);

// ==================== RECRUITER ROUTES ====================

// Generate interview questions for a candidate
router.post('/generate-questions', interviewScheduleController.generateInterviewQuestions);

// Schedule interview for candidate
router.post('/schedule', interviewScheduleController.scheduleInterview);

// Send interview link to candidate
router.post('/send-to-candidate', interviewScheduleController.sendInterviewToCandidate);

// Get interview feedback (recruiter)
router.get('/recruiter/feedback/:interviewId', interviewScheduleController.getInterviewFeedback);

module.exports = router;
