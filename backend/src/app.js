const express = require('express');
const cors = require('cors');
const passport = require('passport');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

require('./config/passport'); // Google strategy (optional)

const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const jobRoutes = require('./routes/jobs');
const interviewRoutes = require('./routes/interview');
const applicationRoutes = require('./routes/application');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notification');
const savedJobRoutes = require('./routes/savedjob');
const adminRoutes = require('./routes/admin');
const searchRoutes = require('./routes/search');
const matchingRoutes = require('./routes/matching');

const app = express();

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());

// serve uploads
app.use('/uploads', express.static('uploads'));

// ==================== ROUTES ====================

// Authentication & Profile
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);

// Job & Application Management
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/saved-jobs', savedJobRoutes);

// Resume & Interview
app.use('/api/resume', resumeRoutes);
app.use('/api/interview', interviewRoutes);

// Job Matching
app.use('/api/matching', matchingRoutes);

// Notifications
app.use('/api/notifications', notificationRoutes);

// Admin Dashboard
app.use('/api/admin', adminRoutes);

// Search & Discovery
app.use('/api/search', searchRoutes);

// ==================== HEALTH CHECK ====================
app.get('/', (req, res) => res.json({ 
  status: 'ok', 
  service: 'resumate-node-api',
  version: '2.0',
  endpoints: [
    'POST /api/auth/register - Register new user',
    'POST /api/auth/login - Login user',
    'POST /api/auth/google-callback - Google OAuth',
    'GET /api/profile/me - Get current profile',
    'PUT /api/profile/me - Update profile',
    'GET /api/jobs - List all jobs',
    'POST /api/jobs - Create job (recruiter)',
    'GET /api/applications - Get my applications',
    'POST /api/applications - Apply to job',
    'POST /api/resume - Upload resume',
    'GET /api/resume - Get my resumes',
    'POST /api/interview - Start interview',
    'POST /api/interview/submit-answer - Submit answer',
    'GET /api/saved-jobs - Get saved jobs',
    'POST /api/saved-jobs - Save a job',
    'GET /api/notifications - Get notifications'
  ]
}));

// ==================== FALLBACK 404 ====================
app.use((req, res) => res.status(404).json({ message: 'Endpoint not found' }));

// ==================== ERROR HANDLER ====================
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

module.exports = app;
