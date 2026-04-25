/**
 * API Service
 * Centralized API client for all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const AUTH_TOKEN_KEY = 'authToken'
const USER_KEY = 'user'

// One-time migration: move legacy shared auth from localStorage to tab-scoped sessionStorage.
const hydrateLegacyAuthToSession = () => {
  try {
    const hasSessionToken = !!sessionStorage.getItem(AUTH_TOKEN_KEY)
    const hasSessionUser = !!sessionStorage.getItem(USER_KEY)
    const legacyToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const legacyUser = localStorage.getItem(USER_KEY)

    if (!hasSessionToken && legacyToken) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, legacyToken)
    }
    if (!hasSessionUser && legacyUser) {
      sessionStorage.setItem(USER_KEY, legacyUser)
    }

    // Clear shared auth keys so tabs remain isolated from now on.
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  } catch {
    // Ignore storage access errors in restricted environments.
  }
}

// Get auth token from tab-scoped sessionStorage
export const getAuthToken = () => {
  hydrateLegacyAuthToSession()
  return sessionStorage.getItem(AUTH_TOKEN_KEY)
}

// Helper function to make API requests
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  // Add auth token if available
  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  } else {
    console.warn(`No auth token found for request to ${endpoint}`)
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || `API Error: ${response.status}`)
    }

    return data
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error.message)
    throw error
  }
}

// ==================== AUTH ENDPOINTS ====================
export const authAPI = {
  /**
   * Register new user
   * @param {Object} userData - { name, email, password, role, phone }
   */
  register: (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    })
  },

  /**
   * Login user
   * @param {Object} credentials - { email, password }
   */
  login: (credentials) => {
    return apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    })
  },

  /**
   * Exchange Clerk session token for app token + synced Mongo user
   * @param {string} clerkToken
   * @param {string} role
   */
  clerkSync: async (clerkToken, role = 'job_seeker') => {
    const response = await fetch(`${API_BASE_URL}/auth/clerk/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${clerkToken}`,
      },
      body: JSON.stringify({ role }),
    })

    const data = await response.json()
    if (!response.ok) {
      throw new Error(data.message || 'Unable to sync Clerk account')
    }
    return data
  },

  /**
   * Request password reset code
   * @param {string} email
   */
  forgotPassword: (email) => {
    return apiCall('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
  },

  /**
   * Reset password with email + code
   * @param {Object} payload - { email, code, newPassword }
   */
  resetPassword: (payload) => {
    return apiCall('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Claim admin role using one-time invite token (requires logged-in user)
   * @param {string} token
   */
  claimAdminInvite: (token) => {
    return apiCall('/auth/admin/claim', {
      method: 'POST',
      body: JSON.stringify({ token }),
    })
  },

  /**
   * Get current user profile
   */
  getProfile: () => {
    return apiCall('/profile/me', {
      method: 'GET',
    })
  },

  /**
   * Update user profile
   * @param {Object} updates - Profile fields to update
   */
  updateProfile: (updates) => {
    return apiCall('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Logout user
   */
  logout: () => {
    clearAuth()
    return Promise.resolve()
  },
}

// ==================== RESUME ENDPOINTS ====================
export const resumeAPI = {
  /**
   * Upload resume file
   * @param {File} file - Resume file
   */
  uploadResume: async (file) => {
    const formData = new FormData()
    formData.append('resume', file)

    const token = getAuthToken()
    const headers = {}
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    // Don't set Content-Type - let the browser set it for multipart/form-data

    try {
      const response = await fetch(`${API_BASE_URL}/resume/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.message || 'Resume upload failed')
      }
      return data
    } catch (error) {
      console.error('Resume upload error:', error.message)
      throw error
    }
  },

  /**
   * Get resume by ID
   * @param {string} resumeId - Resume ID
   */
  getResume: (resumeId) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'GET',
    })
  },

  /**
   * Get all resumes for current user
   */
  getUserResumes: () => {
    return apiCall('/resume', {
      method: 'GET',
    })
  },

  /**
   * Delete resume
   * @param {string} resumeId - Resume ID
   */
  deleteResume: (resumeId) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Update resume
   * @param {string} resumeId - Resume ID
   * @param {Object} updates - Fields to update
   */
  updateResume: (resumeId, updates) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Aliases for convenient access
  get: (resumeId) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'GET',
    })
  },

  list: () => {
    return apiCall('/resume', {
      method: 'GET',
    })
  },

  delete: (resumeId) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'DELETE',
    })
  },

  update: (resumeId, updates) => {
    return apiCall(`/resume/${resumeId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },
}

// ==================== JOB ENDPOINTS ====================
export const jobAPI = {
  /**
   * Get all jobs
   * @param {Object} filters - { search, role, location, page }
   */
  list: (filters = {}) => {
    const query = new URLSearchParams(filters).toString()
    return apiCall(`/jobs${query ? '?' + query : ''}`, {
      method: 'GET',
    })
  },

  /**
   * Get job by ID
   * @param {string} jobId - Job ID
   */
  getJob: (jobId) => {
    return apiCall(`/jobs/${jobId}`, {
      method: 'GET',
    })
  },

  /**
   * Alias for getJob for consistency
   */
  getJobById: (jobId) => {
    return apiCall(`/jobs/${jobId}`, {
      method: 'GET',
    })
  },

  /**
   * Get all jobs posted by current recruiter
   */
  getRecruiterJobs: () => {
    return apiCall('/jobs/recruiter/my-jobs', {
      method: 'GET',
    })
  },

  /**
   * Add curated sample jobs for current recruiter
   */
  seedSampleJobs: () => {
    return apiCall('/jobs/recruiter/seed-sample', {
      method: 'POST',
    })
  },

  /**
   * Create new job (recruiter only)
   * @param {Object} jobData - Job details
   */
  createJob: (jobData) => {
    return apiCall('/jobs', {
      method: 'POST',
      body: JSON.stringify(jobData),
    })
  },

  /**
   * Update job (recruiter only)
   * @param {string} jobId - Job ID
   * @param {Object} updates - Fields to update
   */
  updateJob: (jobId, updates) => {
    return apiCall(`/jobs/${jobId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  /**
   * Delete job (recruiter only)
   * @param {string} jobId - Job ID
   */
  deleteJob: (jobId) => {
    return apiCall(`/jobs/${jobId}`, {
      method: 'DELETE',
    })
  },
}

// ==================== JOB MATCHING ENDPOINTS ====================
export const matchingAPI = {
  /**
   * Get matched jobs for a resume
   * @param {string} resumeId - Resume ID
   */
  getMatchedJobs: (resumeId) => {
    return apiCall(`/matching/resume/${resumeId}`, {
      method: 'GET',
    })
  },
}

// ==================== APPLICATION ENDPOINTS ====================
export const applicationAPI = {
  /**
   * Create job application
   * @param {string} jobId - Job ID
   * @param {string} resumeId - Resume ID
   */
  createApplication: (jobId, resumeId) => {
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, resumeId }),
    })
  },

  /**
   * Get user's applications
   */
  getUserApplications: () => {
    return apiCall('/applications', {
      method: 'GET',
    })
  },

  deleteApplication: (applicationId) => {
    return apiCall(`/applications/${applicationId}`, {
      method: 'DELETE',
    })
  },

  /**
   * Get recommended jobs for job seeker based on resume
   */
  getRecommendedJobs: () => {
    return apiCall('/applications/recommendations/jobs', {
      method: 'GET',
    })
  },

  /**
   * Get applications for a job
   * @param {string} jobId - Job ID
   */
  getJobApplications: (jobId) => {
    return apiCall(`/applications/job/${jobId}`, {
      method: 'GET',
    })
  },

  /**
   * Fetch application resume binary (authorized recruiter/applicant).
   * Returns blob + metadata so caller can open/download in original format.
   */
  getApplicationResumeFile: async (applicationId) => {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/applications/${applicationId}/resume-file`, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })

    if (!response.ok) {
      let message = `API Error: ${response.status}`
      try {
        const data = await response.json()
        message = data.message || message
      } catch (_) {
        // Keep default message when response is not JSON.
      }
      throw new Error(message)
    }

    const blob = await response.blob()
    const contentType = response.headers.get('content-type') || blob.type || 'application/octet-stream'
    const contentDisposition = response.headers.get('content-disposition') || ''

    let fileName = 'resume'
    const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i)
    if (filenameMatch && filenameMatch[1]) {
      fileName = filenameMatch[1]
    }

    return { blob, contentType, fileName }
  },

  /**
   * AI Shortlist candidates for a job
   * @param {string} jobId - Job ID
   * @param {Object} options - { topN: 5 }
   */
  aiShortlistApplications: (jobId, options = { topN: 5 }) => {
    return apiCall(`/applications/${jobId}/shortlist`, {
      method: 'POST',
      body: JSON.stringify(options),
    })
  },

  /**
   * Update application status
   * @param {string} applicationId - Application ID
   * @param {string} status - New status (accepted, rejected, etc)
   */
  updateApplicationStatus: (applicationId, status, meta = {}) => {
    return apiCall(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, ...meta }),
    })
  },

  // Aliases
  apply: (jobId, resumeId) => {
    return apiCall('/applications', {
      method: 'POST',
      body: JSON.stringify({ jobId, resumeId }),
    })
  },

  list: () => {
    return apiCall('/applications', {
      method: 'GET',
    })
  },
}

// ==================== INTERVIEW ENDPOINTS ====================
export const interviewAPI = {
  /**
   * Start interview session
   * @param {string} jobId - Job ID
   */
  startInterview: (jobId) => {
    return apiCall('/interview/start', {
      method: 'POST',
      body: JSON.stringify({ jobId }),
    })
  },

  /**
   * Submit interview answer
   * @param {string} interviewId - Interview ID
   * @param {string} answer - Answer text
   */
  submitAnswer: (interviewId, answer) => {
    return apiCall('/interview/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ interviewId, answer }),
    })
  },

  /**
   * Get interview feedback
   * @param {string} sessionId - Interview session ID
   */
  getFeedback: (sessionId) => {
    return apiCall(`/interview/feedback/${sessionId}`, {
      method: 'GET',
    })
  },

  /**
   * Get interview report details for candidate (answers + expected answers)
   * @param {string} interviewId - Interview ID
   */
  getInterviewReport: (interviewId) => {
    return apiCall(`/interview/feedback/${interviewId}`, {
      method: 'GET',
    })
  },

  /**
   * Get all interview sessions for user
   */
  getUserInterviews: () => {
    return apiCall('/interview/my-interviews', {
      method: 'GET',
    })
  },

  /**
   * Create mock interview from role/stack details
   * @param {Object} payload - role, techStack, experienceLevel, questionCount
   */
  createMockInterview: (payload) => {
    return apiCall('/interview/mock/create', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  },

  /**
   * Start pending interview session
   * @param {string} interviewId - Interview ID
   */
  startInterviewSession: (interviewId) => {
    return apiCall(`/interview/${interviewId}/start-session`, {
      method: 'POST',
    })
  },

  /**
   * Get recruiter feedback for a job
   * @param {string} jobId - Job ID
   */
  getRecruiterFeedback: (jobId) => {
    return apiCall(`/interview/recruiter-feedback/${jobId}`, {
      method: 'GET',
    })
  },

  /**
   * Generate interview questions
   * @param {string} jobId - Job ID
   * @param {string} applicationId - Application ID
   */
  generateQuestions: (jobId, applicationId) => {
    return apiCall('/interview/generate-questions', {
      method: 'POST',
      body: JSON.stringify({ jobId, applicationId }),
    })
  },

  /**
   * Schedule interview for candidate
   * @param {string} applicationId - Application ID
   * @param {string} interviewDate - Interview date/time
   * @param {string} interviewLink - Interview link/URL
   */
  scheduleInterview: (applicationId, interviewDate, interviewLink) => {
    return apiCall('/interview/schedule', {
      method: 'POST',
      body: JSON.stringify({ applicationId, interviewDate, interviewLink }),
    })
  },

  /**
   * Send interview link to candidate
   * @param {string} applicationId - Application ID
   * @param {string} interviewDate - Interview date/time
   * @param {string} interviewLink - Interview link/URL
   */
  sendInterviewToCandidate: (applicationId, interviewDate, interviewLink) => {
    return apiCall('/interview/send-to-candidate', {
      method: 'POST',
      body: JSON.stringify({ applicationId, interviewDate, interviewLink }),
    })
  },

  /**
   * Get interview for candidate
   * @param {string} interviewId - Interview ID
   */
  getInterview: (interviewId) => {
    return apiCall(`/interview/${interviewId}`, {
      method: 'GET',
    })
  },

  /**
   * Submit answer to interview question
   * @param {string} interviewId - Interview ID
   * @param {number} questionId - Question ID
   * @param {string} answer - Answer text
   */
  submitInterviewAnswer: (interviewId, questionId, answer) => {
    return apiCall(`/interview/${interviewId}/answer`, {
      method: 'POST',
      body: JSON.stringify({ questionId, answer }),
    })
  },

  /**
   * Get interview feedback for recruiter
   * @param {string} interviewId - Interview ID
   */
  getInterviewFeedback: (interviewId) => {
    return apiCall(`/interview/recruiter/feedback/${interviewId}`, {
      method: 'GET',
    })
  },

  /**
   * Resolve interview details for a specific application (recruiter)
   * @param {string} applicationId - Application ID
   */
  getInterviewByApplication: (applicationId) => {
    return apiCall(`/interview/by-application/${applicationId}`, {
      method: 'GET',
    })
  },
}

// ==================== NOTIFICATION ENDPOINTS ====================
export const notificationAPI = {
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/notifications${query ? `?${query}` : ''}`, {
      method: 'GET',
    })
  },

  markAsRead: (notificationId) => {
    return apiCall(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    })
  },

  markAllAsRead: () => {
    return apiCall('/notifications/markall/read', {
      method: 'PUT',
    })
  },

  deleteNotification: (notificationId) => {
    return apiCall(`/notifications/${notificationId}`, {
      method: 'DELETE',
    })
  },
}

// ==================== ADMIN ENDPOINTS ====================
export const adminAPI = {
  /**
   * Get dashboard stats (users, jobs, applications, resumes, interviews)
   */
  getDashboardStats: () => {
    return apiCall('/admin/dashboard/stats', { method: 'GET' })
  },

  /**
   * Get all users with pagination and optional role filter
   * @param {Object} params - { page, limit, role, sortBy }
   */
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString()
    return apiCall(`/admin/users${query ? '?' + query : ''}`, { method: 'GET' })
  },

  /**
   * Toggle user active/suspended status
   * @param {string} userId - User ID
   */
  toggleUserStatus: (userId) => {
    return apiCall(`/admin/users/${userId}/toggle-status`, { method: 'PATCH' })
  },

  /**
   * Get user activity report
   * @param {string} userId - User ID
   */
  getUserActivity: (userId) => {
    return apiCall(`/admin/users/${userId}/activity`, { method: 'GET' })
  },

  /**
   * Reset user password (admin only)
   * @param {string} userId - User ID
   * @param {string} newPassword - New password
   */
  resetUserPassword: (userId, newPassword) => {
    return apiCall(`/admin/users/${userId}/reset-password`, {
      method: 'PATCH',
      body: JSON.stringify({ newPassword }),
    })
  },

  /**
   * Change user role (admin only)
   * @param {string} userId - User ID
   * @param {string} role - New role (job_seeker, recruiter, admin)
   */
  changeUserRole: (userId, role) => {
    return apiCall(`/admin/users/${userId}/change-role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    })
  },

  /**
   * Get application analytics
   */
  getApplicationAnalytics: () => {
    return apiCall('/admin/analytics/applications', { method: 'GET' })
  },

  /**
   * Get job market analytics
   */
  getJobMarketAnalytics: () => {
    return apiCall('/admin/analytics/job-market', { method: 'GET' })
  },

  /**
   * Get system health
   */
  getSystemHealth: () => {
    return apiCall('/admin/dashboard/health', { method: 'GET' })
  },

  /**
   * Create a one-time admin invite token for an email
   * @param {string} email
   * @param {number} expiresInHours - between 1 and 168, default 24
   */
  createAdminInvite: (email, expiresInHours = 24) => {
    return apiCall('/admin/invites/admin', {
      method: 'POST',
      body: JSON.stringify({ email, expiresInHours }),
    })
  },

  /**
   * List recent admin invites
   */
  listAdminInvites: () => {
    return apiCall('/admin/invites/admin', { method: 'GET' })
  },

  /**
   * Revoke an active admin invite
   * @param {string} inviteId
   */
  revokeAdminInvite: (inviteId) => {
    return apiCall(`/admin/invites/admin/${inviteId}/revoke`, {
      method: 'PATCH',
    })
  },
}

