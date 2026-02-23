import React from "react";
import Navbar from "../components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { Brain, Target, MessageCircle, ArrowRight, Briefcase, Users, BarChart3, Shield } from "lucide-react";
import { isAuthenticated, getUserRole } from '../config/permissions';

export default function Services() {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();
  const userRole = getUserRole();

  const handleProtectedLink = (e, path, role) => {
    e.preventDefault();
    if (!authenticated) { navigate('/auth'); return; }
    if (role && userRole !== role) return; // silently block
    navigate(path);
  };

  const allServices = [
    // Job Seeker
    { id: 1, icon: Brain, title: "AI Resume Analyzer", desc: "Automated resume parsing and scoring with tailored improvement suggestions and intelligent job matching.", tech: ["React", "Tailwind", "Node.js", "AI"], link: "/upload", color: "from-neon-cyan to-neon-blue", role: "jobseeker", roleLabel: "Job Seeker" },
    { id: 2, icon: Target, title: "Smart Job Matcher", desc: "Intelligent job matching engine that recommends roles based on your skills and professional experience.", tech: ["Python", "ML", "MongoDB"], link: "/jobs", color: "from-neon-purple to-neon-pink", role: "jobseeker", roleLabel: "Job Seeker" },
    { id: 3, icon: MessageCircle, title: "Interview Practice Bot", desc: "Interactive interview preparation bot that provides real-time feedback and suggested talking points.", tech: ["React", "WebSockets", "NLP"], link: "/chatbot", color: "from-neon-pink to-neon-green", role: "jobseeker", roleLabel: "Job Seeker" },
    // Recruiter
    { id: 4, icon: Briefcase, title: "Job Posting Manager", desc: "Create and manage job postings with detailed descriptions, requirements, and salary information.", tech: ["React", "MongoDB", "REST API"], link: "/recruiter", color: "from-neon-green to-neon-cyan", role: "recruiter", roleLabel: "Recruiter" },
    { id: 5, icon: Users, title: "Applicant Management", desc: "View, filter, and manage job applicants. Review resumes, approve or reject candidates efficiently.", tech: ["React", "Node.js", "MongoDB"], link: "/recruiter", color: "from-neon-blue to-neon-purple", role: "recruiter", roleLabel: "Recruiter" },
    { id: 6, icon: BarChart3, title: "AI Shortlisting", desc: "Automatically shortlist top candidates with 80%+ resume match scores using AI-powered analysis.", tech: ["AI", "ML", "Node.js"], link: "/recruiter", color: "from-neon-cyan to-neon-green", role: "recruiter", roleLabel: "Recruiter" },
    // Admin
    { id: 7, icon: Shield, title: "Admin Dashboard", desc: "Full system management — monitor users, jobs, applications, and platform analytics.", tech: ["React", "MongoDB", "Analytics"], link: "/admin", color: "from-red-500 to-orange-500", role: "admin", roleLabel: "Admin" },
  ];

  // Show only current role's services when logged in, all when guest
  const visibleServices = authenticated ? allServices.filter(s => s.role === userRole) : allServices;

  // CTA buttons for each role
  const getCTAButtons = () => {
    if (!authenticated || userRole === 'jobseeker') {
      return (
        <>
          <button onClick={(e) => handleProtectedLink(e, '/upload', 'jobseeker')} className="btn-primary">Analyze Your Resume</button>
          <button onClick={(e) => handleProtectedLink(e, '/jobs', 'jobseeker')} className="btn-secondary">Browse Jobs</button>
        </>
      );
    }
    if (userRole === 'recruiter') {
      return <button onClick={(e) => handleProtectedLink(e, '/recruiter', 'recruiter')} className="btn-primary">Go to Dashboard</button>;
    }
    if (userRole === 'admin') {
      return <button onClick={(e) => handleProtectedLink(e, '/admin', 'admin')} className="btn-primary">Admin Dashboard</button>;
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-100 mb-6">Our Services</h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            {authenticated
              ? `Features available for your ${userRole === 'jobseeker' ? 'Job Seeker' : userRole === 'recruiter' ? 'Recruiter' : 'Admin'} account.`
              : 'A showcase of features and projects that power ResuMate — built to help candidates find better matches and prepare for interviews.'}
          </p>
        </header>

        {/* Role Badge */}
        {authenticated && (
          <div className="flex justify-center mb-10">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
              userRole === 'jobseeker' ? 'bg-neon-cyan/15 text-neon-cyan border border-neon-cyan/30' :
              userRole === 'recruiter' ? 'bg-neon-purple/15 text-neon-purple border border-neon-purple/30' :
              'bg-red-500/15 text-red-400 border border-red-500/30'
            }`}>
              Signed in as {userRole === 'jobseeker' ? 'Job Seeker' : userRole === 'recruiter' ? 'Recruiter' : 'Admin'}
            </span>
          </div>
        )}

        {/* Services Grid */}
        <section className={`grid md:grid-cols-2 ${visibleServices.length >= 3 ? 'lg:grid-cols-3' : ''} gap-8 mb-20`}>
          {visibleServices.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.id} onClick={(e) => handleProtectedLink(e, p.link, p.role)} className="cursor-pointer">
                <article className="card-glass-hover p-8 h-full flex flex-col group border border-dark-700/50 hover:border-neon-cyan/30 relative">
                  {/* Role badge on card (only for guests) */}
                  {!authenticated && (
                    <span className={`absolute top-4 right-4 text-[10px] px-2.5 py-1 rounded-full font-semibold ${
                      p.role === 'jobseeker' ? 'bg-neon-cyan/15 text-neon-cyan' :
                      p.role === 'recruiter' ? 'bg-neon-purple/15 text-neon-purple' :
                      'bg-red-500/15 text-red-400'
                    }`}>
                      {p.roleLabel}
                    </span>
                  )}

                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${p.color} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-dark-950" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-neon-cyan transition">{p.title}</h3>
                  <p className="text-gray-400 text-sm flex-grow mb-6">{p.desc}</p>

                  <div className="flex flex-wrap gap-2 mb-6">
                    {p.tech.map((t) => (
                      <span key={t} className="text-xs badge-primary">{t}</span>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-neon-cyan font-semibold group-hover:gap-3 transition-all">
                    <span>{authenticated ? 'Open' : 'Try Now'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </article>
              </div>
            );
          })}
        </section>

        {/* CTA Section */}
        <section className="card-glass p-12 text-center border border-neon-cyan/20">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">
            {authenticated ? 'Quick Actions' : 'Ready to Get Started?'}
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            {authenticated
              ? 'Jump directly to your most-used features.'
              : 'Experience the power of AI-driven resume analysis and intelligent job matching.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {getCTAButtons()}
          </div>
        </section>
      </main>
    </div>
  );
}
