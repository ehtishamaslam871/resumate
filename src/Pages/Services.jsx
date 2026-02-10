import React from "react";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { Brain, Target, MessageCircle, ArrowRight } from "lucide-react";

export default function Services() {
  const projects = [
    {
      id: 1,
      icon: Brain,
      title: "AI Resume Analyzer",
      desc: "Automated resume parsing and scoring with tailored improvement suggestions and intelligent job matching.",
      tech: ["React", "Tailwind", "Node.js", "AI"],
      link: "/upload",
      color: "from-neon-cyan to-neon-blue"
    },
    {
      id: 2,
      icon: Target,
      title: "Smart Job Matcher",
      desc: "Intelligent job matching engine that recommends roles based on your skills and professional experience.",
      tech: ["Python", "ML", "MongoDB"],
      link: "/jobs",
      color: "from-neon-purple to-neon-pink"
    },
    {
      id: 3,
      icon: MessageCircle,
      title: "Interview Practice Bot",
      desc: "Interactive interview preparation bot that provides real-time feedback and suggested talking points.",
      tech: ["React", "WebSockets", "NLP"],
      link: "/chatbot",
      color: "from-neon-pink to-neon-green"
    },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-6 py-24">
        {/* Header */}
        <header className="text-center mb-20">
          <h1 className="text-5xl font-bold text-gray-100 mb-6">Our Services</h1>
          <p className="text-gray-400 text-xl max-w-3xl mx-auto leading-relaxed">
            A showcase of features and projects that power ResuMate — built to help candidates find better matches and prepare for interviews.
          </p>
        </header>

        {/* Services Grid */}
        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {projects.map((p) => {
            const Icon = p.icon;
            return (
              <Link to={p.link} key={p.id}>
                <article className="card-glass-hover p-8 h-full flex flex-col group border border-dark-700/50 hover:border-neon-cyan/30">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-lg bg-gradient-to-br ${p.color} p-3 mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-full h-full text-dark-950" />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-gray-100 mb-3 group-hover:text-neon-cyan transition">{p.title}</h3>
                  <p className="text-gray-400 text-sm flex-grow mb-6">{p.desc}</p>

                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {p.tech.map((t) => (
                      <span key={t} className="text-xs badge-primary">{t}</span>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="flex items-center gap-2 text-neon-cyan font-semibold group-hover:gap-3 transition-all">
                    <span>Try Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </article>
              </Link>
            );
          })}
        </section>

        {/* CTA Section */}
        <section className="card-glass p-12 text-center border border-neon-cyan/20">
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Get Started?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Experience the power of AI-driven resume analysis and intelligent job matching.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload" className="btn-primary">
              Analyze Your Resume
            </Link>
            <Link to="/jobs" className="btn-secondary">
              Browse Jobs
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
