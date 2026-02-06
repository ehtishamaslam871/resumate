const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middlewares/auth');
const Resume = require('../models/Resume');
const Job = require('../models/Job');

// ==================== MATCH JOBS ====================
// Get jobs matched to a specific resume
router.get('/resume/:resumeId', authMiddleware, async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.resumeId);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Check authorization
    if (resume.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const skills = resume.skills || [];
    const experience = resume.experience || [];
    const education = resume.education || [];

    // Find jobs that match the resume
    const jobs = await Job.find({ isActive: true }).limit(20);

    // Score each job based on skill matches
    const matchedJobs = jobs
      .map((job) => {
        let score = 0;
        const jobRequirements = (job.requirements || []).map(r => r.toLowerCase());
        const jobSkills = (job.skills || []).map(s => s.toLowerCase());
        const allJobKeywords = [...jobRequirements, ...jobSkills];

        // Calculate skill match percentage
        let matchedSkills = 0;
        skills.forEach((skill) => {
          const lowerSkill = skill.toLowerCase();
          if (allJobKeywords.some(keyword => keyword.includes(lowerSkill) || lowerSkill.includes(keyword))) {
            matchedSkills++;
            score += 20;
          }
        });

        // Boost score if experience matches
        if (experience.length > 0 && job.experienceRequired) {
          if (job.experienceRequired <= experience.length) {
            score += 15;
          }
        }

        // Bonus for education match
        if (education.length > 0 && job.educationRequired) {
          score += 10;
        }

        // Base match score
        score = Math.min(100, Math.max(0, score + 30));

        return {
          ...job.toObject(),
          matchScore: Math.round(score),
          matchedSkills
        };
      })
      .filter(job => job.matchScore >= 30) // Only return jobs with at least 30% match
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 10); // Return top 10 matches

    res.json({
      resume: {
        id: resume._id,
        originalName: resume.originalName,
        skills: resume.skills
      },
      matchedJobs,
      totalMatches: matchedJobs.length
    });
  } catch (err) {
    console.error('Matching error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
