const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const jobController = require('../controllers/jobController');

router.post('/', authMiddleware, jobController.createJob);
router.get('/recruiter/my-jobs', authMiddleware, jobController.getRecruiterJobs);
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);
router.put('/:id', authMiddleware, jobController.updateJob);
router.delete('/:id', authMiddleware, jobController.deleteJob);

module.exports = router;
