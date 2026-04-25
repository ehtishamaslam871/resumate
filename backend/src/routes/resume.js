const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authMiddleware } = require('../middlewares/auth');
const roleMiddleware = require('../middlewares/role');
const resumeController = require('../controllers/resumeController');

const uploadDir = path.resolve(__dirname, '../../uploads');
const upload = multer({ dest: uploadDir });

// Job Seeker only — resume operations
router.post('/upload', authMiddleware, roleMiddleware('jobseeker'), upload.single('resume'), resumeController.uploadResume);
router.get('/', authMiddleware, roleMiddleware('jobseeker'), resumeController.getUserResumes);
router.get('/:id', authMiddleware, resumeController.getResume);
router.put('/:id', authMiddleware, roleMiddleware('jobseeker'), resumeController.updateResume);
router.delete('/:id', authMiddleware, roleMiddleware('jobseeker'), resumeController.deleteResume);

module.exports = router;
