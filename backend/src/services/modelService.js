
const axios = require('axios');

const MODEL_SERVER_URL = process.env.MODEL_SERVER_URL || 'http://localhost:8000';
const TIMEOUT = 300000; // 300 seconds — matches model server timeout for slow hardware
const AI_PROVIDER = (process.env.AI_PROVIDER || 'auto').toLowerCase();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com').replace(/\/$/, '');
const OPENAI_MODEL_INTERVIEW_GENERATION = process.env.OPENAI_MODEL_INTERVIEW_GENERATION || 'gpt-4.1-mini';
const OPENAI_MODEL_INTERVIEW_EVALUATION = process.env.OPENAI_MODEL_INTERVIEW_EVALUATION || 'gpt-4.1';
const OPENAI_MODEL_INTERVIEW_FEEDBACK = process.env.OPENAI_MODEL_INTERVIEW_FEEDBACK || 'gpt-4.1';

const client = axios.create({
  baseURL: MODEL_SERVER_URL,
  timeout: TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

const openaiClient = axios.create({
  baseURL: `${OPENAI_BASE_URL}/v1`,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    ...(OPENAI_API_KEY ? { Authorization: `Bearer ${OPENAI_API_KEY}` } : {}),
  },
});

const shouldUseOpenAI = () => {
  if (AI_PROVIDER === 'local') return false;
  if (AI_PROVIDER === 'openai') return !!OPENAI_API_KEY;
  return !!OPENAI_API_KEY;
};

const extractJsonObject = (text) => {
  if (!text || typeof text !== 'string') return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
};

const callOpenAIJsonTask = async ({ model, prompt, temperature = 0.2, maxTokens = 1200, taskName = 'task' }) => {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY missing');
  }

  const { data } = await openaiClient.post('/chat/completions', {
    model,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: 'You are an interview copilot. Return valid JSON only. No markdown.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error(`Empty OpenAI response for ${taskName}`);
  }

  try {
    return typeof content === 'string' ? JSON.parse(content) : content;
  } catch {
    const extracted = extractJsonObject(content);
    if (!extracted) {
      throw new Error(`Invalid JSON response for ${taskName}`);
    }
    return JSON.parse(extracted);
  }
};

const normalizeStringArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item).trim()).filter(Boolean);
};

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

