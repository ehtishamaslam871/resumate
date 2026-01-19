// filepath: backend/src/services/geminiService.js
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ==========================================
// PARSE RESUME WITH GEMINI
// ==========================================
const parseResume = async (resumeText) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert resume parser. Analyze this resume and extract the following information in JSON format:

Resume Text:
${resumeText}

Return ONLY valid JSON with this structure (no markdown, no explanation):
{
  "summary": "2-3 line summary of candidate",
  "fullName": "extracted full name",
  "email": "extracted email",
  "phone": "extracted phone",
  "location": "location if available",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "jobTitle": "title",
      "company": "company name",
      "duration": "duration",
      "description": "brief description"
    }
  ],
  "education": [
    {
      "degree": "degree type",
      "school": "school name",
      "field": "field of study",
      "year": "graduation year"
    }
  ],
  "score": 85,
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"]
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    // Clean JSON
    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const parsedData = JSON.parse(jsonString);

    return {
      success: true,
      data: parsedData,
      model: 'gemini-pro',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Resume parsing error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ==========================================
// GENERATE INTERVIEW QUESTIONS
// ==========================================
const generateInterviewQuestions = async (jobDescription, resumeText) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert interviewer. Based on the job description and candidate's resume, generate 10 interview questions.

Job Description:
${jobDescription}

Candidate Resume:
${resumeText}

Return ONLY valid JSON array (no markdown, no explanation):
[
  {
    "questionId": 1,
    "question": "question text",
    "category": "technical|behavioral|situational",
    "difficulty": "easy|medium|hard",
    "expectedKeywords": ["keyword1", "keyword2"]
  }
]`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const questions = JSON.parse(jsonString);

    return {
      success: true,
      questions,
      model: 'gemini-pro',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Question generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ==========================================
// EVALUATE INTERVIEW ANSWER
// ==========================================
const evaluateAnswer = async (question, userAnswer, expectedKeywords) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an expert interviewer evaluating a candidate's response.

Question: ${question}
Candidate's Answer: ${userAnswer}
Expected Keywords/Topics: ${expectedKeywords.join(', ')}

Evaluate the answer and return ONLY valid JSON (no markdown, no explanation):
{
  "score": 75,
  "feedback": "overall feedback on the answer",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "keywordsCovered": ["covered1", "covered2"],
  "keywordsMissed": ["missed1", "missed2"]
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const evaluation = JSON.parse(jsonString);

    return {
      success: true,
      evaluation,
      model: 'gemini-pro',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Answer evaluation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// ==========================================
// GENERATE INTERVIEW FEEDBACK
// ==========================================
const generateInterviewFeedback = async (allAnswers, scores) => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const answersText = allAnswers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}\nScore: ${scores[i]}`)
      .join('\n\n');

    const prompt = `You are an expert interviewer. Based on the candidate's answers and scores, provide comprehensive feedback.

Interview Responses and Scores:
${answersText}

Return ONLY valid JSON (no markdown, no explanation):
{
  "overallScore": 78,
  "performanceLevel": "good|excellent|average|needs_improvement",
  "summary": "overall summary of performance",
  "topStrengths": ["strength1", "strength2", "strength3"],
  "areasForImprovement": ["area1", "area2", "area3"],
  "recommendation": "hire|maybe|followup|reject",
  "detailedFeedback": "detailed feedback paragraph"
}`;

    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const feedback = JSON.parse(jsonString);

    return {
      success: true,
      feedback,
      model: 'gemini-pro',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Feedback generation error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  parseResume,
  generateInterviewQuestions,
  evaluateAnswer,
  generateInterviewFeedback,
};
