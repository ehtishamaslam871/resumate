/**
 * API Service
 * Centralized API client for all backend communication
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken')
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
    localStorage.removeItem('authToken')
    localStorage.removeItem('user')
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
    return apiCall('/applications/my-applications', {
      method: 'GET',
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
  updateApplicationStatus: (applicationId, status) => {
    return apiCall(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
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
   * @param {string} sessionId - Interview session ID
   * @param {number} questionIndex - Question index (0-based)
   * @param {string} answer - Answer text
   */
  submitAnswer: (sessionId, questionIndex, answer) => {
    return apiCall('/interview/submit-answer', {
      method: 'POST',
      body: JSON.stringify({ sessionId, questionIndex, answer }),
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
   * Get all interview sessions for user
   */
  getUserInterviews: () => {
    return apiCall('/interview/my-interviews', {
      method: 'GET',
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
}

// ==================== UTILITY FUNCTIONS ====================
export const setAuthToken = (token, user) => {
  if (token) {
    localStorage.setItem('authToken', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
}

export const clearAuth = () => {
  localStorage.removeItem('authToken')
  localStorage.removeItem('user')
}

export const isAuthenticated = () => {
  return !!getAuthToken()
}

export const getCurrentUser = () => {
  const user = localStorage.getItem('user')
  return user ? JSON.parse(user) : null
}

export default {
  auth: authAPI,
  resume: resumeAPI,
  job: jobAPI,
  application: applicationAPI,
  interview: interviewAPI,
  matching: matchingAPI,
  authAPI,
  resumeAPI,
  jobAPI,
  applicationAPI,
  interviewAPI,
  matchingAPI,
  setAuthToken,
  clearAuth,
  isAuthenticated,
  getCurrentUser,
}
