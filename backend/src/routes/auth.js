const express = require('express');
const router = express.Router();
const passport = require('passport');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

const ensureStrategy = (strategyName, label) => (req, res, next) => {
  if (!passport._strategy(strategyName)) {
    const frontend = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend}/auth?error=${encodeURIComponent(`${label} login is not configured`)}`);
  }
  return next();
};

const createAuthRateLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => res.status(429).json({ message }),
  });

const forgotPasswordLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many reset-code requests. Please try again in 15 minutes.',
});

const resetPasswordLimiter = createAuthRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many password reset attempts. Please try again in 15 minutes.',
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/clerk/sync', authController.clerkSync);
router.post('/admin/claim', authMiddleware, authController.claimAdminInvite);
router.post('/forgot-password', forgotPasswordLimiter, authController.requestPasswordReset);
router.post('/reset-password', resetPasswordLimiter, authController.resetPassword);
router.get('/oauth/failure', authController.oauthFailure);

// Google OAuth
router.get('/google', ensureStrategy('google', 'Google'), passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback',
  ensureStrategy('google', 'Google'),
  passport.authenticate('google', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  authController.googleCallback
);

// Apple OAuth
router.get('/apple', ensureStrategy('apple', 'Apple'), passport.authenticate('apple'));
router.get(
  '/apple/callback',
  ensureStrategy('apple', 'Apple'),
  passport.authenticate('apple', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  authController.appleCallback
);
router.post(
  '/apple/callback',
  ensureStrategy('apple', 'Apple'),
  passport.authenticate('apple', { session: false, failureRedirect: '/api/auth/oauth/failure' }),
  authController.appleCallback
);

module.exports = router;
