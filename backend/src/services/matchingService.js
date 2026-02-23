/**
 * Job Matching & Resume Shortlisting Service
 * Calculates compatibility scores between resumes and job requirements
 */

const modelService = require('./modelService');

/**
 * Calculate skill match score
 * @param {Array} resumeSkills - Skills from resume
 * @param {Array} requiredSkills - Required skills for job
 * @returns {Number} Skill match percentage (0-100)
 */
const calculateSkillMatch = (resumeSkills = [], requiredSkills = []) => {
  if (!requiredSkills || requiredSkills.length === 0) return 100;

  const resumeSkillsLower = resumeSkills.map(s => s.toLowerCase());
  const requiredSkillsLower = requiredSkills.map(s => s.toLowerCase());

  let matchedCount = 0;

  for (const requiredSkill of requiredSkillsLower) {
    const isMatched = resumeSkillsLower.some(resumeSkill =>
      resumeSkill.includes(requiredSkill) || requiredSkill.includes(resumeSkill)
    );
    if (isMatched) matchedCount++;
  }

  return Math.round((matchedCount / requiredSkillsLower.length) * 100);
};

/**
 * Calculate experience match score
 * @param {Number} candidateExperience - Years of experience
 * @param {Number} requiredExperience - Required years
 * @returns {Number} Experience match percentage
 */
const calculateExperienceMatch = (candidateExperience = 0, requiredExperience = 0) => {
  if (requiredExperience === 0) return 100;
  
  if (candidateExperience >= requiredExperience) {
    return 100;
  }
  
  if (candidateExperience === 0) {
    return 0;
  }
  
  return Math.round((candidateExperience / requiredExperience) * 100);
};

/**
 * Calculate location flexibility score
 * @param {String} candidateLocation - Candidate location
 * @param {String} jobLocation - Job location
 * @param {String} jobLocationType - on-site, remote, hybrid
 * @returns {Number} Location match score
 */
const calculateLocationMatch = (candidateLocation = '', jobLocation = '', jobLocationType = 'on-site') => {
  if (jobLocationType === 'remote') return 100;
  
  if (!jobLocation) return 80; // Flexible if not specified
  
  if (candidateLocation.toLowerCase() === jobLocation.toLowerCase()) {
    return 100;
  }
  
  if (jobLocationType === 'hybrid') {
    return 70;
  }
  
  return 40; // On-site but different location
};

/**
 * Calculate overall match score between resume and job
 * Weighted scoring: Skills (40%), Experience (30%), Location (20%), Education (10%)
 * @param {Object} resume - Parsed resume data
 * @param {Object} job - Job posting data
 * @returns {Object} Detailed match score breakdown
 */
const calculateMatchScore = (resume = {}, job = {}) => {
  try {
    const resumeData = resume.aiAnalysis || resume;
    const jobData = job;

    // Extract metrics
    const resumeSkills = resumeData.skills || [];
    const requiredSkills = jobData.requiredSkills || [];
    
    const candidateExp = resumeData.experience?.length || 0;
    const requiredExp = jobData.experienceLevel === 'entry-level' ? 0 : 
                       jobData.experienceLevel === 'mid-level' ? 2 :
                       jobData.experienceLevel === 'senior' ? 5 : 8;

    // Calculate component scores
    const skillMatch = calculateSkillMatch(resumeSkills, requiredSkills);
    const expMatch = calculateExperienceMatch(candidateExp, requiredExp);
    const locationMatch = calculateLocationMatch(
      resumeData.location,
      jobData.location,
      jobData.locationType
    );

    // Weighted total (40% skills, 30% experience, 20% location, 10% buffer)
    const totalScore = Math.round(
      (skillMatch * 0.4) +
      (expMatch * 0.3) +
      (locationMatch * 0.2) +
      (75 * 0.1) // 75% for other factors like education, certifications, etc.
    );

    return {
      totalScore,
      breakdown: {
        skills: skillMatch,
        experience: expMatch,
        location: locationMatch
      },
      matchedSkills: resumeSkills.filter(s =>
        requiredSkills.some(rs => rs.toLowerCase().includes(s.toLowerCase()) || 
                                 s.toLowerCase().includes(rs.toLowerCase()))
      ),
      missingSkills: requiredSkills.filter(s =>
        !resumeSkills.some(rs => rs.toLowerCase().includes(s.toLowerCase()) || 
                                s.toLowerCase().includes(rs.toLowerCase()))
      )
    };
  } catch (error) {
    console.error('Error calculating match score:', error);
    return {
      totalScore: 0,
      breakdown: { skills: 0, experience: 0, location: 0 },
      matchedSkills: [],
      missingSkills: []
    };
  }
};

/**
 * Get recommended jobs for a job seeker based on their resume
 * @param {Object} resume - Resume data
 * @param {Array} openJobs - Array of open job postings
 * @returns {Array} Jobs sorted by match score (highest first)
 */
