import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "./index.css";

// Import Pages
import Landing from "./Pages/Landing.jsx";
import ResumeUpload from "./Pages/ResumeUpload.jsx";
import AuthModal from "./Pages/Auth.jsx";
import InterviewBot from "./Pages/chatbot.jsx";
import Error404 from "./Pages/Error.jsx";
import About from "./Pages/About.jsx";
import Contact from "./Pages/Contact.jsx";
import Analytics from "./Pages/Analytics.jsx";
import Admin from "./Pages/Admin.jsx";
import Recruiter from "./Pages/Recruiter.jsx";
import Profile from "./Pages/Profile.jsx";
import JobDetails from "./Pages/JobDetails.jsx";
import Services from "./Pages/Services.jsx";

function HomeRedirect() {
  try {
    const user = JSON.parse(localStorage.getItem('resumate_user') || 'null')
    if (user && user.role === 'admin') return <Admin />
    // optional: if recruiter send to recruiter page
    if (user && user.role === 'recruiter') return <Recruiter />
  } catch (e) {}
  return <Landing />
}

function AuthRoute() {
  try {
    const user = JSON.parse(localStorage.getItem('resumate_user') || 'null')
    if (user) {
      if (user.role === 'admin') return <Navigate to="/admin" replace />
      if (user.role === 'recruiter') return <Navigate to="/recruiter" replace />
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
      <Route path="/chatbot"element={<InterviewBot />}/>
      <Route path="/analysis"element={<Analytics />}/>
    <Route path="/services" element={<Services />} />
  <Route path="/job/:title" element={<JobDetails />} />
      <Route path="*" element={<Error404 />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/recruiter" element={<Recruiter />} />
      <Route path="/profile" element={<Profile />} />

    </Routes>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </React.StrictMode>
)
