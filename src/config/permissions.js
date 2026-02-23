// ==================== Centralized RBAC Configuration ====================

export const ROLES = {
  JOB_SEEKER: 'jobseeker',
  RECRUITER: 'recruiter',
  ADMIN: 'admin',
};

// What each role can access
export const ROLE_PERMISSIONS = {
  [ROLES.JOB_SEEKER]: {
    label: 'Job Seeker',
    allowedRoutes: ['/upload', '/analysis', '/jobs', '/job', '/chatbot', '/profile', '/services', '/contact', '/about'],
    blockedRoutes: ['/recruiter', '/admin'],
    navItems: [
      { name: 'Home', path: '/' },
      { name: 'Upload', path: '/upload', action: 'upload' },
      { name: 'Jobs', path: '/jobs' },
      { name: 'Services', path: '/services' },
      { name: 'Contact', path: '/contact' },
      { name: 'About', path: '/about' },
    ],
    capabilities: [
      'upload_resume', 'view_score', 'search_jobs', 'apply_jobs',
      'use_chatbot', 'view_analysis', 'edit_profile',
    ],
    defaultRedirect: '/',
    dashboardRoute: '/',
  },

  [ROLES.RECRUITER]: {
    label: 'Recruiter',
    allowedRoutes: ['/recruiter', '/services', '/contact', '/about', '/profile'],
    blockedRoutes: ['/upload', '/analysis', '/jobs', '/job', '/chatbot', '/admin'],
    navItems: [
      { name: 'Dashboard', path: '/recruiter' },
      { name: 'Services', path: '/services' },
      { name: 'Contact', path: '/contact' },
      { name: 'About', path: '/about' },
    ],
    capabilities: [
      'post_jobs', 'edit_jobs', 'delete_jobs', 'view_applicants',
      'approve_applications', 'reject_applications', 'shortlist_applications',
      'ai_shortlist', 'view_applicant_resume', 'edit_profile',
    ],
    defaultRedirect: '/recruiter',
    dashboardRoute: '/recruiter',
  },

  [ROLES.ADMIN]: {
    label: 'Admin',
    allowedRoutes: ['/admin', '/services', '/contact', '/about', '/profile'],
    blockedRoutes: ['/upload', '/analysis', '/jobs', '/job', '/chatbot', '/recruiter'],
    navItems: [
      { name: 'Dashboard', path: '/admin' },
      { name: 'Services', path: '/services' },
      { name: 'Contact', path: '/contact' },
      { name: 'About', path: '/about' },
    ],
    capabilities: [
      'manage_users', 'manage_jobs', 'manage_applications',
      'view_analytics', 'moderate_content', 'system_settings',
      'view_all_resumes', 'edit_profile',
    ],
    defaultRedirect: '/admin',
    dashboardRoute: '/admin',
  },
};

// Guest nav items (not logged in)
export const GUEST_NAV_ITEMS = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'Contact', path: '/contact' },
  { name: 'About', path: '/about' },
];

// ==================== Helper Functions ====================

export const getUserRole = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      return normalizeRole(user.role);
    }
    const oldData = localStorage.getItem('resumate_user');
    if (oldData) {
      const user = JSON.parse(oldData);
      return normalizeRole(user.role);
    }
  } catch (e) { /* ignore */ }
  return null;
};

// Normalize role strings from backend/localStorage
function normalizeRole(role) {
  if (!role) return 'jobseeker';
  const r = role.toLowerCase().replace(/[\s_]/g, '');
  if (r === 'admin') return 'admin';
  if (r === 'recruiter') return 'recruiter';
  return 'jobseeker'; // job_seeker, job seeker, jobseeker → jobseeker
}

export const isAuthenticated = () => !!localStorage.getItem('authToken');

export const getRoleConfig = (role) => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[ROLES.JOB_SEEKER];

export const hasPermission = (capability) => {
  const role = getUserRole();
  if (!role) return false;
  return getRoleConfig(role).capabilities.includes(capability);
};

export const canAccessRoute = (path) => {
  const role = getUserRole();
  if (!role) return false;
  const config = getRoleConfig(role);
  if (config.blockedRoutes.some(r => path.startsWith(r))) return false;
  if (config.allowedRoutes.some(r => path.startsWith(r))) return true;
  return true; // allow shared routes like /, /auth
};

export const getDefaultRedirect = () => {
  const role = getUserRole();
  if (!role) return '/';
  return getRoleConfig(role).defaultRedirect;
};

export const getNavItems = () => {
  const role = getUserRole();
  if (!role || !isAuthenticated()) return GUEST_NAV_ITEMS;
  return getRoleConfig(role).navItems;
};
