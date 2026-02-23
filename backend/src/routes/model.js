const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const modelService = require('../services/modelService');

// ── Public: Health check ───────────────────────────
router.get('/health', async (req, res) => {
  try {
    const health = await modelService.checkHealth();
    res.json(health);
  } catch (e) {
    res.status(503).json({ status: 'offline', error: e.message });
  }
});

// All remaining routes require authentication
router.use(authMiddleware);

// ── Parse Resume ───────────────────────────────────
router.post('/parse-resume', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'resumeText is required' });
    const result = await modelService.parseResume(resumeText);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Model inference failed', error: e.message });
  }
});

// ── Score Resume ───────────────────────────────────
router.post('/score-resume', async (req, res) => {
  try {
    const { resumeText, jobTitle, jobSkills } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'resumeText is required' });
    const result = await modelService.scoreResume(resumeText, jobTitle, jobSkills);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Scoring failed', error: e.message });
  }
});

// ── Generate Interview Questions ───────────────────
router.post('/generate-interview', async (req, res) => {
  try {
    const { jobDescription, resumeText } = req.body;
    if (!jobDescription) return res.status(400).json({ message: 'jobDescription is required' });
    const result = await modelService.generateInterviewQuestions(jobDescription, resumeText);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Interview generation failed', error: e.message });
  }
});

// ── Evaluate Answer ────────────────────────────────
router.post('/evaluate-answer', async (req, res) => {
  try {
    const { question, userAnswer, expectedKeywords } = req.body;
    if (!question || !userAnswer) return res.status(400).json({ message: 'question and userAnswer are required' });
    const result = await modelService.evaluateAnswer(question, userAnswer, expectedKeywords);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Evaluation failed', error: e.message });
  }
});

// ── Interview Feedback ─────────────────────────────
router.post('/interview-feedback', async (req, res) => {
  try {
    const { allAnswers, scores } = req.body;
    if (!allAnswers || !scores) return res.status(400).json({ message: 'allAnswers and scores are required' });
    const result = await modelService.generateInterviewFeedback(allAnswers, scores);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Feedback generation failed', error: e.message });
  }
});

// ── Chat ───────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, context, resumeData } = req.body;
    if (!message) return res.status(400).json({ message: 'message is required' });
    const result = await modelService.chat(message, context, resumeData);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Chat failed', error: e.message });
  }
});

// ── Match Resume ───────────────────────────────────
router.post('/match-resume', async (req, res) => {
  try {
    const { resumeText, jobTitle, jobDescription, requiredSkills } = req.body;
    if (!resumeText || !jobTitle) return res.status(400).json({ message: 'resumeText and jobTitle are required' });
    const result = await modelService.matchResume(resumeText, jobTitle, jobDescription, requiredSkills);
    if (!result.success) return res.status(502).json({ message: result.error });
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Matching failed', error: e.message });
  }
});

// ── Academic: Evaluate accuracy ────────────────────
router.post('/evaluate-accuracy', async (req, res) => {
  try {
    const { predicted, expected } = req.body;
    if (!predicted || !expected) return res.status(400).json({ message: 'predicted and expected are required' });
    const result = await modelService.evaluateAccuracy(predicted, expected);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Accuracy evaluation failed', error: e.message });
  }
});

// ── Academic: Compare models ───────────────────────
router.post('/compare-models', async (req, res) => {
  try {
    const { resumeText } = req.body;
    if (!resumeText) return res.status(400).json({ message: 'resumeText is required' });
    const result = await modelService.compareModels(resumeText);
    res.json(result);
  } catch (e) {
    res.status(500).json({ message: 'Model comparison failed', error: e.message });
  }
});

module.exports = router;
