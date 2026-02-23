const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');
const jobController = require('../controllers/jobController');

// Recruiter only (specific paths before parameterized)
router.get('/recruiter/my-jobs', authMiddleware, roleMiddleware('recruiter'), jobController.getRecruiterJobs);

// Public
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);

// Recruiter only
router.post('/', authMiddleware, roleMiddleware('recruiter'), jobController.createJob);
router.put('/:id', authMiddleware, roleMiddleware('recruiter'), jobController.updateJob);
router.delete('/:id', authMiddleware, roleMiddleware('recruiter'), jobController.deleteJob);

module.exports = router;