const normalizeSkillList = (input) => {
  if (!input) return [];
  if (Array.isArray(input)) {
    return input.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(input)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

const deriveSkillsFromText = (text) => {
  if (!text) return [];
  return String(text)
    .substring(0, 300)
    .split(/[\n,]/)
    .map((s) => s.replace(/^skills\s*:\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 8);
};

// ── Interview Questions ──
const generateInterviewQuestions = async (jobDescription, resumeText, options = {}) => {
  const explicitSkills = normalizeSkillList(options.skills);
  const derivedSkills = deriveSkillsFromText(resumeText);
  const skills = explicitSkills.length ? explicitSkills : derivedSkills;

  const requestedCount = Number(options.count);
  const count = Number.isFinite(requestedCount)
    ? Math.min(Math.max(requestedCount, 3), 10)
    : 10;

  const technicalTarget = Math.min(5, Math.max(Math.floor(count / 2), 1));
  const generalTarget = Math.max(count - technicalTarget, 1);

  const difficulty = options.difficulty || 'mixed';
  const experienceLevel = options.experienceLevel || 'mid-level';
  const rolePrompt = `${jobDescription}. Experience level: ${experienceLevel}. Generate exactly ${count} role-specific and technology-specific PRACTICE interview questions. Include exactly ${generalTarget} general questions and ${technicalTarget} technical questions related to the selected role and tech stack. Avoid generic or unrelated questions.`;

  if (shouldUseOpenAI()) {
    try {
      const prompt = `Generate ${count} interview practice questions in JSON for this role context:\n${rolePrompt}\n\nTech stack focus: ${skills.join(', ') || 'general'}\nDifficulty: ${difficulty}\n\nRules:\n1) Exactly ${generalTarget} questions must have type "general" (behavioral or situational).\n2) Exactly ${technicalTarget} questions must have type "technical" and explicitly reference the role and/or provided technologies.\n3) No duplicate questions.\n\nReturn JSON exactly in this shape:\n{\n  "questions": [\n    {\n      "id": 1,\n      "question": "...",\n      "type": "general|technical",\n      "difficulty": "easy|medium|hard",\n      "expectedKeywords": ["..."],\n      "sampleAnswer": "concise ideal answer outline"\n    }\n  ]\n}`;

      const parsed = await callOpenAIJsonTask({
        model: OPENAI_MODEL_INTERVIEW_GENERATION,
        prompt,
        temperature: 0.25,
        maxTokens: 1600,
        taskName: 'generateInterviewQuestions',
      });

      const questions = Array.isArray(parsed?.questions) ? parsed.questions : [];
      if (questions.length > 0) {
        return {
          success: true,
          questions,
          model: OPENAI_MODEL_INTERVIEW_GENERATION,
          source: 'openai',
        };
      }
      throw new Error('OpenAI returned empty question list');
    } catch (e) {
      console.warn('OpenAI generateInterviewQuestions failed, falling back to local model server:', e.message);
    }
  }

  try {
    const { data } = await client.post('/generate-interview', {
      jobRole: rolePrompt,
      skills: skills.length ? skills : ['general'],
      difficulty,
      count,
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
  if (shouldUseOpenAI()) {
    try {
      const prompt = `Evaluate this interview answer and return JSON only.\n\nQuestion: ${question}\nCandidate Answer: ${userAnswer}\nExpected Keywords: ${(expectedKeywords || []).join(', ') || 'none'}\n\nReturn this JSON shape:\n{\n  "score": 0,\n  "feedback": "specific and constructive feedback",\n  "strengths": ["..."],\n  "improvements": ["..."],\n  "keywordsCovered": ["..."],\n  "keywordsMissed": ["..."]\n}`;

      const parsed = await callOpenAIJsonTask({
        model: OPENAI_MODEL_INTERVIEW_EVALUATION,
        prompt,
        temperature: 0.1,
        maxTokens: 1200,
        taskName: 'evaluateAnswer',
      });

      return {
        success: true,
        score: Number(parsed?.score) || 0,
        feedback: parsed?.feedback || '',
        strengths: normalizeStringArray(parsed?.strengths),
        improvements: normalizeStringArray(parsed?.improvements),
        keywordsCovered: normalizeStringArray(parsed?.keywordsCovered),
        keywordsMissed: normalizeStringArray(parsed?.keywordsMissed),
        model: OPENAI_MODEL_INTERVIEW_EVALUATION,
        source: 'openai',
      };
    } catch (e) {
      console.warn('OpenAI evaluateAnswer failed, falling back to local model server:', e.message);
    }
  }

  try {
    const { data } = await client.post('/evaluate-answer', {
      question, userAnswer, expectedKeywords,
    });
    const result = data?.data || {};
    return {
      success: true,
      score: Number(result.score) || 0,
      feedback: result.feedback || '',
      strengths: normalizeStringArray(result.strengths),
      improvements: normalizeStringArray(result.improvements),
      keywordsCovered: normalizeStringArray(result.keywordsCovered || result.keywordMatches),
      keywordsMissed: normalizeStringArray(result.keywordsMissed || result.missedKeywords),
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
  if (shouldUseOpenAI()) {
    try {
      const prompt = `Create final interview feedback based on answers and scores. Return JSON only.\n\nScores: ${JSON.stringify(scores)}\nAnswers: ${JSON.stringify(allAnswers).slice(0, 9000)}\n\nReturn this JSON shape:\n{\n  "overallScore": 0,\n  "performanceLevel": "excellent|good|average|needs_improvement",\n  "summary": "...",\n  "topStrengths": ["..."],\n  "areasForImprovement": ["..."],\n  "recommendation": "hire|maybe|reject",\n  "detailedFeedback": "..."\n}`;

      const parsed = await callOpenAIJsonTask({
        model: OPENAI_MODEL_INTERVIEW_FEEDBACK,
        prompt,
        temperature: 0.2,
        maxTokens: 1400,
        taskName: 'generateInterviewFeedback',
      });

      return {
        success: true,
        feedback: {
          overallScore: Number(parsed?.overallScore) || 0,
          performanceLevel: parsed?.performanceLevel || 'average',
          summary: parsed?.summary || '',
          topStrengths: normalizeStringArray(parsed?.topStrengths),
          areasForImprovement: normalizeStringArray(parsed?.areasForImprovement),
          recommendation: parsed?.recommendation || 'maybe',
          detailedFeedback: parsed?.detailedFeedback || '',
        },
        model: OPENAI_MODEL_INTERVIEW_FEEDBACK,
        source: 'openai',
      };
    } catch (e) {
      console.warn('OpenAI generateInterviewFeedback failed, falling back to local model server:', e.message);
    }
  }

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
