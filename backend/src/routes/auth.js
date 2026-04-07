const express = require('express');
const router = express.Router();
const passport = require('passport');
const authController = require('../controllers/authController');

const ensureStrategy = (strategyName, label) => (req, res, next) => {
  if (!passport._strategy(strategyName)) {
    const frontend = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend}/auth?error=${encodeURIComponent(`${label} login is not configured`)}`);
  }
  return next();
};

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/clerk/sync', authController.clerkSync);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
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
