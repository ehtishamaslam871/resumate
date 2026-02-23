// Role-based access control middleware for backend routes
const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const userRole = (req.user.role || '').toLowerCase().replace(/[\s_]/g, '');
    const normalized = allowedRoles.map(r => r.toLowerCase().replace(/[\s_]/g, ''));

    if (!normalized.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = roleMiddleware;
