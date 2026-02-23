const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');
const applicationController = require('../controllers/applicationController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ==================== JOB SEEKER ROUTES ====================

// Get recommended jobs for job seeker based on resume
router.get('/recommendations/jobs', roleMiddleware('jobseeker'), applicationController.getRecommendedJobs);

// Get all applications for the current user (job seeker)
router.get('/', roleMiddleware('jobseeker'), applicationController.getUserApplications);

// Create an application for a job (job seeker only)
router.post('/', roleMiddleware('jobseeker'), applicationController.createApplication);

// Get details of a specific application
router.get('/:applicationId', applicationController.getApplication);

// Delete/withdraw an application (job seeker only, status must be 'applied')
router.delete('/:applicationId', roleMiddleware('jobseeker'), applicationController.deleteApplication);

// ==================== RECRUITER ROUTES ====================

// Get applications for a specific job (recruiter only)
router.get('/job/:jobId', roleMiddleware('recruiter'), applicationController.getJobApplications);

// AI Shortlist applications for a job (recruiter only)
router.post('/:jobId/shortlist', roleMiddleware('recruiter'), applicationController.aiShortlistApplications);

// Update application status (recruiter only)
router.put('/:applicationId/status', roleMiddleware('recruiter'), applicationController.updateApplicationStatus);

module.exports = router;
