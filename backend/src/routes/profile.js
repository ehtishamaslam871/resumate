const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const authController = require('../controllers/authController');

// ==================== PROFILE ROUTES ====================

// Get current user's profile (requires auth)
router.get('/me', authMiddleware, authController.getProfile);

// Update current user's profile (requires auth)
router.put('/me', authMiddleware, authController.updateProfile);

// Get a specific user's public profile (no auth required, but recommended)
router.get('/:userId', async (req, res) => {
  try {
    const User = require('../models/User');
    const Profile = require('../models/Profile');
    
    const user = await User.findById(req.params.userId)
      .select('name email phone role skills experience education company companyRole createdAt');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = await Profile.findOne({ user: req.params.userId })
      .select('-_id -user -__v');

    res.json({
      user,
      profile: profile || {}
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
