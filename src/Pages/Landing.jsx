import React from 'react'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import HeroImage from '../assets/image.png'

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gray-900 text-white overflow-hidden">
      <Navbar />

      {/* Soft decorative gradient blobs (keep color theme) */}
      <div className="pointer-events-none absolute -top-28 -left-20 w-72 h-72 bg-gradient-to-br from-cyan-500 to-teal-400 opacity-20 rounded-full filter blur-3xl transform -rotate-12"></div>
      <div className="pointer-events-none absolute -bottom-32 -right-20 w-96 h-96 bg-gradient-to-br from-cyan-500 to-teal-400 opacity-10 rounded-full filter blur-3xl transform rotate-12"></div>

  {/* add top padding so content sits below fixed navbar */}
  <main className="max-w-6xl mx-auto px-6 pt-32 pb-20 relative z-10">
        {/* Hero Section */}
        <section className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 max-w-xl">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-gray-900 font-extrabold shadow-lg">
                RM
              </div>
              <span className="text-cyan-300 font-medium">ResuMate</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              Analyze your Resume and Get Hired Faster
            </h1>

            <p className="text-cyan-300 text-sm sm:text-base md:text-lg">
              AI-powered Resume Analyzer and job matching
            </p>

            <p className="text-gray-300 text-sm sm:text-base md:text-lg max-w-xl">
              Upload your resume or create a new one, get AI suggestions, and find your perfect job match — professionally formatted and optimized.
            </p>

            <div className="flex flex-wrap gap-4 items-center">
              <Link
                to="/auth"
                className="px-5 py-2 sm:px-6 sm:py-3 bg-cyan-500 text-gray-900 rounded-lg font-medium hover:bg-cyan-600 shadow-md transition transform hover:-translate-y-0.5 text-sm sm:text-base"
              >
                Get Started
              </Link>

              <Link
                to="/auth"
                className="px-4 py-2 sm:px-6 sm:py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800 transition text-sm sm:text-base"
              >
                Upload Resume
              </Link>

              <span className="ml-0 sm:ml-4 text-sm text-gray-400">Trusted by <strong className="text-cyan-300">10k+</strong> job seekers</span>
            </div>

            <div className="mt-4 flex gap-6 text-sm text-gray-400">
              <div className="flex flex-col">
                <span className="text-cyan-300 font-semibold">98%</span>
                <span>Interview rate</span>
              </div>
              <div className="flex flex-col">
                <span className="text-cyan-300 font-semibold">1min</span>
                <span>Average match time</span>
              </div>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex justify-center">
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-2xl transition transform hover:scale-105 max-w-sm md:max-w-md">
              <img
                src={HeroImage}
                alt="ResuMate App Preview"
                className="w-full rounded-lg object-cover"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-8">How It Works</h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🛠️', title: 'Create', desc: 'Build professional resumes with AI suggestions and industry templates.' },
              { icon: '🔎', title: 'Match', desc: 'Find jobs that match your skills and experience using AI-driven scoring.' },
              { icon: '🎯', title: 'Practice', desc: 'Prepare for interviews with AI-powered mock interviews and feedback.' }
            ].map((f, i) => (
              <div key={i} className="bg-gray-800 p-6 rounded-lg text-center border border-gray-700 hover:shadow-lg transition transform hover:-translate-y-1 flex flex-col items-center">
                <div className="text-3xl sm:text-4xl mb-3">{f.icon}</div>
                <div className="text-xl sm:text-2xl font-bold text-cyan-400 mb-3">{f.title}</div>
                <p className="text-gray-300 text-sm sm:text-base max-w-xs">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mt-16">
          <h3 className="text-2xl font-bold text-center text-white mb-6">What users say</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-300">"I got 3 interview calls in 2 weeks after updating my resume with ResuMate. The AI suggestions are spot on."</p>
              <div className="mt-4 text-sm text-gray-400">— Sarah, Product Manager</div>
            </div>

            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <p className="text-gray-300">"The matching feature saved me so much time. Matched me with roles that fit my background perfectly."</p>
              <div className="mt-4 text-sm text-gray-400">— Daniel, Frontend Engineer</div>
            </div>
          </div>
        </section>

        
      </main>


      <footer className="bg-gray-800 py-8 text-center text-gray-400 border-t border-gray-700 relative z-10">
        <p>© {new Date().getFullYear()} ResuMate — All rights reserved.</p>
      </footer>
    </div>
  )
}