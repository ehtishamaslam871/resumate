const Job = require('../models/Job');
const User = require('../models/User');
const Notification = require('../models/Notification');

// ==================== CREATE JOB ====================
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      requiredSkills,
      location,
      locationType,
      salaryMin,
      salaryMax,
      currency,
      jobType,
      experienceLevel,
      applicationDeadline
    } = req.body;

    // Validate required fields
    if (!title || !company || !description || !location) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const recruiter = await User.findById(req.user.id);
    if (!recruiter || recruiter.role !== 'recruiter') {
      return res.status(403).json({ message: 'Only recruiters can create jobs' });
    }

    const job = new Job({
      recruiter: req.user.id,
      recruiterId: req.user.id.toString(),
      recruiterName: recruiter.name,
      recruiterEmail: recruiter.email,
      
      title,
      company,
      description,
      requiredSkills: requiredSkills || [],
      location,
      locationType: locationType || 'on-site',
      
      salaryMin,
      salaryMax,
      currency: currency || 'USD',
      jobType: jobType || 'full-time',
      experienceLevel: experienceLevel || 'mid-level',
      
      applicationDeadline,
      status: 'open',
      applicantCount: 0,
      viewCount: 0
    });

    await job.save();

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (err) {
    console.error('Create job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET ALL JOBS (WITH FILTERS) ====================
exports.listJobs = async (req, res) => {
  try {
    const {
      search,
      location,
      jobType,
      experienceLevel,
      minSalary,
      maxSalary,
      skills,
      sort,
      page = 1,
      limit = 20
    } = req.query;

    // Build filter
    const filter = { status: 'open' };

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (jobType) {
      filter.jobType = jobType;
    }

    if (experienceLevel) {
      filter.experienceLevel = experienceLevel;
    }

    if (minSalary) {
      filter.salaryMin = { $gte: parseInt(minSalary) };
    }

    if (maxSalary) {
      filter.salaryMax = { $lte: parseInt(maxSalary) };
    }

    if (skills) {
      const skillsArray = typeof skills === 'string' ? [skills] : skills;
      filter.requiredSkills = { $in: skillsArray };
    }

    // Sort options
    let sortObj = { createdAt: -1 };
    if (sort === 'newest') sortObj = { createdAt: -1 };
    if (sort === 'oldest') sortObj = { createdAt: 1 };
    if (sort === 'popular') sortObj = { applicantCount: -1 };
    if (sort === 'views') sortObj = { viewCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .populate('recruiter', 'name email company')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      jobs
    });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET JOB DETAIL ====================
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('recruiter', 'name email phone company');

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Increment view count
    job.viewCount = (job.viewCount || 0) + 1;
    await job.save();

    res.json({ job });
  } catch (err) {
    console.error('Get job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== UPDATE JOB ====================
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      company,
      description,
      requiredSkills,
      location,
      salaryMin,
      salaryMax,
      jobType,
      experienceLevel,
      applicationDeadline,
      status
    } = req.body;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Only recruiter who posted can update
    if (job.recruiter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update fields
    if (title) job.title = title;
    if (company) job.company = company;
    if (description) job.description = description;
    if (requiredSkills) job.requiredSkills = requiredSkills;
    if (location) job.location = location;
    if (salaryMin) job.salaryMin = salaryMin;
    if (salaryMax) job.salaryMax = salaryMax;
    if (jobType) job.jobType = jobType;
    if (experienceLevel) job.experienceLevel = experienceLevel;
    if (applicationDeadline) job.applicationDeadline = applicationDeadline;
    if (status) job.status = status;

    await job.save();

    res.json({
      message: 'Job updated successfully',
      job
    });
  } catch (err) {
    console.error('Update job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== DELETE JOB ====================
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findById(id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Only recruiter who posted can delete
    if (job.recruiter.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Job.findByIdAndDelete(id);

    res.json({ message: 'Job deleted successfully' });
  } catch (err) {
    console.error('Delete job error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET RECRUITER'S JOBS ====================
exports.getRecruiterJobs = async (req, res) => {
  try {
    const { status, sort, page = 1, limit = 20 } = req.query;

    const filter = { recruiter: req.user.id };
    if (status) filter.status = status;

    let sortObj = { createdAt: -1 };
    if (sort === 'popular') sortObj = { applicantCount: -1 };
    if (sort === 'views') sortObj = { viewCount: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const jobs = await Job.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Job.countDocuments(filter);

    res.json({
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit)),
      jobs
    });
  } catch (err) {
    console.error('Get recruiter jobs error:', err);
    res.status(500).json({ message: err.message });
  }
};
