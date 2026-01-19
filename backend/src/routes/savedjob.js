const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const SavedJob = require('../models/SavedJob');
const Job = require('../models/Job');

// Apply authentication middleware to all routes
router.use(authMiddleware);

// ==================== GET SAVED JOBS ====================

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let sortObj = { savedDate: -1 };
    if (sort === 'oldest') sortObj = { savedDate: 1 };

    const savedJobs = await SavedJob.find({ user: req.user.id })
      .populate('job')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await SavedJob.countDocuments({ user: req.user.id });

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      savedJobs
    });
  } catch (err) {
    console.error('Get saved jobs error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== SAVE A JOB ====================

router.post('/', async (req, res) => {
  try {
    const { jobId, notes } = req.body;

    // Verify job exists
    const job = await Job.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Check if already saved
    const existingSave = await SavedJob.findOne({
      user: req.user.id,
      job: jobId
    });

    if (existingSave) {
      return res.status(409).json({ message: 'Job already saved' });
    }

    const savedJob = new SavedJob({
      user: req.user.id,
      userId: req.user.id.toString(),
      job: jobId,
      jobId: jobId.toString(),
      jobTitle: job.title,
      companyName: job.company,
      notes: notes || '',
      savedDate: new Date()
    });

    await savedJob.save();

    res.status(201).json({
      message: 'Job saved successfully',
      savedJob
    });
  } catch (err) {
    console.error('Save job error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== UPDATE SAVED JOB ====================

router.put('/:savedJobId', async (req, res) => {
  try {
    const { notes } = req.body;

    const savedJob = await SavedJob.findById(req.params.savedJobId);
    if (!savedJob) return res.status(404).json({ message: 'Saved job not found' });

    if (savedJob.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (notes !== undefined) savedJob.notes = notes;

    await savedJob.save();

    res.json({
      message: 'Saved job updated',
      savedJob
    });
  } catch (err) {
    console.error('Update saved job error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== REMOVE SAVED JOB ====================

router.delete('/:savedJobId', async (req, res) => {
  try {
    const savedJob = await SavedJob.findById(req.params.savedJobId);
    if (!savedJob) return res.status(404).json({ message: 'Saved job not found' });

    if (savedJob.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await SavedJob.findByIdAndDelete(req.params.savedJobId);

    res.json({ message: 'Saved job removed' });
  } catch (err) {
    console.error('Delete saved job error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ==================== CHECK IF JOB IS SAVED ====================

router.get('/check/:jobId', async (req, res) => {
  try {
    const savedJob = await SavedJob.findOne({
      user: req.user.id,
      job: req.params.jobId
    });

    res.json({
      isSaved: !!savedJob,
      savedJob: savedJob || null
    });
  } catch (err) {
    console.error('Check saved job error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
