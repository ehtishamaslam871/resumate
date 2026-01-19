const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authMiddleware } = require('../middlewares/auth');
const resumeController = require('../controllers/resumeController');

const upload = multer({ dest: 'uploads/' });

// Get all user resumes
router.get('/', authMiddleware, resumeController.getUserResumes);

// Get a specific resume
router.get('/:id', authMiddleware, resumeController.getResume);

// Upload a new resume
router.post('/upload', authMiddleware, upload.single('resume'), resumeController.uploadResume);

// Update resume
router.put('/:id', authMiddleware, resumeController.updateResume);

// Delete resume
router.delete('/:id', authMiddleware, resumeController.deleteResume);

module.exports = router;
