/**
 * Model API Client
 * Frontend interface for the local AI model server (FastAPI)
 * Resume parsing: instant regex engine. Generative tasks: Ollama (optional).
 * Uses the same apiCall helper pattern as api.js
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api'

const getAuthToken = () => localStorage.getItem('authToken')

const modelCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}/model${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }

  const token = getAuthToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(url, { ...options, headers })
  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.message || `Model API Error: ${response.status}`)
  }

  return data
}

// ==================== MODEL API ====================
export const modelAPI = {
  /** Check if the local model server is running */
  health: () => {
    return fetch(`${API_BASE_URL}/model/health`).then(r => r.json()).catch(() => ({ status: 'offline' }))
  },

  /** Parse resume text into structured data */
  parseResume: (resumeText) => {
    return modelCall('/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    })
  },

  /** Score a resume (optionally against a job) */
  scoreResume: (resumeText, jobTitle = null, jobSkills = null) => {
    return modelCall('/score-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText, jobTitle, jobSkills }),
    })
  },

  /** Generate interview questions */
  generateInterview: (jobDescription, resumeText = null) => {
    return modelCall('/generate-interview', {
      method: 'POST',
      body: JSON.stringify({ jobDescription, resumeText }),
    })
  },

  /** Evaluate a single interview answer */
  evaluateAnswer: (question, userAnswer, expectedKeywords = []) => {
    return modelCall('/evaluate-answer', {
      method: 'POST',
      body: JSON.stringify({ question, userAnswer, expectedKeywords }),
    })
  },

  /** Get overall interview feedback */
  interviewFeedback: (allAnswers, scores) => {
    return modelCall('/interview-feedback', {
      method: 'POST',
      body: JSON.stringify({ allAnswers, scores }),
    })
  },

  /** Chat with the AI career advisor */
  chat: (message, context = null, resumeData = null) => {
    return modelCall('/chat', {
      method: 'POST',
      body: JSON.stringify({ message, context, resumeData }),
    })
  },

  /** Match a resume against a job */
  matchResume: (resumeText, jobTitle, jobDescription = '', requiredSkills = []) => {
    return modelCall('/match-resume', {
      method: 'POST',
      body: JSON.stringify({ resumeText, jobTitle, jobDescription, requiredSkills }),
    })
  },

  /** Academic: evaluate prediction accuracy */
  evaluateAccuracy: (predicted, expected) => {
    return modelCall('/evaluate-accuracy', {
      method: 'POST',
      body: JSON.stringify({ predicted, expected }),
    })
  },

  /** Academic: compare local models */
  compareModels: (resumeText) => {
    return modelCall('/compare-models', {
      method: 'POST',
      body: JSON.stringify({ resumeText }),
    })
  },
}

export default modelAPI
