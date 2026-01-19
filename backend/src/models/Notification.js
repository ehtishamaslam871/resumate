const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  // User receiving notification
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userId: String,
  
  // Notification Details
  type: {
    type: String,
    enum: [
      'application_received',
      'application_status_updated',
      'job_match',
      'interview_scheduled',
      'message_received',
      'profile_viewed',
      'job_alert',
      'recruiter_interested',
      'system_alert'
    ],
    required: true
  },
  
  title: { type: String, required: true },
  message: { type: String, required: true },
  description: String,
  
  // Related Entity References
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedJob: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job'
  },
  relatedApplication: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application'
  },
  
  // Status
  isRead: { type: Boolean, default: false },
  readDate: Date,
  isArchived: { type: Boolean, default: false },
  
  // Action
  actionUrl: String,
  actionLabel: String,
  
  // Tracking
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date // Auto-delete after this date
}, { timestamps: true });

// Auto-delete old notifications after 30 days
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Notification', notificationSchema);
