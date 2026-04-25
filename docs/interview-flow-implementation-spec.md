# Interview Flow Implementation Spec (Recruiter -> Candidate -> Report -> Final Decision)

## 1) Product Flow (from your sketch)

### Actors
- Recruiter
- Job Seeker (Candidate)
- System (ResuMate)

### End-to-End Sequence
1. Candidate applies to a job.
2. Recruiter reviews applications and marks selected candidates as shortlisted.
3. Recruiter triggers interview invite for shortlisted candidate(s).
4. System generates job-specific interview session and sends notification/link to candidate.
5. Candidate opens interview session.
6. System serves interview questions adjusted to applied job (role, skills, seniority).
7. Candidate submits answers one-by-one.
8. System evaluates each answer and computes final interview report and score.
9. Recruiter views candidate report (score, strengths, improvement areas, recommendation).
10. Recruiter sends final outcome (approved/selected or rejected).
11. System sends final decision notification/email to candidate.

### State Machine

#### Application state
- applied -> reviewing -> shortlisted -> accepted OR rejected

#### Interview state
- pending -> in_progress -> completed

#### Interview invitation state
- pending -> scheduled -> completed OR cancelled

### Acceptance Criteria
- Only shortlisted/accepted candidates can receive interview invite.
- Interview questions must include role/context-aware technical content.
- Recruiter can view full report only after interview completion.
- Final decision action updates both application record and candidate notification history.

## 2) API + Data Model Blueprint

## 2.1 Existing APIs already aligned with this flow

### Application routes
- GET /api/applications/recommendations/jobs
- GET /api/applications
- POST /api/applications
- GET /api/applications/:applicationId
- DELETE /api/applications/:applicationId
- GET /api/applications/job/:jobId
- POST /api/applications/:jobId/shortlist
- PUT /api/applications/:applicationId/status

### Interview routes
- POST /api/interview/start
- POST /api/interview/submit-answer
- GET /api/interview/feedback/:interviewId
- GET /api/interview/my-interviews
- POST /api/interview/mock/create
- POST /api/interview/:interviewId/start-session
- GET /api/interview/:interviewId
- POST /api/interview/:interviewId/answer
- POST /api/interview/generate-questions
- POST /api/interview/schedule
- POST /api/interview/send-to-candidate
- GET /api/interview/recruiter/feedback/:interviewId

## 2.2 Recommended endpoint contract (to standardize UX)

### Recruiter: shortlist and invite

#### PUT /api/applications/:applicationId/status
Request:
{
  "status": "shortlisted",
  "recruiterFeedback": "Strong resume and skills fit"
}

Response:
{
  "success": true,
  "applicationId": "...",
  "status": "shortlisted"
}

#### POST /api/interview/send-to-candidate
Request:
{
  "applicationId": "...",
  "interviewDate": "2026-05-02T14:00:00.000Z",
  "interviewLink": "https://app/interview-session/<interviewId>"
}

Response:
{
  "success": true,
  "interviewId": "...",
  "message": "Interview link sent"
}

### Candidate: complete interview

#### GET /api/interview/:interviewId
Response:
{
  "success": true,
  "interview": {
    "_id": "...",
    "status": "pending",
    "jobTitle": "Frontend Developer",
    "questions": [
      {
        "questionId": 1,
        "question": "...",
        "category": "technical",
        "difficulty": "medium",
        "expectedKeywords": ["React", "state", "hooks"]
      }
    ]
  }
}

#### POST /api/interview/:interviewId/answer
Request:
{
  "questionId": 1,
  "answer": "Candidate answer text"
}

Response:
{
  "success": true,
  "score": 78,
  "feedback": "...",
  "progress": "1/10",
  "nextQuestion": { "questionId": 2, "question": "..." }
}

### Recruiter: review and decide

#### GET /api/interview/recruiter/feedback/:interviewId
Response:
{
  "success": true,
  "feedback": {
    "overallScore": 82,
    "performanceLevel": "Good",
    "summary": "...",
    "topStrengths": ["..."],
    "areasForImprovement": ["..."],
    "recommendation": "Proceed to offer"
  },
  "answers": []
}

#### PUT /api/applications/:applicationId/status
Request:
{
  "status": "accepted"
}
OR
{
  "status": "rejected",
  "recruiterFeedback": "Need stronger system design depth"
}

Response:
{
  "success": true,
  "status": "accepted"
}

## 2.3 Data model mapping (current + small additions)

### Current models already support most of the flow
- Application:
  - status (applied/reviewing/shortlisted/rejected/accepted)
  - interviewScheduled
  - interviewStatus (pending/scheduled/completed/cancelled)
  - recruiterFeedback
- Interview:
  - candidate, job
  - questions[]
  - answers[]
  - scores[]
  - status (pending/in_progress/completed)
  - finalFeedback

### Recommended additions for cleaner reporting/audit

#### Application additions
- finalDecisionAt: Date
- finalDecisionBy: ObjectId (User)
- finalDecisionNote: String

#### Interview additions
- invitedAt: Date
- invitedBy: ObjectId (User)
- sourceApplication: ObjectId (Application)
- reportSharedAt: Date

#### Notification/email audit (optional)
- channel: enum(email, in_app)
- deliveryStatus: enum(queued, sent, failed)
- templateKey: String

## 3) UI Screens and Route Map

## 3.1 Existing routes in frontend

### Job seeker
- /upload
- /analysis/:resumeId
- /jobs
- /job/:title
- /interview
- /interview/:jobId
- /interview-session/:interviewId
- /interview-report/:interviewId
- /recommendations

### Recruiter
- /recruiter
- /recruiter/jobs
- /recruiter/shortlist/:jobId

## 3.2 Screen-level behavior for this exact flow

### Recruiter Shortlist screen
- Show applicants grouped by status.
- Action: Shortlist candidate.
- Action: Send interview invite (date + generated interview link).
- Action: Open interview report when completed.
- Action: Final decision (accept/reject).

### Candidate Notification/Interview Entry
- Candidate sees interview invite in notifications.
- CTA opens /interview-session/:interviewId.

### Candidate Interview Interface
- Header adapts to applied job:
  - role title
  - company
  - required skills tags
  - progress (current/total)
- Question by question submission.
- Show per-question feedback/snippet if desired.

### Candidate Interview Report
- Overall score
- Category breakdown
- Top strengths
- Improvement areas
- Recommendation text

### Recruiter Report View
- Candidate profile summary
- Full Q/A transcript
- Final interview score and recommendation
- Buttons: Accept or Reject (with optional note)

## 3.3 Suggested route additions (optional, for clarity)
- /recruiter/interviews
- /recruiter/interviews/:interviewId
- /recruiter/applications/:applicationId/decision

## 4) Build Order (fastest implementation path)
1. Wire shortlist -> send-to-candidate from recruiter UI.
2. Ensure candidate can open interview from notification actionUrl.
3. Complete interview session loop (load, answer, progress, finish).
4. Render interview report for candidate and recruiter.
5. Add final decision action and notification/email trigger.
6. Add audit fields and logs for decision/report events.

## 5) Definition of Done
- Recruiter can shortlist and invite candidate from shortlist page.
- Candidate completes job-specific interview session.
- Interview report is generated and visible to recruiter.
- Recruiter can send final outcome (accepted/rejected).
- Candidate receives final outcome notification (and email if enabled).
