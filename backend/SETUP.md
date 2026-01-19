# ResuMate Backend Setup Guide

## Prerequisites
- Node.js v14+ 
- MongoDB running locally or connection string
- Google Gemini API Key (FREE)

## Installation

### 1. Install Dependencies ✅
```bash
cd backend
npm install --legacy-peer-deps
```

### 2. Get Gemini API Key (FREE)
1. Go to: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the key

### 3. Configure Environment Variables
Edit `backend/.env` and add:
```
GEMINI_API_KEY=your_api_key_from_step_2
MONGODB_URI=mongodb://localhost:27017/resumate
JWT_SECRET=your_secret_key
```

### 4. Start MongoDB (if not running)
```bash
# Windows
mongod

# Or use MongoDB Atlas connection string in .env
```

### 5. Start Backend Server
```bash
npm run dev
# Should output: Server running on http://localhost:5000
```

## Features Integrated

### ✅ Resume Upload & AI Parsing
- Upload PDF, DOCX, TXT files
- Gemini AI extracts: name, email, skills, experience, education
- Returns resume score (0-100) and analysis
- Stores parsed data in MongoDB

### ✅ Interview Generation & Evaluation
- Gemini generates 10 interview questions based on job
- Questions categorized: technical, behavioral, situational
- AI evaluates each answer with score and feedback
- Generates final interview feedback and recommendation

### ✅ Job Management
- Create job postings (Recruiter only)
- List all available jobs
- Apply to jobs
- View applications received

### ✅ Admin Panel
- Manage users (change role, suspend, delete)
- View analytics
- Export data

## API Endpoints

### Resume
- `POST /api/resumes/upload` - Upload and parse resume
- `GET /api/resumes/:id` - Get resume details

### Jobs
- `GET /api/jobs` - List all jobs
- `GET /api/jobs/search` - Search jobs
- `POST /api/jobs/:id/apply` - Apply to job

### Interview
- `POST /api/interview/start/:jobId` - Start interview
- `POST /api/interview/submit` - Submit answer
- `GET /api/interview/feedback/:id` - Get feedback

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile

## Gemini AI Capabilities Used

### parseResume()
Extracts from resume text:
- Name, email, phone, location
- Skills array
- Experience (job titles, companies, dates)
- Education (degree, school, field)
- AI Score (0-100)
- Strengths and improvements

### generateInterviewQuestions()
Based on job description and resume:
- 10 interview questions
- Categorized by type (technical/behavioral/situational)
- Difficulty level (easy/medium/hard)
- Expected keywords for each question

### evaluateAnswer()
For each interview answer:
- Score (0-100)
- Feedback on response quality
- Strengths identified
- Areas for improvement
- Keywords covered and missed

### generateInterviewFeedback()
After all questions:
- Overall score
- Performance level
- Summary of performance
- Top strengths
- Areas for improvement
- Hire/Maybe/FollowUp/Reject recommendation

## Troubleshooting

### "API key not valid"
- Check GEMINI_API_KEY in .env
- Key should start with `AIzaSy...`
- Visit https://aistudio.google.com/app/apikey to verify

### "MongoDB connection failed"
- Check MongoDB is running
- Verify MONGODB_URI in .env
- Or use MongoDB Atlas connection string

### "Module not found"
- Run: `npm install --legacy-peer-deps`
- Delete node_modules and package-lock.json, then reinstall

### Port 5000 already in use
- Change PORT in .env
- Or kill process using port: `npx kill-port 5000`

## Testing the API

```bash
# 1. Register user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"password123"}'

# 2. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"password123"}'

# 3. Upload resume (use JWT token from login)
curl -X POST http://localhost:5000/api/resumes/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@resume.pdf"
```

## Cost Analysis

- **Gemini API**: FREE (60 requests/min, 10K+ daily)
- **MongoDB**: FREE (MongoDB Atlas free tier)
- **Total Monthly Cost**: $0

## Next Steps

1. ✅ Backend setup complete
2. Start frontend: `npm run dev` (in frontend folder)
3. Upload resume and test AI parsing
4. Create job and test interview flow
5. Check interview feedback from Gemini

## Support

For issues with Gemini API:
- Docs: https://ai.google.dev/docs
- API Key: https://aistudio.google.com/app/apikey

For MongoDB help:
- Docs: https://docs.mongodb.com
- Atlas: https://www.mongodb.com/cloud/atlas