// ==================== CHAT / AI ENDPOINTS ====================
export const chatAPI = {
  /**
   * Send a message to the AI career assistant
   * @param {string} message - User message
   * @param {string} context - Optional context (e.g., 'career_advice', 'resume_tips')
   * @param {Object} resumeData - Optional resume data for personalized responses
   */
  sendMessage: (message, context = null, resumeData = null) => {
    return apiCall('/model/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, resumeData }),
    })
  },
}

// ==================== UTILITY FUNCTIONS ====================
export const setAuthToken = (token, user) => {
  if (token) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token)
    if (user) {
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
    }
    // Keep shared auth cleared to avoid cross-tab role overwrite.
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event('authChange'))
  }
}

export const clearAuth = () => {
  sessionStorage.removeItem(AUTH_TOKEN_KEY)
  sessionStorage.removeItem(USER_KEY)
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
  window.dispatchEvent(new Event('authChange'))
}

export const isAuthenticated = () => {
  return !!getAuthToken()
}

export const getCurrentUser = () => {
  hydrateLegacyAuthToSession()
  const user = sessionStorage.getItem(USER_KEY)
  return user ? JSON.parse(user) : null
}

export default {
  auth: authAPI,
  resume: resumeAPI,
  job: jobAPI,
  application: applicationAPI,
  interview: interviewAPI,
  matching: matchingAPI,
  notification: notificationAPI,
  admin: adminAPI,
  chat: chatAPI,
  authAPI,
  resumeAPI,
  jobAPI,
  applicationAPI,
  interviewAPI,
  matchingAPI,
  notificationAPI,
  adminAPI,
  chatAPI,
  setAuthToken,
  clearAuth,
  isAuthenticated,
  getCurrentUser,
  getAuthToken,
}
