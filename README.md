# 🚀 ResuMate

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](LICENSE)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/react-%3E%3D19.0.0-61dafb?logo=react)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0%2B-green?logo=mongodb)](https://www.mongodb.com/)

> **AI-Powered Resume Analysis & Interview Preparation Platform**

Transform your career journey with ResuMate—an intelligent platform designed to help job seekers optimize their resumes, match with relevant opportunities, and ace their interviews through AI-powered insights and real-time interview simulations.

![ResuMate Banner](https://img.shields.io/badge/Platform-Full%20Stack%20MERN-blue)
![Status](https://img.shields.io/badge/Status-Active%20Development-green)

---

## ✨ Features

### 🎯 Core Capabilities

- **📄 AI Resume Analysis**
  - Intelligent resume parsing and scoring
  - Skill extraction and gap identification
  - ATS-compliant formatting recommendations
  - Content improvement suggestions

- **💼 Smart Job Matching**
  - AI-powered job recommendations based on resume profile
  - Skill-to-job alignment analysis
  - Saved jobs management and tracking
  - Job application history

- **🎤 Interview Preparation**
  - Real-time mock interviews with AI
  - Interview performance scoring
  - Question bank covering multiple roles
  - Personalized interview feedback

- **👔 Recruiter Dashboard**
  - Post and manage job listings
  - Review and shortlist candidates
  - Application tracking system (ATS)
  - Candidate profile insights
  - Interview scheduling and management

- **👤 User Profiles**
  - Comprehensive resume management
  - Skill endorsements and verification
  - Professional network building
  - Interview history and analytics

- **🔐 Secure Authentication**
  - JWT-based authentication
  - Google OAuth 2.0 integration
  - Role-based access control (Admin, Recruiter, Candidate)
  - Password recovery and verification

---

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library with modern hooks
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first styling
- **React Router v7** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js + Express 5** - RESTful API server
- **MongoDB + Mongoose** - Document database with ODM
- **JWT + Passport.js** - Authentication & authorization
- **Socket.io** - Real-time communication
- **Multer** - File upload handling
- **PDF Parse + Mammoth** - Resume parsing

### AI & NLP
- **Python Model Server** - Dedicated ML inference server
- **spaCy** - Advanced NLP for resume parsing
- **Gemini/Groq APIs** - LLM integration for content generation

### DevOps & Tools
- **Docker** - Containerization
- **AWS S3** - Cloud storage
- **Redis** - Caching layer
- **Nodemailer** - Email notifications

---

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **MongoDB** (v5.0 or higher)
- **Python** (v3.8 or higher) - for model server
- **npm** or **yarn** package manager
- **Git** for version control

### API Keys Required
- Google OAuth credentials
- Gemini or Groq API keys
- AWS S3 credentials (optional)

---

## 🚀 Quick Start

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/ehtishamaslam871/resumate.git
cd resumate
```

### 2️⃣ Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your credentials:
# - MongoDB connection string
# - JWT secret
# - Google OAuth credentials
# - AI service API keys

# Start backend server
npm run dev
# Server runs on http://localhost:5000
```

### 3️⃣ Setup Frontend

```bash
cd ..

# Install dependencies
npm install

# Configure API endpoint
# Update src/services/api.js with your backend URL

# Start development server
npm run dev
# Frontend runs on http://localhost:5173
```

### 4️⃣ Setup Model Server (Optional)

```bash
cd model-server

# Install Python dependencies
pip install -r requirements.txt

# Run setup script (Windows)
setup.bat

# Start model server
python server.py
# Model server runs on http://localhost:8000
```

---

## 📁 Project Structure

```
resumate/
├── backend/                      # Express.js Server
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   ├── models/               # Mongoose schemas
│   │   ├── routes/               # API endpoints
│   │   ├── services/             # External services
│   │   ├── middlewares/          # Auth & role-based access
│   │   ├── config/               # Database & passport setup
│   │   └── utils/                # Helper functions
│   ├── uploads/                  # Resume storage
│   ├── package.json
│   └── .env.example
│
├── model-server/                 # Python ML Server
│   ├── server.py                 # Flask/FastAPI server
│   ├── spacy_parser.py           # Resume parsing logic
│   ├── requirements.txt
│   └── start.bat
│
├── src/                          # React Frontend
│   ├── components/               # Reusable components
│   ├── Pages/                    # Page components
│   ├── services/                 # API & utility services
│   ├── config/                   # Frontend config
│   ├── App.jsx
│   └── main.jsx
│
├── public/                       # Static assets
├── package.json                  # Frontend deps
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind setup
└── README.md
```

---

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/google-oauth` - Google OAuth callback
- `POST /api/auth/forgot-password` - Request password reset

### Resume Management
- `GET /api/resume` - Get user's resumes
- `POST /api/resume/upload` - Upload new resume
- `PUT /api/resume/:id` - Update resume
- `DELETE /api/resume/:id` - Delete resume
- `GET /api/resume/:id/analyze` - AI analysis

### Jobs
- `GET /api/jobs` - Browse all jobs
- `GET /api/jobs/:id` - Job details
- `POST /api/jobs` - Post new job (Recruiter only)
- `PUT /api/jobs/:id` - Update job (Recruiter only)

### Applications
- `POST /api/applications` - Submit application
- `GET /api/applications` - User applications
- `GET /api/applications/:id` - Application details
- `PUT /api/applications/:id/status` - Update status (Recruiter)

### Interviews
- `POST /api/interviews` - Schedule interview
- `GET /api/interviews` - User interviews
- `POST /api/interviews/:id/start` - Start mock interview
- `POST /api/interviews/:id/submit` - Submit interview results

### Matching & Recommendations
- `GET /api/matching/recommendations` - Get job recommendations
- `POST /api/matching/score` - Calculate job match score

---

## 🌍 Environment Variables

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/resumate

# Authentication
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI Services
GEMINI_API_KEY=your_gemini_api_key
GROQ_API_KEY=your_groq_api_key

# Email Service
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email
EMAIL_PASSWORD=your_email_password

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=your_s3_bucket_name

# Redis
REDIS_URL=redis://localhost:6379
```

---

## Railway Deployment

This repository is ready for Railway as a multi-service project.

### Services to Create

1. Frontend service
  - Root directory: repository root (`/`)
  - Uses `railway.toml` in the root

2. Backend service
  - Root directory: `backend`
  - Uses `backend/railway.toml`

3. Model server service (optional)
  - Root directory: `model-server`
  - Uses `model-server/railway.toml`

### Recommended Deployment Order

1. Deploy backend service first.
2. Copy backend Railway URL (for example: `https://resumate-backend.up.railway.app`).
3. Deploy frontend with `VITE_API_URL` set to `<backend-url>/api`.
4. If using local LLM endpoints, deploy model-server and set backend `MODEL_SERVER_URL`.

### Backend Environment Variables (Railway)

Set these in the backend Railway service:

- `NODE_ENV=production`
- `MONGODB_URI=<your-mongodb-uri>`
- `JWT_SECRET=<strong-random-secret>`
- `CLIENT_URL=<your-frontend-railway-url>`
- `FRONTEND_URL=<your-frontend-railway-url>`
- `CORS_ORIGINS=<your-frontend-railway-url>,https://localhost:5173`
- `BASE_URL=<your-backend-railway-url>`
- `MODEL_SERVER_URL=<your-model-server-railway-url>` (optional)
- `CLERK_SECRET_KEY=<your-clerk-secret>` (if Clerk is enabled)

### Frontend Environment Variables (Railway)

Set these in the frontend Railway service:

- `VITE_API_URL=<your-backend-railway-url>/api`
- `VITE_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>` (if Clerk is enabled)

### Model Server Variables (Optional)

Set these in the model-server Railway service (only if you deploy it):

- `RESUME_PARSER_MODE=regex` (recommended default on Railway)
- `OLLAMA_URL=<ollama-endpoint>` (only if you have a reachable Ollama host)
- `PRIMARY_MODEL=<model-name>`
- `FALLBACK_MODEL=<model-name>`

### Verification Checklist

After deploy, verify:

1. Backend health: `GET <backend-url>/`
2. Model health (if deployed): `GET <model-url>/health`
3. Frontend loads and can authenticate.
4. Resume upload and job APIs work from the deployed frontend.

---

## 🧪 Testing

### Run Linter
```bash
npm run lint
```

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

---

## 🔄 Development Workflow

### Starting All Services

**Terminal 1 - Backend**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend**
```bash
npm run dev
```

**Terminal 3 - Model Server (Optional)**
```bash
cd model-server
python server.py
```

### Hot Module Reload
- Frontend: Automatic with Vite
- Backend: Automatic with Nodemon
- Model Server: Requires manual restart

---

## 📊 Key Features Breakdown

### For Job Seekers
1. **Resume Optimization** - Get AI-powered suggestions to improve your resume
2. **Job Discovery** - Find relevant opportunities matched to your skills
3. **Interview Prep** - Practice with AI-powered mock interviews
4. **Application Tracking** - Track all your applications in one place
5. **Profile Building** - Create a comprehensive professional profile

### For Recruiters
1. **Job Posting** - Easily post and manage job listings
2. **Candidate Screening** - AI-assisted resume review and ranking
3. **Candidate Shortlisting** - Organize and manage candidate pipelines
4. **Interview Scheduling** - Coordinate interviews seamlessly
5. **Candidate Analytics** - View detailed candidate profiles and insights

### For Admins
1. **Platform Management** - Oversee all users and content
2. **User Management** - Manage roles and permissions
3. **Content Moderation** - Review and manage platform content
4. **Analytics Dashboard** - View platform statistics and metrics

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write clear commit messages
- Test your changes thoroughly
- Update documentation as needed
- Add comments for complex logic

---

## 🐛 Known Issues

- Model server requires Python to be installed separately
- Resume parsing accuracy depends on document format
- Real-time features require stable WebSocket connection

---

## 🗺️ Roadmap

- [ ] Video interview capability
- [ ] Mobile app (React Native)
- [ ] Interview salary negotiation guide
- [ ] Advanced analytics dashboard
- [ ] Integration with ATS platforms
- [ ] Multilingual support
- [ ] LinkedIn profile sync
- [ ] Resume template builder

---

## 📜 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💼 Authors

- **ResuMate Team** - AI-Powered Career Platform
- Contributors and maintainers worldwide

---

## 📞 Support & Contact

- **GitHub Issues** - [Report bugs or request features](https://github.com/ehtishamaslam871/resumate/issues)
- **Email** - ehtishamaslam871@gmail.com
- **Documentation** - Check the [docs](./DEPLOYMENT_GUIDE.md) folder

---

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by AI and machine learning
- Community feedback and contributions
- Open-source libraries and frameworks

---

## 📈 Statistics

![GitHub Stars](https://img.shields.io/github/stars/ehtishamaslam871/resumate?style=social)
![GitHub Forks](https://img.shields.io/github/forks/ehtishamaslam871/resumate?style=social)
![GitHub Watchers](https://img.shields.io/github/watchers/ehtishamaslam871/resumate?style=social)

---

<div align="center">

### 🌟 If you found ResuMate helpful, please give it a ⭐ on GitHub!

**Made with ❤️ for career advancement**

</div>