const getRecommendedJobs = (resume, openJobs = []) => {
  try {
    const jobsWithScores = openJobs
      .map(job => {
        const matchData = calculateMatchScore(resume, job);
        return {
          ...job.toObject ? job.toObject() : job,
          matchData
        };
      })
      .filter(job => job.matchData.totalScore >= 40) // Only 40%+ matches
      .sort((a, b) => b.matchData.totalScore - a.matchData.totalScore);

    return jobsWithScores;
  } catch (error) {
    console.error('Error getting recommended jobs:', error);
    return [];
  }
};

/**
 * AI-Based resume shortlisting using generative AI (Ollama)
 * Analyzes multiple resumes against job requirements and shortlists best candidates.
 * Falls back to score-based ranking when AI is unavailable.
 * @param {Array} applications - Array of applications with resumes
 * @param {Object} job - Job posting
 * @param {Number} topN - Top N candidates to shortlist (default 5)
 * @returns {Promise<Array>} Shortlisted applications with AI scores
 */
const aiShortlistCandidates = async (applications = [], job = {}, topN = 5) => {
  try {
    if (!applications || applications.length === 0) {
      return [];
    }

    console.log(`🤖 AI Shortlisting: Analyzing ${applications.length} candidates for "${job.title}"`);

    // Prepare candidates data for analysis
    const candidatesText = applications
      .map((app, idx) => {
        const resume = app.resume || {};
        return `
Candidate ${idx + 1}:
Name: ${app.applicantName || 'N/A'}
Skills: ${(resume.skills || []).join(', ')}
Experience: ${(resume.experience || []).map(e => `${e.jobTitle} at ${e.company}`).join('; ')}
Education: ${(resume.education || []).map(e => `${e.degree} in ${e.field}`).join('; ')}
Summary: ${resume.summary || 'No summary'}
`;
      })
      .join('\n---\n');

    const analysisPrompt = `You are an expert recruiter. Analyze these candidates against the job requirements and provide a shortlist.

Job Requirements:
Title: ${job.title}
Description: ${job.description}
Required Skills: ${(job.requiredSkills || []).join(', ')}
Experience Level: ${job.experienceLevel || 'mid-level'}
Location: ${job.location || 'Any'}

Candidates:
${candidatesText}

Return ONLY valid JSON with this exact structure (no markdown, no explanation):
{
  "shortlistedCandidates": [
    {
      "candidateIndex": 1,
      "score": 85,
      "reasoning": "2-3 sentences explaining why this candidate is suitable",
      "strengths": ["strength1", "strength2"],
      "gaps": ["gap1", "gap2"],
      "recommendation": "Strong fit" or "Good fit" or "Average fit"
    }
  ],
  "bestCandidates": [1, 2, 3],
  "summary": "Overall summary of shortlisting results"
}`;

    // Use chat endpoint (generative AI) — not parseResume (regex parser)
    const aiResult = await modelService.chat(analysisPrompt, 'recruiter-shortlisting');
    let shortlistData = null;
    
    if (aiResult.success && aiResult.response) {
      try {
        // Try to extract JSON from the chat response
        const jsonMatch = aiResult.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          shortlistData = JSON.parse(jsonMatch[0]);
        }
      } catch (parseErr) {
        console.warn('Failed to parse AI shortlist response:', parseErr.message);
      }
    }

    if (!shortlistData) {
      console.warn('AI shortlisting unavailable, using score-based ranking');
      return applications
        .map((app, idx) => ({
          ...app,
          aiScore: calculateMatchScore(app.resume, job).totalScore
        }))
        .sort((a, b) => b.aiScore - a.aiScore)
        .slice(0, topN);
    }

    // Process AI results
    const shortlistedIds = new Set(shortlistData.bestCandidates || []);

    const result = applications
      .map((app, idx) => {
        const candidateData = shortlistData.shortlistedCandidates?.find(
          c => c.candidateIndex === idx + 1
        );

        return {
          ...app,
          aiScore: candidateData?.score || calculateMatchScore(app.resume, job).totalScore,
          aiReasoning: candidateData?.reasoning || '',
          aiStrengths: candidateData?.strengths || [],
          aiGaps: candidateData?.gaps || [],
          recommendation: candidateData?.recommendation || 'To be reviewed',
          isShortlisted: shortlistedIds.has(idx + 1)
        };
      })
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, topN);

    console.log(`✅ AI Shortlisting complete: ${result.length} candidates selected`);
    return result;
  } catch (error) {
    console.error('AI shortlisting error:', error.message);
    
    // Fallback to score-based ranking
    return applications
      .map(app => ({
        ...app,
        aiScore: calculateMatchScore(app.resume, job).totalScore,
        recommendation: 'To be reviewed'
      }))
      .sort((a, b) => b.aiScore - a.aiScore)
      .slice(0, topN);
  }
};

module.exports = {
  calculateSkillMatch,
  calculateExperienceMatch,
  calculateLocationMatch,
  calculateMatchScore,
  getRecommendedJobs,
  aiShortlistCandidates
};
