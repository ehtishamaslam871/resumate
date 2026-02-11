const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware } = require('../middlewares/auth');

// All admin routes require authentication
router.use(authMiddleware);

// Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/dashboard/health', adminController.getSystemHealth);
router.get('/dashboard/logs', adminController.getSystemLogs);

// User Management
router.get('/users', adminController.getUsers);
router.patch('/users/:userId/toggle-status', adminController.toggleUserStatus);
router.patch('/users/:userId/reset-password', adminController.resetUserPassword);
router.patch('/users/:userId/change-role', adminController.changeUserRole);
router.get('/users/:userId/activity', adminController.getUserActivity);

// Analytics
router.get('/analytics/applications', adminController.getApplicationAnalytics);
router.get('/analytics/job-market', adminController.getJobMarketAnalytics);

module.exports = router;
