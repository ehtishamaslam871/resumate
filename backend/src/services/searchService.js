// Advanced search and filtering utilities
const buildSearchQuery = (searchParams) => {
  const query = {};

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
  } = searchParams;

  // Full-text search on keywords
  if (keywords && keywords.trim()) {
    query.$text = { $search: keywords };
  }

  // Location filter
  if (location && location.trim()) {
    query.location = { $regex: location, $options: 'i' };
  }

  // Job type filter
  if (jobType && jobType.length > 0) {
    query.jobType = { $in: jobType };
  }

  // Salary range filter
  if (salaryMin || salaryMax) {
    query.salary = {};
    if (salaryMin) query.salary.$gte = salaryMin;
    if (salaryMax) query.salary.$lte = salaryMax;
  }

  // Experience level filter
  if (experience && experience.length > 0) {
    query.experienceLevel = { $in: experience };
  }

  // Skills filter (job must have at least one of the required skills)
  if (skills && skills.length > 0) {
    query.requiredSkills = { $in: skills };
  }

  // Company filter
  if (company && company.trim()) {
    query.company = { $regex: company, $options: 'i' };
  }

  // Date posted filter (jobs posted in last X days)
  if (datePosted) {
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - datePosted);
    query.createdAt = { $gte: daysAgo };
  }

  return query;
};

// Build sort options
const buildSortOptions = (sortBy = 'relevance') => {
  const sortOptions = {
    relevance: { score: { $meta: 'textScore' } },
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    salary_high: { salary: -1 },
    salary_low: { salary: 1 },
    featured: { isFeatured: -1, createdAt: -1 },
  };

  return sortOptions[sortBy] || sortOptions.relevance;
};

// Build pagination
const buildPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page) || 1);
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const skip = (pageNum - 1) * limitNum;

  return { skip, limit: limitNum, page: pageNum };
};

// Advanced job search
const searchJobs = async (Job, searchParams, sortBy, pagination) => {
  try {
    const query = buildSearchQuery(searchParams);
    const sortOptions = buildSortOptions(sortBy);
    const { skip, limit } = buildPagination(pagination.page, pagination.limit);

    const jobs = await Job.find(query)
      .collation({ locale: 'en', strength: 2 }) // Case-insensitive search
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Job.countDocuments(query);

    return {
      jobs,
      pagination: {
        total,
        page: pagination.page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

// Advanced profile search (for recruiters)
const searchCandidates = async (Profile, searchParams, sortBy, pagination) => {
  try {
    const query = {};

    const {
      keywords,
      skills,
      location,
      experience,
      minSalaryExpectation,
      maxSalaryExpectation,
    } = searchParams;

    // Full-text search
    if (keywords && keywords.trim()) {
      query.$text = { $search: keywords };
    }

    // Skills match
    if (skills && skills.length > 0) {
      query.skills = { $in: skills };
    }

    // Location filter
    if (location && location.trim()) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Experience filter
    if (experience) {
      query.yearsOfExperience = { $gte: experience };
    }

    // Salary expectation range
    if (minSalaryExpectation || maxSalaryExpectation) {
      query.salaryExpectation = {};
      if (minSalaryExpectation) query.salaryExpectation.$gte = minSalaryExpectation;
      if (maxSalaryExpectation) query.salaryExpectation.$lte = maxSalaryExpectation;
    }

    const sortOptions = buildSortOptions(sortBy);
    const { skip, limit } = buildPagination(pagination.page, pagination.limit);

    const candidates = await Profile.find(query)
      .collation({ locale: 'en', strength: 2 })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Profile.countDocuments(query);

    return {
      candidates,
      pagination: {
        total,
        page: pagination.page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Candidate search error:', error);
    throw error;
  }
};

// Get search filters (for frontend dropdown options)
const getSearchFilters = async (Job) => {
  try {
    const [jobTypes, locations, companies, experienceLevels] = await Promise.all(
      [
        Job.distinct('jobType'),
        Job.distinct('location'),
        Job.distinct('company'),
        Job.distinct('experienceLevel'),
      ]
    );

    return {
      jobTypes: jobTypes.filter(Boolean),
      locations: locations.filter(Boolean),
      companies: companies.filter(Boolean),
      experienceLevels: experienceLevels.filter(Boolean),
    };
  } catch (error) {
    console.error('Error fetching search filters:', error);
    throw error;
  }
};

// Get trending searches (based on job applications)
const getTrendingSearches = async (Application) => {
  try {
    const trending = await Application.aggregate([
      {
        $group: {
          _id: '$jobId',
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'jobs',
          localField: '_id',
          foreignField: '_id',
          as: 'job',
        },
      },
      { $unwind: '$job' },
      {
        $project: {
          jobTitle: '$job.title',
          company: '$job.company',
          count: 1,
        },
      },
    ]);

    return trending;
  } catch (error) {
    console.error('Error fetching trending searches:', error);
    throw error;
  }
};

// Autocomplete suggestions
const getAutocompleteSuggestions = async (Job, searchTerm) => {
  try {
    const suggestions = await Job.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: searchTerm, $options: 'i' } },
            { company: { $regex: searchTerm, $options: 'i' } },
            { requiredSkills: { $regex: searchTerm, $options: 'i' } },
          ],
        },
      },
      {
        $facet: {
          jobTitles: [
            { $group: { _id: '$title' } },
            { $limit: 5 },
            { $project: { _id: 0, suggestion: '$_id' } },
          ],
          companies: [
            { $group: { _id: '$company' } },
            { $limit: 5 },
            { $project: { _id: 0, suggestion: '$_id' } },
          ],
          skills: [
            { $unwind: '$requiredSkills' },
            { $group: { _id: '$requiredSkills' } },
            { $limit: 5 },
            { $project: { _id: 0, suggestion: '$_id' } },
          ],
        },
      },
    ]);

    return {
      jobTitles: suggestions[0]?.jobTitles || [],
      companies: suggestions[0]?.companies || [],
      skills: suggestions[0]?.skills || [],
    };
  } catch (error) {
    console.error('Autocomplete error:', error);
    throw error;
  }
};

module.exports = {
  searchJobs,
  searchCandidates,
  getSearchFilters,
  getTrendingSearches,
  getAutocompleteSuggestions,
  buildSearchQuery,
  buildSortOptions,
  buildPagination,
};
