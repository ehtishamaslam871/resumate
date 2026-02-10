import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";
import { migrateLocalStorageToMongo, isMigrationNeeded } from "./services/migration.js";

// Import Pages
import Landing from "./Pages/Landing.jsx";
import ResumeUpload from "./Pages/ResumeUpload.jsx";
import Analysis from "./Pages/Analysis.jsx";
import Jobs from "./Pages/Jobs.jsx";
import Interview from "./Pages/Interview.jsx";
import AuthModal from "./Pages/Auth.jsx";
import InterviewBot from "./Pages/chatbot.jsx";
import Error404 from "./Pages/Error.jsx";
import About from "./Pages/About.jsx";
import Contact from "./Pages/Contact.jsx";
import Admin from "./Pages/Admin.jsx";
import RecruiterDashboard from "./Pages/RecruiterDashboard.jsx";
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
      {/* Public Routes */}
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/auth" element={<AuthRoute />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/upload"element={<ResumeUpload />}/>
      <Route path="/analysis/:resumeId"element={<Analysis />}/>
      <Route path="/jobs"element={<Jobs />}/>
      <Route path="/interview/:jobId"element={<Interview />}/>
      <Route path="/chatbot"element={<InterviewBot />}/>
      <Route path="/services" element={<Services />} />
      <Route path="/job/:title" element={<JobDetails />} />
      <Route path="*" element={<Error404 />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/recruiter" element={<RecruiterDashboard />} />
      <Route path="/profile" element={<Profile />} />

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
