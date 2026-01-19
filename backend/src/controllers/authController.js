const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Profile = require('../models/Profile');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(409).json({ message: 'User already exists' });

    // Create user (password will be hashed by pre-save hook)
    user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: role?.toLowerCase().replace(' ', '_') || 'job_seeker',
      phone,
      emailVerified: false,
      isActive: true
    });
    
    await user.save();
    
    // Create empty profile for user
    const profile = new Profile({
      user: user._id,
      userId: user._id.toString()
    });
    await profile.save();

    // Generate token
    const token = generateToken(user);
    
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Compare password
    const isValid = await user.comparePassword(password);
    if (!isValid) return res.status(401).json({ message: 'Invalid credentials' });

    // Check if account is active
    if (!user.isActive) return res.status(403).json({ message: 'Account is inactive' });
    if (user.isSuspended) return res.status(403).json({ message: 'Account is suspended' });

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user);
    
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET PROFILE ====================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const profile = await Profile.findOne({ user: req.user.id });

    res.json({
      user,
      profile
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== UPDATE PROFILE ====================
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, headline, bio, location, country, countryCode, ...otherUpdates } = req.body;
    
    // Update user basic info
    const user = await User.findByIdAndUpdate(
      req.user.id,
      {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(headline && { headline }),
        ...(bio && { bio }),
        ...(location && { location }),
        ...(country && { country }),
        ...(countryCode && { countryCode })
      },
      { new: true }
    );

    // Update or create profile
    let profile = await Profile.findOne({ user: req.user.id });
    if (!profile) {
      profile = new Profile({ user: req.user.id, userId: req.user.id.toString() });
    }
    
    Object.assign(profile, otherUpdates);
    profile.lastUpdated = new Date();
    await profile.save();

    res.json({
      user,
      profile
    });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== LOGOUT ====================
exports.logout = async (req, res) => {
  try {
    // Token invalidation happens on frontend
    // Optional: Log user logout activity
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== GOOGLE CALLBACK ====================
exports.googleCallback = async (req, res) => {
  try {
    const user = req.user;
    const token = generateToken(user);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/success?token=${token}`);
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).json({ message: err.message });
  }
};

