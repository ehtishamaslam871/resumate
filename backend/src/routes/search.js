const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Profile = require('../models/Profile');
const Application = require('../models/Application');
const { authMiddleware } = require('../middlewares/auth');
const searchService = require('../services/searchService');

// Search jobs with advanced filters
router.get('/jobs', async (req, res) => {
  try {
    const {
      keywords,
      location,
      jobType,
      salaryMin,
      salaryMax,
      experience,
      skills,
      company,
      datePosted,
      sortBy = 'relevance',
      page = 1,
      limit = 10,
    } = req.query;

    const searchParams = {
      keywords,
      location,
      jobType: jobType ? (Array.isArray(jobType) ? jobType : [jobType]) : [],
      salaryMin: salaryMin ? parseInt(salaryMin) : null,
      salaryMax: salaryMax ? parseInt(salaryMax) : null,
      experience: experience ? (Array.isArray(experience) ? experience : [experience]) : [],
      skills: skills ? (Array.isArray(skills) ? skills : [skills]) : [],
      company,
      datePosted: datePosted ? parseInt(datePosted) : null,
    };

    const result = await searchService.searchJobs(Job, searchParams, sortBy, {
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Search candidates (recruiter only)
router.get('/candidates', authMiddleware, async (req, res) => {
  try {
    const user = await require('../models/User').findById(req.user.id);
    if (user.role !== 'recruiter') {
      return res.status(403).json({ error: 'Only recruiters can search candidates' });
    }

    const {
      keywords,
      skills,
      location,
      experience,
      minSalaryExpectation,
      maxSalaryExpectation,
      sortBy = 'relevance',
      page = 1,
      limit = 10,
    } = req.query;

    const searchParams = {
      keywords,
      skills: skills ? (Array.isArray(skills) ? skills : [skills]) : [],
      location,
      experience: experience ? parseInt(experience) : null,
      minSalaryExpectation: minSalaryExpectation ? parseInt(minSalaryExpectation) : null,
      maxSalaryExpectation: maxSalaryExpectation ? parseInt(maxSalaryExpectation) : null,
    };

    const result = await searchService.searchCandidates(Profile, searchParams, sortBy, {
      page,
      limit,
    });

    res.json(result);
  } catch (error) {
    console.error('Candidate search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get search filters for frontend
router.get('/filters', async (req, res) => {
  try {
    const filters = await searchService.getSearchFilters(Job);
    res.json(filters);
  } catch (error) {
    console.error('Get filters error:', error);
    res.status(500).json({ error: 'Failed to fetch filters' });
  }
});

// Get trending searches
router.get('/trending', async (req, res) => {
  try {
    const trending = await searchService.getTrendingSearches(Application);
    res.json({ trending });
  } catch (error) {
    console.error('Trending error:', error);
    res.status(500).json({ error: 'Failed to fetch trending' });
  }
});

// Get autocomplete suggestions
router.get('/autocomplete', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({
        jobTitles: [],
        companies: [],
        skills: [],
      });
    }

    const suggestions = await searchService.getAutocompleteSuggestions(Job, q);
    res.json(suggestions);
  } catch (error) {
    console.error('Autocomplete error:', error);
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

module.exports = router;
