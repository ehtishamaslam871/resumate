# ResuMate API Documentation

**Base URL:** `http://localhost:5000/api`

---

## Authentication Endpoints

### Register New User
- **Method:** `POST`
- **URL:** `/auth/register`
- **Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "role": "job_seeker" // or "recruiter"
}
```
- **Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "token": "jwt_token_here",
  "user": { ... },
  "profile": { ... }
}
```

### Login User
- **Method:** `POST`
- **URL:** `/auth/login`
- **Body:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```
- **Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

### Google OAuth Callback
- **Method:** `GET`
- **URL:** `/auth/google/callback`
- **Note:** Handled by Passport.js

---

## Profile Endpoints

### Get Current Profile
- **Method:** `GET`
- **URL:** `/profile/me`
- **Headers:** `Authorization: Bearer {token}`
- **Response:** `200 OK`
```json
{
  "user": { ... },
  "profile": { ... }
}
```

### Update Current Profile
- **Method:** `PUT`
- **URL:** `/profile/me`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** (any of the following)
```json
{
  "name": "Updated Name",
  "phone": "+1234567890",
  "skills": ["JavaScript", "React", "MongoDB"],
  "experience": [{ "company": "ABC Corp", "position": "Developer", "duration": "2 years" }],
  "education": [{ "school": "University", "degree": "BS", "field": "Computer Science" }],
  "bio": "Profile bio",
  "headline": "Full Stack Developer",
  "linkedin": "https://linkedin.com/...",
  "github": "https://github.com/...",
  "portfolio": "https://portfolio.com/...",
  "certifications": ["AWS Certified", "React Certified"]
}
```
- **Response:** `200 OK`

### Get Public Profile
- **Method:** `GET`
- **URL:** `/profile/{userId}`
- **Response:** `200 OK`

---

## Job Endpoints

### Create Job (Recruiter Only)
- **Method:** `POST`
- **URL:** `/jobs`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "title": "Senior Developer",
  "company": "Tech Corp",
  "description": "Job description...",
  "location": "New York, NY",
  "locationType": "on-site", // or "remote", "hybrid"
  "salaryMin": 100000,
  "salaryMax": 150000,
  "currency": "USD",
  "jobType": "full-time", // or "part-time", "contract"
  "experienceLevel": "senior", // or "junior", "mid-level"
  "requiredSkills": ["JavaScript", "React", "MongoDB"],
  "applicationDeadline": "2024-12-31"
}
```
- **Response:** `201 Created`

### List All Jobs
- **Method:** `GET`
- **URL:** `/jobs`
- **Query Parameters:**
  - `search`: Search by title/company/description
  - `location`: Filter by location
  - `jobType`: Filter by job type
  - `experienceLevel`: Filter by experience level
  - `minSalary`: Minimum salary
  - `maxSalary`: Maximum salary
  - `skills`: Filter by required skills
  - `sort`: "newest", "oldest", "popular", "views"
  - `page`: Page number (default: 1)
  - `limit`: Results per page (default: 20)

**Example:** `GET /jobs?search=developer&location=NewYork&sort=newest&page=1`

- **Response:** `200 OK`
```json
{
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5,
  "jobs": [...]
}
```

### Get Job Details
- **Method:** `GET`
- **URL:** `/jobs/{jobId}`
- **Response:** `200 OK`

### Update Job (Recruiter Only)
- **Method:** `PUT`
- **URL:** `/jobs/{jobId}`
- **Headers:** `Authorization: Bearer {token}`
- **Body:** (any updatable field)

### Delete Job (Recruiter Only)
- **Method:** `DELETE`
- **URL:** `/jobs/{jobId}`
- **Headers:** `Authorization: Bearer {token}`

### Get Recruiter's Jobs
- **Method:** `GET`
- **URL:** `/jobs/recruiter/my-jobs`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:** `status`, `sort`, `page`, `limit`

---

## Application Endpoints

