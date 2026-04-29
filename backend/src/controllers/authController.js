const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const { createClerkClient, verifyToken } = require('@clerk/backend');
const User = require('../models/User');
const Profile = require('../models/Profile');
const AdminInvite = require('../models/AdminInvite');

const generateToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getFrontendBaseUrl = () => {
  return process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
};

const getSafeUserPayload = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
});

const normalizeRole = (roleValue) => {
  if (!roleValue) return 'job_seeker';
  const cleaned = String(roleValue).toLowerCase().replace(/[\s_-]/g, '');
  if (cleaned === 'recruiter') return 'recruiter';
  if (cleaned === 'admin') return 'admin';
  return 'job_seeker';
};

const normalizePublicRole = (roleValue) => {
  const normalized = normalizeRole(roleValue);
  if (normalized === 'admin') return null;
  return normalized;
};

const redirectWithOAuthSuccess = (res, user) => {
  const token = generateToken(user);
  const encodedUser = encodeURIComponent(Buffer.from(JSON.stringify(getSafeUserPayload(user))).toString('base64'));
  const encodedToken = encodeURIComponent(token);
  return res.redirect(`${getFrontendBaseUrl()}/auth/success?token=${encodedToken}&user=${encodedUser}`);
};

const createMailTransport = () => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

  if (smtpHost && smtpUser && smtpPass) {
    return nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  if (smtpUser && smtpPass) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });
  }

  return null;
};

const sendResetCodeEmail = async ({ to, name, code }) => {
  const transporter = createMailTransport();
  if (!transporter) {
    throw new Error('SMTP is not configured');
  }

  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER;

  await transporter.sendMail({
    from,
    to,
    subject: 'ResuMate Password Reset Code',
    html: `
      <div style="font-family: Inter, Arial, sans-serif; color: #0f172a; line-height: 1.5;">
        <h2 style="margin-bottom: 8px;">Password Reset Request</h2>
        <p>Hi ${name || 'there'},</p>
        <p>Use the code below to reset your password. This code expires in 15 minutes.</p>
        <p style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #06b6d4; margin: 18px 0;">${code}</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <p>ResuMate Team</p>
      </div>
    `,
  });
};

const isStrongPassword = (password = '') => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password)
  );
};

const MAX_RESET_CODE_ATTEMPTS = Number(process.env.RESET_CODE_MAX_ATTEMPTS || 5);
const RESET_CODE_LOCK_MINUTES = Number(process.env.RESET_CODE_LOCK_MINUTES || 15);

const getResetLockMessage = (lockUntil) => {
  const msRemaining = lockUntil.getTime() - Date.now();
  const totalSeconds = Math.max(1, Math.ceil(msRemaining / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `Too many invalid code attempts. Try again in ${minutes}m ${seconds}s or request a new code.`;
  }

  return `Too many invalid code attempts. Try again in ${seconds}s or request a new code.`;
};

// ==================== REGISTER ====================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body;
    const normalizedRole = normalizePublicRole(role);

    if (!normalizedRole) {
      return res.status(403).json({ message: 'Admin self-registration is not allowed' });
    }
    
    // Check if user exists
    let user = await User.findOne({ email: email.toLowerCase() });
    if (user) return res.status(409).json({ message: 'User already exists' });

    // Create user (password will be hashed by pre-save hook)
    user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: normalizedRole,
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

// ==================== CLERK SYNC ====================
exports.clerkSync = async (req, res) => {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      return res.status(500).json({ message: 'Clerk is not configured on server' });
    }

    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
    if (!token) {
      return res.status(401).json({ message: 'Missing Clerk session token' });
    }

    let verified;
    try {
      verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
    } catch (err) {
      return res.status(401).json({ message: 'Invalid Clerk token' });
    }

    const clerkUserId = verified?.sub;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Invalid Clerk token payload' });
    }

    const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
    const clerkUser = await clerkClient.users.getUser(clerkUserId);

    const primaryEmail =
      clerkUser.emailAddresses?.find((e) => e.id === clerkUser.primaryEmailAddressId)?.emailAddress ||
      clerkUser.emailAddresses?.[0]?.emailAddress;

    const email = (primaryEmail || '').toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Clerk account must have an email address' });
    }

    const fullName = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();
    const displayName = fullName || clerkUser.username || email.split('@')[0] || 'User';
    const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || undefined;
    const desiredRole = normalizePublicRole(req.body?.role);
    if (!desiredRole) {
      return res.status(403).json({ message: 'Admin self-registration is not allowed' });
    }

    let user = await User.findOne({ $or: [{ clerkId: clerkUserId }, { email }] });
    if (!user) {
      user = new User({
        clerkId: clerkUserId,
        name: displayName,
        email,
        role: desiredRole,
        phone,
        emailVerified: true,
        isActive: true,
      });
    } else {
      user.clerkId = user.clerkId || clerkUserId;
      user.email = user.email || email;
      user.name = user.name || displayName;
      user.phone = user.phone || phone;
      if (!user.role) user.role = desiredRole;
      if (!user.emailVerified) user.emailVerified = true;
    }

    await user.save();

    let profile = await Profile.findOne({ user: user._id });
    if (!profile) {
      profile = new Profile({ user: user._id, userId: user._id.toString() });
      await profile.save();
    }

    const appToken = generateToken(user);
    return res.json({ token: appToken, user: getSafeUserPayload(user) });
  } catch (err) {
    console.error('Clerk sync error:', err);
    return res.status(500).json({ message: err.message || 'Unable to sync Clerk user' });
  }
};

