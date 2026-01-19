const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const applicationController = require('../controllers/applicationController');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ==================== APPLICANT ROUTES ====================

// Create an application for a job
router.post('/', applicationController.createApplication);

// Get all applications for the current user
router.get('/', applicationController.getUserApplications);

// Get details of a specific application
router.get('/:applicationId', applicationController.getApplication);

// Delete an application (only if status is 'applied')
router.delete('/:applicationId', applicationController.deleteApplication);

// ==================== RECRUITER ROUTES ====================

// Get applications for a specific job (recruiter only)
router.get('/job/:jobId', applicationController.getJobApplications);

// Update application status (recruiter only)
router.put('/:applicationId/status', applicationController.updateApplicationStatus);

module.exports = router;