### Create Application
- **Method:** `POST`
- **URL:** `/applications`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "jobId": "job_id_here",
  "resumeId": "resume_id_here",
  "coverLetter": "Why I'm interested...",
  "portfolio": "https://portfolio.com",
  "linkedin": "https://linkedin.com/...",
  "website": "https://website.com"
}
```
- **Response:** `201 Created`

### Get My Applications
- **Method:** `GET`
- **URL:** `/applications`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `status`: "applied", "reviewing", "shortlisted", "rejected", "accepted"
  - `sort`: "newest"
  - `page`: Page number
  - `limit`: Results per page

### Get Application Details
- **Method:** `GET`
- **URL:** `/applications/{applicationId}`
- **Headers:** `Authorization: Bearer {token}`

### Delete Application
- **Method:** `DELETE`
- **URL:** `/applications/{applicationId}`
- **Headers:** `Authorization: Bearer {token}`
- **Note:** Only allowed if status is "applied"

### Get Job Applications (Recruiter)
- **Method:** `GET`
- **URL:** `/applications/job/{jobId}`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:** `status`, `sort`

### Update Application Status (Recruiter)
- **Method:** `PUT`
- **URL:** `/applications/{applicationId}/status`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "status": "shortlisted", // or "reviewing", "rejected", "accepted"
  "feedback": "Great application!",
  "rating": 4.5
}
```

---

## Resume Endpoints

### Get All My Resumes
- **Method:** `GET`
- **URL:** `/resume`
- **Headers:** `Authorization: Bearer {token}`
- **Response:** `200 OK`
```json
{
  "total": 3,
  "resumes": [...]
}
```

### Upload Resume
- **Method:** `POST`
- **URL:** `/resume/upload`
- **Headers:** 
  - `Authorization: Bearer {token}`
  - `Content-Type: multipart/form-data`
- **Form Data:**
  - `resume`: File (PDF, DOCX, or TXT)
- **Response:** `201 Created`

### Get Resume Details
- **Method:** `GET`
- **URL:** `/resume/{resumeId}`
- **Headers:** `Authorization: Bearer {token}`

### Update Resume
- **Method:** `PUT`
- **URL:** `/resume/{resumeId}`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "isDefault": true,
  "notes": "Updated resume with new skills"
}
```

### Delete Resume
- **Method:** `DELETE`
- **URL:** `/resume/{resumeId}`
- **Headers:** `Authorization: Bearer {token}`

---

## Interview Endpoints

### Start Interview
- **Method:** `POST`
- **URL:** `/interview/start`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "jobId": "job_id_here",
  "applicationId": "application_id_here" // optional
}
```
- **Response:** `201 Created`
```json
{
  "message": "Interview started successfully",
  "interview": { ... },
  "firstQuestion": { ... }
}
```

### Submit Answer
- **Method:** `POST`
- **URL:** `/interview/submit-answer`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "interviewId": "interview_id_here",
  "answer": "My answer to the question..."
}
```
- **Response:** `200 OK`
```json
{
  "success": true,
  "evaluation": { ... },
  "nextQuestion": { ... },
  "interviewComplete": false,
  "averageScore": 82
}
```

### Get Interview Feedback (Candidate)
- **Method:** `GET`
- **URL:** `/interview/feedback/{interviewId}`
- **Headers:** `Authorization: Bearer {token}`
- **Response:** `200 OK`

### Get User Interviews
- **Method:** `GET`
- **URL:** `/interview/my-interviews`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:** `status`, `page`, `limit`

### Get Interview Feedback (Recruiter)
- **Method:** `GET`
- **URL:** `/interview/recruiter/feedback/{interviewId}`
- **Headers:** `Authorization: Bearer {token}`

---

## Saved Jobs Endpoints

### Get My Saved Jobs
- **Method:** `GET`
- **URL:** `/saved-jobs`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:** `page`, `limit`, `sort` (newest/oldest)

### Save a Job
- **Method:** `POST`
- **URL:** `/saved-jobs`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "jobId": "job_id_here",
  "notes": "Interested in this role"
}
```

