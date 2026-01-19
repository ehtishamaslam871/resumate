const axios = require('axios');

const AI_BASE = process.env.AI_SERVICE_URL || 'http://ai-service:8000';

const parseResume = async (fileUrl) => {
  const res = await axios.post(`${AI_BASE}/parse_resume`, { file_url: fileUrl }, { timeout: 20000 });
  return res.data;
};

const evaluateAnswer = async (payload) => {
  const res = await axios.post(`${AI_BASE}/evaluate_answer`, payload, { timeout: 20000 });
  return res.data;
};

const matchJob = async (payload) => {
  const res = await axios.post(`${AI_BASE}/match_job`, payload, { timeout: 20000 });
  return res.data;
};

module.exports = { parseResume, evaluateAnswer, matchJob };
