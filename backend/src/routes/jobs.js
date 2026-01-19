const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const jobController = require('../controllers/jobController');

router.post('/', authMiddleware, jobController.createJob);
router.get('/', jobController.listJobs);
router.get('/:id', jobController.getJob);

module.exports = router;
