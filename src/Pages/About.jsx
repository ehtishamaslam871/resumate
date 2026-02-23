import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AboutImage from "../assets/ABOUT.png";
import { Sparkles, Trophy, Zap, Users } from "lucide-react";

const About = () => {
  const features = [
    { icon: Zap, title: "Lightning Fast", desc: "AI-powered resume analysis in seconds", color: "text-neon-cyan", bg: "bg-neon-cyan/10" },
    { icon: Trophy, title: "High Success Rate", desc: "95% of users get interviews within 30 days", color: "text-neon-purple", bg: "bg-neon-purple/10" },
    { icon: Users, title: "Expert Community", desc: "Learn from industry professionals", color: "text-neon-blue", bg: "bg-neon-blue/10" },
    { icon: Sparkles, title: "Smart Matching", desc: "Perfect job matches based on your skills", color: "text-neon-pink", bg: "bg-neon-pink/10" },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center mb-20">
          {/* Left Content */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-extrabold text-lg">
                  RM
                </div>
                <span className="text-gradient font-bold text-2xl">ResuMate</span>
              </div>

              <h1 className="text-5xl font-bold text-gray-100 mb-6">
                About ResuMate
              </h1>

              <p className="text-gray-300 text-lg leading-relaxed mb-4">
                We help job seekers create better resumes and find their dream jobs through cutting-edge AI technology.
              </p>

              <p className="text-gray-400 leading-relaxed mb-4">
                Our platform uses smart algorithms to analyze your skills, suggest improvements, and match you with the right opportunities.
              </p>

              <p className="text-gray-400 leading-relaxed">
                Join thousands of users who have found success with our resume builder and job matching services.
              </p>
            </div>

            <div className="flex gap-4 pt-4">
              <Link to="/services" className="btn-primary">
                Our Services
              </Link>

              <Link to="/contact" className="btn-secondary">
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex justify-center">
            <div className="card-glass-hover p-8 w-full">
              <img
                src={AboutImage}
                alt="About ResuMate"
                className="w-full rounded-lg transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="mb-20">
          <h2 className="text-4xl font-bold text-gray-100 mb-12 text-center">Why Choose ResuMate?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              const colors = [
                "border-neon-cyan/30",
                "border-neon-purple/30",
                "border-neon-blue/30",
                "border-neon-pink/30"
              ];
              return (
                <div key={idx} className={`card-glass-hover p-6 border ${colors[idx]}`}>
                  <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-100 mb-2">{feature.title}</h3>
                  <p className="text-gray-400 text-sm">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="card-glass-hover p-12 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink" />
          <h2 className="text-3xl font-bold text-gray-100 mb-4">Ready to Transform Your Career?</h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">Start analyzing your resume and discovering perfect job matches today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/upload" className="btn-primary">Get Started</Link>
            <Link to="/jobs" className="btn-secondary">Browse Jobs</Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;