### Update Saved Job
- **Method:** `PUT`
- **URL:** `/saved-jobs/{savedJobId}`
- **Headers:** `Authorization: Bearer {token}`
- **Body:**
```json
{
  "notes": "Updated notes"
}
```

### Remove Saved Job
- **Method:** `DELETE`
- **URL:** `/saved-jobs/{savedJobId}`
- **Headers:** `Authorization: Bearer {token}`

### Check if Job is Saved
- **Method:** `GET`
- **URL:** `/saved-jobs/check/{jobId}`
- **Headers:** `Authorization: Bearer {token}`

---

## Notification Endpoints

### Get My Notifications
- **Method:** `GET`
- **URL:** `/notifications`
- **Headers:** `Authorization: Bearer {token}`
- **Query Parameters:**
  - `page`: Page number
  - `limit`: Results per page
  - `unreadOnly`: "true" or "false"

### Get Single Notification
- **Method:** `GET`
- **URL:** `/notifications/{notificationId}`
- **Headers:** `Authorization: Bearer {token}`
- **Note:** Automatically marks as read

### Mark Notification as Read
- **Method:** `PUT`
- **URL:** `/notifications/{notificationId}/read`
- **Headers:** `Authorization: Bearer {token}`

### Mark All as Read
- **Method:** `PUT`
- **URL:** `/notifications/markall/read`
- **Headers:** `Authorization: Bearer {token}`

### Delete Notification
- **Method:** `DELETE`
- **URL:** `/notifications/{notificationId}`
- **Headers:** `Authorization: Bearer {token}`

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "message": "Error description"
}
```

**Common Status Codes:**
- `200 OK` - Success
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid input
- `401 Unauthorized` - No or invalid token
- `403 Forbidden` - Not authorized for this action
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

---

## Authentication

All endpoints (except registration and public profiles) require authentication.

**How to authenticate:**
1. Get a token from `/auth/register` or `/auth/login`
2. Include the token in all subsequent requests:
   ```
   Authorization: Bearer {token}
   ```

**Token Format:** JWT with 7-day expiration

---

## File Uploads

Resume files are stored in the `backend/uploads/` directory and served via:
`http://localhost:5000/uploads/{filename}`

**Supported formats:** PDF, DOCX, TXT

**Max file size:** 50MB (configurable in multer)

---

## AI Features

### Resume Parsing
When a resume is uploaded, it's automatically parsed using Google Gemini AI:
- Extracts skills, experience, education
- Provides quality score (0-100)
- Identifies strengths and improvement areas

### Interview Generation
When starting an interview:
- AI generates 5-10 job-specific questions
- Questions are based on job description and resume
- Difficulty levels: easy, medium, hard

### Answer Evaluation
For each interview answer:
- AI evaluates based on expected keywords and quality
- Provides feedback and score (0-100)
- Tracks answer quality metrics

### Final Feedback
After interview completion:
- AI generates overall performance review
- Provides hiring recommendation: hire/maybe/reject
- Average score calculation
- Detailed feedback for each answer

---

## Database Collections

1. **users** - User accounts with auth info
2. **profiles** - Extended user profile data
3. **jobs** - Job postings
4. **applications** - Job applications
5. **resumes** - Resume files and AI analysis
6. **interviews** - Interview sessions and Q&A
7. **savedjobs** - Bookmarked jobs
8. **notifications** - User notifications

---

## Environment Variables

```
MONGODB_URI=mongodb://localhost:27017/resumate
JWT_SECRET=your_jwt_secret_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GEMINI_API_KEY=your_gemini_api_key
PORT=5000
BASE_URL=http://localhost:5000
```

---

## Testing

Use tools like Postman or curl to test the endpoints:

```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"pass123","role":"job_seeker"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"pass123"}'

# Get profile (with token)
curl -X GET http://localhost:5000/api/profile/me \
  -H "Authorization: Bearer {token}"
```

---

**Last Updated:** 2024
**API Version:** 2.0