// ==================== LOGIN ====================
exports.login = async (req, res) => {
  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    const password = req.body?.password || '';

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    // Some users are created through social auth and do not have a local password.
    if (!user.password) {
      return res.status(401).json({ message: 'This account does not have a password. Use social sign-in or reset your password.' });
    }

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

// ==================== FORGOT PASSWORD ====================
exports.requestPasswordReset = async (req, res) => {
  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    if (!email || !email.includes('@')) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    const genericMessage = 'If an account exists for this email, a reset code has been sent.';
    const user = await User.findOne({ email });

    if (!user) {
      return res.json({ message: genericMessage });
    }

    const resetCode = String(Math.floor(100000 + Math.random() * 900000));
    const codeHash = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = codeHash;
    user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000);
    user.resetPasswordFailedAttempts = 0;
    user.resetPasswordLockUntil = undefined;
    await user.save();

    try {
      await sendResetCodeEmail({
        to: user.email,
        name: user.name,
        code: resetCode,
      });
      return res.json({ message: genericMessage });
    } catch (mailErr) {
      console.error('Password reset email error:', mailErr.message);
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ message: 'Unable to send reset code. Please try again later.' });
      }

      return res.json({
        message: `${genericMessage} (Dev mode: using on-screen code)`,
        devResetCode: resetCode,
      });
    }
  } catch (err) {
    console.error('Request password reset error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const email = (req.body?.email || '').toLowerCase().trim();
    const code = (req.body?.code || '').trim();
    const newPassword = req.body?.newPassword || '';

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: 'Email, code, and new password are required' });
    }

    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 chars with uppercase, lowercase, number, and special character',
      });
    }

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    if (user.resetPasswordLockUntil && user.resetPasswordLockUntil.getTime() > Date.now()) {
      return res.status(429).json({ message: getResetLockMessage(user.resetPasswordLockUntil) });
    }

    if (user.resetPasswordLockUntil && user.resetPasswordLockUntil.getTime() <= Date.now()) {
      user.resetPasswordLockUntil = undefined;
      user.resetPasswordFailedAttempts = 0;
    }

    if (user.resetPasswordExpires.getTime() < Date.now()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      user.resetPasswordFailedAttempts = 0;
      user.resetPasswordLockUntil = undefined;
      await user.save();
      return res.status(400).json({ message: 'Reset code expired. Request a new one.' });
    }

    const submittedHash = crypto.createHash('sha256').update(code).digest('hex');
    if (submittedHash !== user.resetPasswordToken) {
      const failedAttempts = (user.resetPasswordFailedAttempts || 0) + 1;
      user.resetPasswordFailedAttempts = failedAttempts;

      if (failedAttempts >= MAX_RESET_CODE_ATTEMPTS) {
        user.resetPasswordFailedAttempts = 0;
        user.resetPasswordLockUntil = new Date(Date.now() + RESET_CODE_LOCK_MINUTES * 60 * 1000);
        await user.save();

        return res.status(429).json({
          message: `Too many invalid code attempts. Reset is temporarily locked for ${RESET_CODE_LOCK_MINUTES} minutes.`,
        });
      }

      await user.save();
      return res.status(400).json({ message: 'Invalid or expired reset code' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordFailedAttempts = 0;
    user.resetPasswordLockUntil = undefined;
    await user.save();

    res.json({ message: 'Password reset successful. Please sign in with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
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
    return redirectWithOAuthSuccess(res, req.user);
  } catch (err) {
    console.error('Google callback error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== APPLE CALLBACK ====================
exports.appleCallback = async (req, res) => {
  try {
    return redirectWithOAuthSuccess(res, req.user);
  } catch (err) {
    console.error('Apple callback error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== OAUTH FAILURE ====================
exports.oauthFailure = async (req, res) => {
  return res.redirect(`${getFrontendBaseUrl()}/auth?error=${encodeURIComponent('Social login failed. Please try again.')}`);
};

// ==================== CLAIM ADMIN INVITE ====================
exports.claimAdminInvite = async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim();
    if (!token) {
      return res.status(400).json({ message: 'Invite token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'User is already an admin' });
    }

    const email = String(user.email || '').toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ message: 'User email is required to claim admin invite' });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const now = new Date();

    const invite = await AdminInvite.findOneAndUpdate(
      {
        tokenHash,
        email,
        usedAt: null,
        revokedAt: null,
        expiresAt: { $gt: now },
      },
      {
        $set: {
          usedAt: now,
          usedBy: user._id,
        },
      },
      { new: true }
    );

    if (!invite) {
      return res.status(400).json({ message: 'Invalid, expired, revoked, or already used invite token' });
    }

    user.role = 'admin';
    await user.save();

    const appToken = generateToken(user);

    return res.json({
      message: 'Admin access granted successfully',
      token: appToken,
      user: getSafeUserPayload(user),
    });
  } catch (err) {
    console.error('Claim admin invite error:', err);
    return res.status(500).json({ message: err.message || 'Unable to claim admin invite' });
  }
};

