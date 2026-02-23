import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { migrateLocalStorageToMongo, isMigrationNeeded } from "./services/migration.js";

// RBAC
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { isAuthenticated, getUserRole } from "./config/permissions.js";

// Import Pages
import Landing from "./Pages/Landing.jsx";
import ResumeUpload from "./Pages/ResumeUpload.jsx";
import Analysis from "./Pages/Analysis.jsx";
import Jobs from "./Pages/Jobs.jsx";
import Interview from "./Pages/Interview.jsx";
import InterviewInterface from "./Pages/InterviewInterface.jsx";
import AuthModal from "./Pages/Auth.jsx";
import InterviewBot from "./Pages/chatbot.jsx";
import Error404 from "./Pages/Error.jsx";
import About from "./Pages/About.jsx";
import Contact from "./Pages/Contact.jsx";
import Admin from "./Pages/Admin.jsx";
import RecruiterDashboard from "./Pages/RecruiterDashboard.jsx";
import RecruiterJobs from "./Pages/RecruiterJobs.jsx";
import RecruiterShortlist from "./Pages/RecruiterShortlist.jsx";
import JobRecommendations from "./Pages/JobRecommendations.jsx";
import Profile from "./Pages/Profile.jsx";
import JobDetails from "./Pages/JobDetails.jsx";
import Services from "./Pages/Services.jsx";

function HomeRedirect() {
  try {
    // Check both new API key ('user') and old demo key ('resumate_user') for backward compatibility
    let user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      user = JSON.parse(localStorage.getItem('resumate_user') || 'null')
    }
    
    if (user && user.role) {
      const role = user.role.toLowerCase()
      if (role === 'admin') return <Admin />
      if (role === 'recruiter') return <RecruiterDashboard />
    }
  } catch (e) {}
  return <Landing />
}

function AuthRoute() {
  try {
    // Check both new API key ('user') and old demo key ('resumate_user') for backward compatibility
    let user = JSON.parse(localStorage.getItem('user') || 'null')
    if (!user) {
      user = JSON.parse(localStorage.getItem('resumate_user') || 'null')
    }
    
    if (user) {
      const role = user.role ? user.role.toLowerCase() : ''
      if (role === 'admin') return <Navigate to="/admin" replace />
      if (role === 'recruiter') return <Navigate to="/recruiter" replace />
      if (role === 'job_seeker' || role === 'job seeker') return <Navigate to="/upload" replace />
      // If authenticated but role unclear, redirect to profile
      return <Navigate to="/profile" replace />
    }
  } catch (e) {}
  return <AuthModal />
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes — no auth required */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/services" element={<Services />} />
      <Route path="*" element={<Error404 />} />

      {/* Job Seeker Only */}
      <Route path="/upload" element={<ProtectedRoute requiredRole="jobseeker"><ResumeUpload /></ProtectedRoute>} />
      <Route path="/analysis/:resumeId" element={<ProtectedRoute requiredRole="jobseeker"><Analysis /></ProtectedRoute>} />
      <Route path="/jobs" element={<ProtectedRoute requiredRole="jobseeker"><Jobs /></ProtectedRoute>} />
      <Route path="/job/:title" element={<ProtectedRoute requiredRole="jobseeker"><JobDetails /></ProtectedRoute>} />
      <Route path="/interview/:jobId" element={<ProtectedRoute requiredRole="jobseeker"><Interview /></ProtectedRoute>} />
      <Route path="/interview-session/:interviewId" element={<ProtectedRoute requiredRole="jobseeker"><InterviewInterface /></ProtectedRoute>} />
      <Route path="/chatbot" element={<ProtectedRoute><InterviewBot /></ProtectedRoute>} />
      <Route path="/recommendations" element={<ProtectedRoute requiredRole="jobseeker"><JobRecommendations /></ProtectedRoute>} />

      {/* Recruiter Only */}
      <Route path="/recruiter" element={<ProtectedRoute requiredRole="recruiter"><RecruiterDashboard /></ProtectedRoute>} />
      <Route path="/recruiter/jobs" element={<ProtectedRoute requiredRole="recruiter"><RecruiterJobs /></ProtectedRoute>} />
      <Route path="/recruiter/shortlist/:jobId" element={<ProtectedRoute requiredRole="recruiter"><RecruiterShortlist /></ProtectedRoute>} />

      {/* Admin Only */}
      <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>} />

      {/* Any Authenticated User */}
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
    </Routes>
  );
}

// Migration wrapper to handle sync on app load
function AppWrapper() {
  const [migrationDone, setMigrationDone] = useState(false);

  useEffect(() => {
    const runMigration = async () => {
      if (isMigrationNeeded()) {
        console.log('⏳ Syncing your data with MongoDB...');
        await migrateLocalStorageToMongo();
      }
      setMigrationDone(true);
    };

    runMigration();
  }, []);

  if (!migrationDone) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#020617',
        color: '#06b6d4',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div>
          <h2>Syncing your data...</h2>
          <p>Connecting to MongoDB Atlas</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>
)
