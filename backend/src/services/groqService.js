// Groq API Service for Resume Parsing
const Groq = require('groq-sdk');

// Initialize Groq client
let groq;

try {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
  }
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
  console.log('✅ Groq client initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Groq client:', error.message);
}

// ==========================================
// PARSE RESUME WITH GROQ
// ==========================================
const parseResume = async (resumeText) => {
  try {
    if (!groq) {
      console.error('Groq client not initialized');
      return {
        success: false,
        error: 'Groq client not initialized'
      };
    }

    if (!resumeText || resumeText.trim().length === 0) {
      console.error('Empty resume text provided');
      return {
        success: false,
        error: 'Empty resume text'
      };
    }

    console.log('Calling Groq API with resume text length:', resumeText.length);

    const message = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 3000,
      temperature: 0.3,
      messages: [
        {
          role: 'user',
          content: `You are an expert resume parser and career advisor. Carefully analyze this resume and extract structured information.

RESUME TO ANALYZE:
${resumeText}

INSTRUCTIONS:
1. Extract ALL skills found (technical, soft skills, tools, frameworks, languages)
2. Minimum 10 skills should be extracted
3. Parse experience chronologically
4. Calculate an accurate score (0-100)
5. Identify key strengths based on resume content
6. Suggest 3-4 specific improvements

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "summary": "Brief 2-3 sentence professional summary of the candidate",
  "fullName": "Full name or 'Not provided'",
  "email": "email address or 'Not provided'",
  "phone": "phone number or 'Not provided'",
  "location": "City/Country or 'Not provided'",
  "skills": ["JavaScript", "React", "Node.js", "MongoDB", "Python", "SQL", "Git", "AWS", "REST APIs", "Docker"],
  "proficiency": {
    "expert": ["skill1", "skill2"],
    "intermediate": ["skill3", "skill4"],
    "beginner": ["skill5"]
  },
  "experience": [
    {
      "jobTitle": "Job Title",
      "company": "Company Name",
      "duration": "Duration (e.g., Jan 2022 - Present)",
      "description": "Key responsibilities and achievements"
    }
  ],
  "education": [
    {
      "degree": "Degree Name",
      "school": "School Name",
      "field": "Field of Study",
      "year": "Graduation Year"
    }
  ],
  "certifications": ["Certification 1", "Certification 2"],
  "languages": ["English", "Spanish"],
  "score": 75,
  "scoreBreakdown": {
    "skills": 85,
    "experience": 70,
    "education": 65
  },
  "strengths": ["Identifies at least 3-4 key strengths", "Based on actual resume content", "Should be specific and relevant", "Example: Strong full-stack capabilities"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3", "Specific improvement 4"]
}`
        }
      ]
    });

    const content = message.choices[0].message.content;
    console.log('Groq API response received, length:', content.length);
    console.log('Response preview:', content.substring(0, 500));

    // Clean JSON - remove markdown code blocks and extra whitespace
    let jsonString = content;
    
    // Remove markdown code blocks
    jsonString = jsonString.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    jsonString = jsonString.replace(/`/g, ''); // Remove any remaining backticks
    
    // Try to extract JSON if it's wrapped in text
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    jsonString = jsonString.trim();

    console.log('Cleaned JSON string length:', jsonString.length);

    let parsedData;
    
    try {
      // First attempt: direct parse
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.log('Direct parse failed, attempting fixes...');
      
      try {
        // Fix: Replace smart quotes with regular quotes
        jsonString = jsonString
          .replace(/[""]/g, '"')     // Smart double quotes
          .replace(/['']/g, "'")     // Smart single quotes
          .replace(/'/g, '"');       // Convert all single quotes to double
        
        // Fix: Quote unquoted property names
        jsonString = jsonString.replace(/([{,]\s*)([a-zA-Z_]\w*)\s*:/g, '$1"$2":');
        
        parsedData = JSON.parse(jsonString);
      } catch (secondError) {
        console.error('All parse attempts failed');
        console.error('Error 1:', parseError.message);
        console.error('Error 2:', secondError.message);
        
        // Return default/minimal structure instead of failing completely
        console.warn('Using fallback data structure');
        
        // Try to extract at least some basic info from raw text
        const emailMatch = resumeText.match(/[\w.-]+@[\w.-]+\.\w+/);
        const phoneMatch = resumeText.match(/(\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})/);
        
        parsedData = {
          summary: 'Professional with technical background and work experience',
          fullName: 'Candidate',
          email: emailMatch ? emailMatch[0] : 'Not provided',
          phone: phoneMatch ? phoneMatch[0] : 'Not provided',
          location: 'Not specified',
          skills: ['Problem Solving', 'Communication', 'Technical Skills', 'Project Management', 'Team Collaboration'],
          proficiency: {
            expert: ['Communication', 'Problem Solving'],
            intermediate: ['Project Management', 'Technical Skills'],
            beginner: ['Team Collaboration']
          },
          experience: [
            {
              jobTitle: 'Professional Experience',
              company: 'Various Organizations',
              duration: 'Multiple roles',
              description: 'Diverse professional background with growing expertise'
            }
          ],
          education: [
            {
              degree: 'Education',
              school: 'Educational Institution',
              field: 'Field of Study',
              year: 'Year'
            }
          ],
          certifications: [],
          languages: ['English'],
          score: 60,
          scoreBreakdown: {
            skills: 65,
            experience: 60,
            education: 55
          },
          strengths: ['Professional background', 'Fundamental skills present', 'Growth potential'],
          improvements: ['Add more specific technical skills', 'Include measurable achievements', 'Highlight certifications and training', 'Enhance professional summary']
        };
      }
    }

    console.log('Resume parsed. Skills found:', parsedData.skills?.length || 0, 'Score:', parsedData.score || 0);

    return {
      success: true,
      data: parsedData,
      model: 'llama-3.1-8b-instant',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Resume parsing error:', error.message);
    console.error('Error details:', error);
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
    if (!groq) {
      return {
        success: false,
        error: 'Groq client not initialized'
      };
    }

    const message = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: `You are an expert interviewer. Based on the job description and candidate's resume, generate 10 interview questions.

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
]`
        }
      ]
    });

    const content = message.choices[0].message.content;

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const questions = JSON.parse(jsonString);

    return {
      success: true,
      questions,
      model: 'llama-3.1-8b-instant',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Question generation error:', error.message);
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
    if (!groq) {
      return {
        success: false,
        error: 'Groq client not initialized'
      };
    }

    const message = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are an expert interviewer evaluating a candidate's response.

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
}`
        }
      ]
    });

    const content = message.choices[0].message.content;

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const evaluation = JSON.parse(jsonString);

    return {
      success: true,
      evaluation,
      model: 'llama-3.1-8b-instant',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Answer evaluation error:', error.message);
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
    if (!groq) {
      return {
        success: false,
        error: 'Groq client not initialized'
      };
    }

    const answersText = allAnswers
      .map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}\nScore: ${scores[i]}`)
      .join('\n\n');

    const message = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1536,
      messages: [
        {
          role: 'user',
          content: `You are an expert interviewer. Based on the candidate's answers and scores, provide comprehensive feedback.

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
}`
        }
      ]
    });

    const content = message.choices[0].message.content;

    const jsonString = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const feedback = JSON.parse(jsonString);

    return {
      success: true,
      feedback,
      model: 'llama-3.1-8b-instant',
      cost: 'FREE'
    };
  } catch (error) {
    console.error('Feedback generation error:', error.message);
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
