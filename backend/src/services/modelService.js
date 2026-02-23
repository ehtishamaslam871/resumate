/**
 * Model Service — Bridge between Node.js backend and local Python FastAPI model server
 *
 * Resume Parsing: rule-based regex parser (instant, no LLM)
 * Generative tasks (scoring, interview, chat, matching): Ollama (optional)
 *
 * Architecture:
 *   Node.js (this file) → FastAPI (model-server/server.py) → regex parser / Ollama
 */

const axios = require('axios');

const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8000';
const TIMEOUT = 300000; // 300 seconds — matches model server timeout for slow hardware

const client = axios.create({
  baseURL: MODEL_SERVER_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Health ─────────────────────────────────────────
const checkHealth = async () => {
  try {
    const { data } = await client.get('/health');
    return data;
  } catch (e) {
    return { status: 'offline', error: e.message };
  }
};

// ── Resume Parsing ──
const parseResume = async (resumeText) => {
  try {
    const { data } = await client.post('/parse-resume', { resumeText });
    return {
      success: true,
      data: data.data,          // keep nested so controller can access analysis.data
      model: data.model || 'regex-nlp',
      inferenceTime: data.inference_time,
      source: 'regex-nlp',
    };
  } catch (e) {
    console.error('Model parseResume error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Resume Scoring ─────────────────────────────────
const scoreResume = async (resumeText, jobTitle = null, jobSkills = null) => {
  try {
    const { data } = await client.post('/score-resume', { resumeText, jobTitle, jobSkills });
    return { success: true, data: data.data, model: data.model,
             inferenceTime: data.inference_time, source: 'local-llm' };
  } catch (e) {
    console.error('Model scoreResume error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Interview Questions ──
const generateInterviewQuestions = async (jobDescription, resumeText) => {
  try {
    // Extract skills from resumeText for the prompt
    const skills = resumeText ? resumeText.substring(0, 200).split(/[,\n]/).map(s => s.trim()).filter(Boolean) : [];
    const { data } = await client.post('/generate-interview', {
      jobRole: jobDescription,
      skills: skills.length ? skills : ['general'],
      difficulty: 'mixed',
      count: 5,
    });
    return {
      success: true,
      questions: data.data?.questions || [],
      model: data.model,
      inferenceTime: data.inference_time,
      source: 'local-llm',
    };
  } catch (e) {
    console.error('Model generateInterview error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Answer Evaluation ──
const evaluateAnswer = async (question, userAnswer, expectedKeywords = []) => {
  try {
    const { data } = await client.post('/evaluate-answer', {
      question, userAnswer, expectedKeywords,
    });
    return {
      success: true,
      ...data.data,
      model: data.model,
      inferenceTime: data.inference_time,
      source: 'local-llm',
    };
  } catch (e) {
    console.error('Model evaluateAnswer error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Interview Feedback ──
const generateInterviewFeedback = async (allAnswers, scores) => {
  try {
    const { data } = await client.post('/interview-feedback', { allAnswers, scores });
    return {
      success: true,
      feedback: data.data,
      model: data.model,
      inferenceTime: data.inference_time,
      source: 'local-llm',
    };
  } catch (e) {
    console.error('Model feedback error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Chat ───────────────────────────────────────────
const chat = async (message, context = null, resumeData = null) => {
  try {
    const { data } = await client.post('/chat', { message, context, resumeData });
    return { success: true, response: data.response, model: data.model,
             inferenceTime: data.inference_time, source: 'local-llm' };
  } catch (e) {
    console.error('Model chat error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Resume-Job Matching ────────────────────────────
const matchResume = async (resumeText, jobTitle, jobDescription, requiredSkills) => {
  try {
    const { data } = await client.post('/match-resume', {
      resumeText, jobTitle, jobDescription, requiredSkills,
    });
    return { success: true, data: data.data, model: data.model,
             inferenceTime: data.inference_time, source: 'local-llm' };
  } catch (e) {
    console.error('Model match error:', e.response?.data || e.message);
    return { success: false, error: e.response?.data?.detail || e.message };
  }
};

// ── Academic: Evaluate accuracy ────────────────────
const evaluateAccuracy = async (predicted, expected) => {
  try {
    const { data } = await client.post('/evaluate', { predicted, expected });
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// ── Academic: Compare models ───────────────────────
const compareModels = async (resumeText) => {
  try {
    const { data } = await client.post('/compare-models', { resumeText });
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
};

module.exports = {
  checkHealth,
  parseResume,
  scoreResume,
  generateInterviewQuestions,
  evaluateAnswer,
  generateInterviewFeedback,
  chat,
  matchResume,
  evaluateAccuracy,
  compareModels,
};
