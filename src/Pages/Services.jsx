import React from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Services() {
  const navigate = useNavigate();

  const projects = [
    {
      id: 1,
      title: "ResuMate — AI Resume Analyzer",
      desc: "Automated resume parsing and scoring with tailored improvement suggestions and job matching.",
      tech: ["React", "Tailwind", "Node.js", "AI"],
      link: "/analysis",
    },
    {
      id: 2,
      title: "Smart Job Matcher",
      desc: "Intelligent job matching engine that recommends roles based on skills and experience.",
      tech: ["Python", "ML", "MongoDB"],
      link: "/recruiter",
    },
    {
      id: 3,
      title: "Interview Bot",
      desc: "Interactive interview practice bot that provides feedback and suggested talking points.",
      tech: ["React", "WebSockets", "NLP"],
      link: "/chatbot",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-24">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-cyan-300">Our Projects</h1>
          <p className="mt-3 text-gray-300 max-w-2xl mx-auto">A showcase of features and projects that power ResuMate — built to help candidates find better matches and prepare for interviews.</p>
        </header>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => (
            <article key={p.id} className="bg-gray-800 p-6 rounded-2xl border border-gray-700 hover:shadow-xl transform hover:-translate-y-1 transition">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-cyan-300">{p.title}</h3>
                  <p className="text-gray-300 mt-2 text-sm">{p.desc}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {p.tech.map((t) => (
                      <span key={t} className="text-sm bg-cyan-500/10 text-cyan-300 px-2 py-1 rounded-full">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>

        <div className="mt-12 text-center text-gray-400">Want to demo any of these? Login and visit their pages to try the live flows.</div>
      </main>
    </div>
  );
}
