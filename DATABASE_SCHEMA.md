# 🗄️ MongoDB Database Schema Documentation

## Overview

All data previously stored in `localStorage` is now stored in MongoDB. This document describes all collections and their structure.

---

## 📋 Collections

### 1. **Users** (Collection: `users`)

Stores all user accounts and authentication data.

```javascript
{
  _id: ObjectId,
  
  // Authentication
  name: String (required),
  email: String (unique, lowercase),
  password: String (hashed with bcrypt),
  phone: String,
  
  // Role-based Access
  role: 'job_seeker' | 'recruiter' | 'admin',
  
  // OAuth
  googleId: String,
  googleEmail: String,
  
  // Profile Information
  profilePicture: String (URL),
  headline: String,
  bio: String,
  location: String,
  country: String,
  countryCode: String,
  
  // Job Seeker Specific
  skills: [String],
  experience: [{
    jobTitle: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    field: String,
    year: String
  }],
  
  // Recruiter Specific
  companyName: String,
  companySize: String,
  industry: String,
  website: String,
  
  // Account Status
  isActive: Boolean (default: true),
  isSuspended: Boolean (default: false),
  emailVerified: Boolean (default: false),
  
  // Tracking
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "$2a$10$...",
  "phone": "+14155552671",
  "role": "job_seeker",
  "skills": ["JavaScript", "React", "MongoDB"],
  "location": "San Francisco, CA",
  "createdAt": "2025-01-13T10:00:00Z"
}
```

---

### 2. **Profiles** (Collection: `profiles`)

Extended profile information for detailed user profiles.

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, unique),
  userId: String,
  
  // Profile Details
  profilePicture: String,
  coverImage: String,
  headline: String,
  bio: String,
  location: String,
  country: String,
  
  // Social Links
  linkedin: String,
  github: String,
  portfolio: String,
  twitter: String,
  website: String,
  
  // Job Seeker Info
  currentPosition: String,
  currentCompany: String,
  yearsOfExperience: Number,
  careerObjectives: String,
  
  // Skills with Endorsements
  skills: [{
    name: String,
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert',
    endorsements: Number
  }],
  
  // Certifications
  certifications: [{
    name: String,
    issuer: String,
    issueDate: Date,
    expiryDate: Date,
    credentialId: String,
    credentialUrl: String
  }],
  
  // Recruiter Info
  companyName: String,
  companySize: String,
  industry: String,
  companyWebsite: String,
  companyLogo: String,
  companyDescription: String,
  
  // Job Preferences
  jobPreferences: {
    desiredJobTitles: [String],
    preferredLocations: [String],
    preferredJobTypes: [String],
    expectedSalaryMin: Number,
    expectedSalaryMax: Number,
    openToRemote: Boolean,
    openToRelocate: Boolean
  },
  
  // Recruiter Preferences
  hiringPreferences: {
    focusAreas: [String],
    budgetMin: Number,
    budgetMax: Number
  },
  
  // Privacy
  isPublic: Boolean (default: true),
  showEmail: Boolean (default: false),
  showPhone: Boolean (default: false),
  
  // Tracking
  profileCompletionPercentage: Number (0-100),
  viewCount: Number,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. **Jobs** (Collection: `jobs`)

Job postings created by recruiters.

