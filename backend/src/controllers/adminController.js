const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Resume = require('../models/Resume');
const Interview = require('../models/Interview');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Check if user is admin
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stats = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Application.countDocuments(),
      Resume.countDocuments(),
      Interview.countDocuments(),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'job_seeker' }),
      Application.countDocuments({ status: 'accepted' }),
      Application.countDocuments({ status: 'rejected' }),
      Application.countDocuments({ status: 'pending' }),
    ]);

    const [
      totalUsers,
      totalJobs,
      totalApplications,
      totalResumes,
      totalInterviews,
      recruiters,
      jobSeekers,
      acceptedApplications,
      rejectedApplications,
      pendingApplications,
    ] = stats;

    res.json({
      users: {
        total: totalUsers,
        recruiters,
        jobSeekers,
      },
      jobs: {
        total: totalJobs,
      },
      applications: {
        total: totalApplications,
        accepted: acceptedApplications,
        rejected: rejectedApplications,
        pending: pendingApplications,
      },
      resumes: {
        total: totalResumes,
      },
      interviews: {
        total: totalInterviews,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard statistics' });
  }
};

// Get user management data
exports.getUsers = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { page = 1, limit = 10, role, sortBy = 'createdAt' } = req.query;
    const skip = (page - 1) * limit;
    const query = role ? { role } : {};

    const users = await User.find(query)
      .select('-password')
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// Get application analytics
exports.getApplicationAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const analytics = await Application.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Get applications over time
    const timeline = await Application.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $limit: 30,
      },
    ]);

    // Top jobs by applications
    const topJobs = await Application.aggregate([
      {
        $group: {
          _id: '$jobId',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      {
        $unwind: '$job',
      },
      {
        $project: {
          jobTitle: '$job.title',
          company: '$job.company',
          count: 1,
        },
      },
    ]);

    res.json({
      byStatus: analytics,
      timeline,
      topJobs,
    });
  } catch (error) {
    console.error('Application analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Get job market analytics
exports.getJobMarketAnalytics = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Jobs by type
    const byType = await Job.aggregate([
      {
        $group: {
          _id: '$jobType',
          count: { $sum: 1 },
        },
      },
    ]);

    // Jobs by location
    const byLocation = await Job.aggregate([
      {
        $group: {
          _id: '$location',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Top companies by job postings
    const topCompanies = await Job.aggregate([
      {
        $group: {
          _id: '$company',
          count: { $sum: 1 },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Salary ranges
    const salaryRanges = await Job.aggregate([
      {
        $bucket: {
          groupBy: '$salary',
          boundaries: [0, 30000, 60000, 100000, 150000, 200000],
          default: '200000+',
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      byType,
      byLocation,
      topCompanies,
      salaryRanges,
    });
  } catch (error) {
    console.error('Job market analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch job market analytics' });
  }
};

// Get user activity report
exports.getUserActivity = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;

    const activity = await Application.aggregate([
      {
        $match: { userId: require('mongoose').Types.ObjectId(userId) },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const resumes = await Resume.find({ userId }).lean();
    const interviews = await Interview.find({ userId }).lean();

    res.json({
      applications: activity,
      resumeCount: resumes.length,
      interviewCount: interviews.length,
      lastActive: {
        resumes: resumes[0]?.updatedAt,
        interviews: interviews[0]?.updatedAt,
      },
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ error: 'Failed to fetch user activity' });
  }
};

// Disable/Enable user
exports.toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const targetUser = await User.findById(userId);

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.isActive = !targetUser.isActive;
    await targetUser.save();

    res.json({
      message: `User ${targetUser.isActive ? 'enabled' : 'disabled'}`,
      user: targetUser,
    });
  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

// Get system health
exports.getSystemHealth = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const health = {
      database: {
        status: 'connected',
        timestamp: new Date(),
      },
      api: {
        status: 'running',
        uptime: process.uptime(),
      },
      cache: {
        status: 'available',
        timestamp: new Date(),
      },
    };

    res.json(health);
  } catch (error) {
    console.error('System health error:', error);
    res.status(500).json({ error: 'Failed to fetch system health' });
  }
};

// Admin reset user password
exports.resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const { newPassword } = req.body;

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    targetUser.password = await bcrypt.hash(newPassword, salt);
    await targetUser.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

// Admin change user role
exports.changeUserRole = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { userId } = req.params;
    const { role } = req.body;

    if (!['job_seeker', 'recruiter', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const targetUser = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    ).select('-password');

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Role updated successfully', user: targetUser });
  } catch (error) {
    console.error('Change role error:', error);
    res.status(500).json({ error: 'Failed to change role' });
  }
};

// Get system logs (last N entries)
exports.getSystemLogs = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { limit = 100 } = req.query;

    // This would typically fetch from a logging service
    // For now, returning mock data
    const logs = [
      {
        timestamp: new Date(),
        level: 'info',
        message: 'Application started',
      },
      {
        timestamp: new Date(),
        level: 'info',
        message: 'Database connected',
      },
    ];

    res.json({
      logs: logs.slice(0, limit),
      total: logs.length,
    });
  } catch (error) {
    console.error('System logs error:', error);
    res.status(500).json({ error: 'Failed to fetch system logs' });
  }
};
