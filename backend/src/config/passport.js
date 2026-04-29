const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

const decodeJwtPayload = (jwtToken = '') => {
  try {
    const parts = jwtToken.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(base64 + pad, 'base64').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const getBaseUrl = () => process.env.BASE_URL || 'http://localhost:5000';

// Google OAuth Strategy
if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.GOOGLE_CLIENT_ID !== 'your_google_client_id'
) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${getBaseUrl()}/api/auth/google/callback`,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();

          let user = await User.findOne({
            $or: [{ googleId: profile.id }, ...(email ? [{ email }] : [])],
          });

          if (!user) {
            user = new User({
              name: profile.displayName || email?.split('@')[0] || 'Google User',
              email,
              googleId: profile.id,
              googleEmail: email,
              role: 'job_seeker',
            });
          } else {
            user.googleId = user.googleId || profile.id;
            user.googleEmail = user.googleEmail || email;
          }

          await user.save();
          return done(null, user);
        } catch (err) {
          return done(err, null);
        }
      }
    )
  );
}

// Apple OAuth Strategy (optional)
try {
  // eslint-disable-next-line global-require
  const AppleStrategy = require('passport-apple');
  const applePrivateKey = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

  if (
    process.env.APPLE_CLIENT_ID &&
    process.env.APPLE_TEAM_ID &&
    process.env.APPLE_KEY_ID &&
    applePrivateKey
  ) {
    passport.use(
      new AppleStrategy(
        {
          clientID: process.env.APPLE_CLIENT_ID,
          teamID: process.env.APPLE_TEAM_ID,
          keyID: process.env.APPLE_KEY_ID,
          privateKeyString: applePrivateKey,
          callbackURL: `${getBaseUrl()}/api/auth/apple/callback`,
          passReqToCallback: true,
          scope: ['name', 'email'],
        },
        async (req, accessToken, refreshToken, idToken, profile, done) => {
          try {
            const payload = decodeJwtPayload(idToken) || {};
            const appleId = payload.sub;
            const email = payload.email?.toLowerCase();

            let fullName = 'Apple User';
            if (req.body?.user) {
              try {
                const parsed = JSON.parse(req.body.user);
                const first = parsed?.name?.firstName || '';
                const last = parsed?.name?.lastName || '';
                const composed = `${first} ${last}`.trim();
                if (composed) fullName = composed;
              } catch {
                // ignore malformed optional payload
              }
            }

            let user = await User.findOne({
              $or: [{ appleId }, ...(email ? [{ email }] : [])],
            });

            if (!user) {
              user = new User({
                name: fullName,
                email,
                appleId,
                appleEmail: email,
                role: 'job_seeker',
              });
            } else {
              user.appleId = user.appleId || appleId;
              user.appleEmail = user.appleEmail || email;
              if (user.name === 'Apple User' && fullName !== 'Apple User') {
                user.name = fullName;
              }
            }

            await user.save();
            return done(null, user);
          } catch (err) {
            return done(err, null);
          }
        }
      )
    );
  }
} catch (err) {
  console.warn('passport-apple not installed. Apple login disabled.');
}

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id);
  done(null, user);
});

module.exports = passport;