```javascript
{
  _id: ObjectId,
  
  // Job Details
  title: String (required),
  company: String (required),
  description: String (required),
  requirements: [String],
  
  // Location
  location: String,
  locationType: 'on-site' | 'remote' | 'hybrid',
  
  // Compensation
  salaryMin: Number,
  salaryMax: Number,
  currency: String (default: 'USD'),
  
  // Skills & Experience
  skills: [String],
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship',
  experienceLevel: 'entry-level' | 'mid-level' | 'senior' | 'lead',
  
  // Recruiter Info
  recruiter: ObjectId (ref: User),
  recruiterId: String,
  recruiterName: String,
  recruiterEmail: String,
  
  // Status
  status: 'open' | 'closed' | 'draft',
  
  // Tracking
  applicantCount: Number,
  viewCount: Number,
  postedDate: Date,
  deadline: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Example**:
```json
{
  "title": "Senior React Developer",
  "company": "TechCorp",
  "description": "We're looking for...",
  "location": "San Francisco, CA",
  "locationType": "hybrid",
  "salaryMin": 120000,
  "salaryMax": 150000,
  "skills": ["React", "TypeScript", "Node.js"],
  "jobType": "full-time",
  "status": "open",
  "recruiter": ObjectId,
  "createdAt": "2025-01-13T10:00:00Z"
}
```

---

### 4. **Applications** (Collection: `applications`)

Job applications submitted by candidates.

```javascript
{
  _id: ObjectId,
  
  // Relationship
  job: ObjectId (ref: Job),
  jobId: String,
  jobTitle: String,
  companyName: String,
  
  applicant: ObjectId (ref: User),
  applicantId: String,
  applicantName: String,
  applicantEmail: String,
  applicantPhone: String,
  
  // Resume
  resume: ObjectId (ref: Resume),
  resumeUrl: String,
  
  // Application Info
  coverLetter: String,
  portfolio: String,
  linkedin: String,
  website: String,
  
  // Status
  status: 'applied' | 'reviewing' | 'shortlisted' | 'rejected' | 'accepted',
  
  // Recruiter Feedback
  recruiterFeedback: String,
  recruiterRating: Number (1-5),
  
  // Interview
  interviewScheduled: Date,
  interviewStatus: 'pending' | 'scheduled' | 'completed' | 'cancelled',
  
  // Tracking
  appliedDate: Date,
  reviewedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 5. **Resumes** (Collection: `resumes`)

User resumes and AI-parsed data.

```javascript
{
  _id: ObjectId,
  
  // User
  user: ObjectId (ref: User),
  
  // File
  originalName: String,
  url: String,
  
  // Parsed Content
  parsedText: String,
  
  // Extracted Data
  experience: [{
    jobTitle: String,
    company: String,
    duration: String,
    description: String
  }],
  education: [{
    degree: String,
    school: String,
    field: String,
    year: String
  }],
  
  skills: [String],
  score: Number (0-100),
  
  // AI Analysis
  aiAnalysis: {
    fullName: String,
    email: String,
    phone: String,
    location: String,
    summary: String,
    strengths: [String],
    improvements: [String]
  },
  
  aiModel: String ('gemini-pro', 'gpt-4', etc.),
  
  // Tracking
  createdAt: Date,
  updatedAt: Date
}
```

---

### 6. **Interviews** (Collection: `interviews`)

Interview sessions and questions/answers.

```javascript
{
  _id: ObjectId,
  
  candidate: ObjectId (ref: User),
  job: ObjectId (ref: Job),
  
  // Questions
  questions: [{
    questionId: Number,
    question: String,
    category: 'technical' | 'behavioral' | 'situational',
    difficulty: 'easy' | 'medium' | 'hard',
    expectedKeywords: [String]
  }],
  
  // Answers
  answers: [{
    questionId: Number,
    question: String,
    answer: String,
    score: Number,
    feedback: String,
    strengths: [String],
    improvements: [String],
    keywordsCovered: [String],
    keywordsMissed: [String]
  }],
  
  // Tracking
  currentQuestionIndex: Number,
  scores: [Number],
  status: 'pending' | 'in_progress' | 'completed',
  
  // Final Feedback
  finalFeedback: {
    overallScore: Number,
    performanceLevel: String,
    summary: String,
    topStrengths: [String],
    areasForImprovement: [String],
    recommendation: 'hire' | 'maybe' | 'followup' | 'reject',
    detailedFeedback: String
  },
  
  startedAt: Date,
  completedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

### 7. **SavedJobs** (Collection: `savedjobs`)

Jobs bookmarked by users.

```javascript
{
  _id: ObjectId,
  
  user: ObjectId (ref: User),
  userId: String,
  
  job: ObjectId (ref: Job),
  jobId: String,
  jobTitle: String,
  companyName: String,
  
  notes: String,
  
  savedDate: Date,
  createdAt: Date,
  updatedAt: Date
}
```

**Index**: `{ user: 1, job: 1 }` (unique) - prevents duplicates

---

### 8. **Notifications** (Collection: `notifications`)

System notifications for users.

```javascript
{
  _id: ObjectId,
  
  user: ObjectId (ref: User),
  userId: String,
  
  // Notification Info
  type: 'application_received' | 'application_status_updated' | 
        'job_match' | 'interview_scheduled' | 'profile_viewed' | 
        'recruiter_interested' | 'system_alert',
  
  title: String,
  message: String,
  description: String,
  
  // Related References
  relatedUser: ObjectId (ref: User),
  relatedJob: ObjectId (ref: Job),
  relatedApplication: ObjectId (ref: Application),
  
  // Status
  isRead: Boolean (default: false),
  readDate: Date,
  isArchived: Boolean (default: false),
  
  // Action
  actionUrl: String,
  actionLabel: String,
  
  // Tracking
  createdAt: Date,
  expiresAt: Date (auto-deletes after 30 days)
}
```

---

## 🔑 Indexes

Optimize queries with these indexes:

```javascript
// Users
db.users.createIndex({ email: 1 })
db.users.createIndex({ role: 1 })
db.users.createIndex({ createdAt: -1 })

// Profiles
db.profiles.createIndex({ user: 1 }, { unique: true })

// Jobs
db.jobs.createIndex({ recruiter: 1 })
db.jobs.createIndex({ status: 1 })
db.jobs.createIndex({ location: 1 })
db.jobs.createIndex({ skills: 1 })

// Applications
db.applications.createIndex({ job: 1 })
db.applications.createIndex({ applicant: 1 })
db.applications.createIndex({ status: 1 })
db.applications.createIndex({ job: 1, applicant: 1 }, { unique: true })

// SavedJobs
db.savedjobs.createIndex({ user: 1, job: 1 }, { unique: true })

// Notifications
db.notifications.createIndex({ user: 1 })
db.notifications.createIndex({ isRead: 1 })
db.notifications.createIndex({ createdAt: -1 })
```

---

## 📊 Data Relationships

```
User
├── Profile (one-to-one)
├── Resume (one-to-many)
├── Job (recruiter creates, one-to-many)
├── Application (applicant submits, one-to-many)
├── Interview (one-to-many)
├── SavedJob (one-to-many)
├── Notification (one-to-many)
└── Authentication (JWT tokens)

Job
├── Recruiter (User, many-to-one)
├── Application (one-to-many)
├── Interview (one-to-many)
└── SavedJob (one-to-many)

Application
├── Job (many-to-one)
├── Applicant (User, many-to-one)
├── Resume (many-to-one)
└── Interview (one-to-one)

Interview
├── Candidate (User, many-to-one)
└── Job (many-to-one)
```

---

## 🗂️ Migration from localStorage

### What Was Stored in localStorage:
1. `resumate_token` → JWT in memory (also in DB)
2. `resumate_user` → User data now in `User` collection
3. `resumate_users` → All users now in `User` collection
4. `resumate_applied_{userId}` → Applications in `Application` collection
5. Job preferences → `Profile.jobPreferences`
6. Recruiter data → `Profile` for recruiter-specific info
7. Interview data → `Interview` collection
8. Saved jobs → `SavedJob` collection

### Migration Strategy:
1. Read from localStorage if available (fallback)
2. Write all new data to MongoDB
3. Gradually migrate existing localStorage to DB
4. Clear localStorage after migration complete

---

## 📝 Example Queries

### Find all jobs posted by a recruiter:
```javascript
db.jobs.find({ recruiter: ObjectId("...") })
```

### Find all applications for a job:
```javascript
db.applications.find({ job: ObjectId("..."), status: "applied" })
```

### Get user's saved jobs:
```javascript
db.savedjobs.find({ user: ObjectId("...") }).populate('job')
```

### Get all notifications for user:
```javascript
db.notifications.find({ user: ObjectId("..."), isRead: false }).sort({ createdAt: -1 })
```

### Get user profile with all related data:
```javascript
db.profiles.findOne({ user: ObjectId("...") })
  .populate('user')
  .populate('certifications')
```

---

## 🔐 Data Privacy & Security

1. **Passwords**: Hashed with bcrypt (salt rounds: 10)
2. **Tokens**: Stored in memory, not localStorage
3. **Email**: Unique constraint, case-insensitive
4. **Phone**: Encrypted at rest (optional)
5. **Visibility**: `Profile.isPublic` controls public access
6. **Sensitive data**: `showEmail`, `showPhone` toggles

---

## 📈 Database Size Estimates

| Collection | Avg. Size | Estimated Rows |
|------------|-----------|-----------------|
| Users | 500 KB | 1,000 |
| Profiles | 300 KB | 1,000 |
| Jobs | 200 KB | 500 |
| Applications | 150 KB | 3,000 |
| Resumes | 1 MB | 1,000 |
| Interviews | 100 KB | 500 |
| SavedJobs | 50 KB | 2,000 |
| Notifications | 200 KB | 10,000 |

**Total**: ~3 MB for 1,000 active users

---

## 🚀 Next Steps

1. ✅ Schemas created
2. ⏳ Update API endpoints to use MongoDB
3. ⏳ Create middleware for auth
4. ⏳ Migrate localStorage data
5. ⏳ Add data validation
6. ⏳ Create database backups

