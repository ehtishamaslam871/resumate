import React from 'react'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Sparkles, Target, Users, TrendingUp } from 'lucide-react'

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Sparkles,
      title: 'AI-Powered Analysis',
      description: 'Get instant feedback on your resume with advanced AI algorithms'
    },
    {
      icon: Target,
      title: 'Smart Job Matching',
      description: 'Find positions perfectly aligned with your skills and experience'
    },
    {
      icon: TrendingUp,
      title: 'Career Growth',
      description: 'Optimize your profile and track your professional development'
    }
  ];

  const stats = [
    { value: '10K+', label: 'Active Job Seekers' },
    { value: '95%', label: 'Success Rate' },
    { value: '2M+', label: 'Jobs Matched' }
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white">
      <Navbar />

      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-neon-cyan/30 to-neon-purple/30 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-neon-purple/30 to-neon-pink/30 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-[90vh] flex items-center justify-center pt-20 px-6">
          <div className="max-w-6xl w-full">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8 animate-fade-in">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full">
                    <Zap className="w-4 h-4 text-neon-cyan" />
                    <span className="text-neon-cyan text-sm font-semibold">AI-Powered Resume Analyzer</span>
                  </div>
                  
                  <h1 className="text-6xl md:text-7xl font-display font-bold leading-tight">
                    Get Hired
                    <br />
                    <span className="bg-gradient-to-r from-neon-cyan via-neon-purple to-neon-pink bg-clip-text text-transparent">Faster</span>
                  </h1>

                  <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
                    Analyze your resume with AI, match with perfect opportunities, and land your dream job with intelligent insights and real-time feedback.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary group flex items-center justify-center gap-2 py-4 px-8 text-lg"
                  >
                    Get Started Now
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    to="/about"
                    className="btn-secondary flex items-center justify-center gap-2 py-4 px-8 text-lg"
                  >
                    Learn More
                  </Link>
                </div>

                {/* Trust Badges */}
                <div className="pt-8 border-t border-dark-700/50">
                  <p className="text-sm text-gray-500 mb-6 font-semibold">Trusted by thousands of professionals</p>
                  <div className="grid grid-cols-3 gap-8">
                    {stats.map((stat, i) => (
                      <div key={i} className="group">
                        <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent">{stat.value}</p>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="hidden md:flex items-center justify-center relative">
                <div className="relative w-full max-w-lg">
                  {/* Main glowing card */}
                  <div className="card-glass-hover p-8 border border-neon-cyan/20 hover:border-neon-cyan/50 transform hover:scale-105 transition-all duration-300 animate-glow">
                    <div className="bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 h-72 rounded-xl flex items-center justify-center border border-neon-cyan/30 mb-6 group">
                      <div className="text-center">
                        <Sparkles className="w-24 h-24 text-neon-cyan mx-auto mb-4 animate-bounce" />
                        <p className="text-gray-400 font-semibold">AI Analysis in Progress</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-400">Resume Score</p>
                          <p className="text-sm font-bold text-neon-cyan">92/100</p>
                        </div>
                        <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden border border-dark-700/50">
                          <div className="h-full bg-gradient-to-r from-neon-cyan to-neon-purple w-[92%]"></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm text-gray-400">Job Match</p>
                          <p className="text-sm font-bold text-neon-purple">87/100</p>
                        </div>
                        <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden border border-dark-700/50">
                          <div className="h-full bg-gradient-to-r from-neon-purple to-neon-pink w-[87%]"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating stat cards */}
                  <div className="absolute -top-6 -right-6 card-glass p-4 rounded-lg border border-neon-cyan/30 shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/40 transition-all">
                    <p className="text-3xl font-bold text-neon-cyan">95%</p>
                    <p className="text-xs text-gray-400 mt-1">Match Rate</p>
                  </div>
                  <div className="absolute -bottom-6 -left-6 card-glass p-4 rounded-lg border border-neon-purple/30 shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40 transition-all">
                    <p className="text-3xl font-bold text-neon-purple">2.5s</p>
                    <p className="text-xs text-gray-400 mt-1">Analysis Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 px-6 bg-gradient-to-b from-transparent via-dark-950/50 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20 animate-fade-in">
              <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 text-gray-100">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                Everything you need to succeed in your job search with cutting-edge AI technology
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 mb-12">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={i}
                    className="card-glass-hover p-8 group h-full"
                  >
                    <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-neon-cyan/20">
                      <Icon className="w-7 h-7 text-dark-950" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-100 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-400 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="mt-6 pt-6 border-t border-dark-700/30 flex items-center gap-2 text-neon-cyan group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-semibold">Learn more</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional benefits grid */}
            <div className="mt-16 grid md:grid-cols-2 gap-6">
              <div className="card-glass p-6 border-l-2 border-neon-cyan/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100 mb-2">Instant Feedback</h4>
                    <p className="text-sm text-gray-400">Get detailed analysis of your resume in seconds with actionable recommendations</p>
                  </div>
                </div>
              </div>
              <div className="card-glass p-6 border-l-2 border-neon-purple/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neon-purple/20 flex items-center justify-center flex-shrink-0">
                    <Target className="w-5 h-5 text-neon-purple" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100 mb-2">Targeted Matches</h4>
                    <p className="text-sm text-gray-400">Discover job opportunities perfectly aligned with your skills and career goals</p>
                  </div>
                </div>
              </div>
              <div className="card-glass p-6 border-l-2 border-neon-pink/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neon-pink/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-5 h-5 text-neon-pink" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100 mb-2">Career Growth</h4>
                    <p className="text-sm text-gray-400">Track progress and identify skill gaps to advance your professional development</p>
                  </div>
                </div>
              </div>
              <div className="card-glass p-6 border-l-2 border-neon-blue/50">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-neon-blue/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-5 h-5 text-neon-blue" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-100 mb-2">Expert Community</h4>
                    <p className="text-sm text-gray-400">Connect with thousands of professionals and get insights from industry experts</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="gradient-purple rounded-2xl p-12 md:p-20 border border-neon-purple/50 text-center relative overflow-hidden">
              {/* Background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-neon-purple/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-neon-pink/20 rounded-full blur-3xl"></div>
              </div>

              <div className="relative z-10">
                <h2 className="text-5xl md:text-6xl font-display font-bold mb-6 text-gray-100">
                  Ready to Transform Your Career?
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                  Join thousands of professionals who've already landed their dream jobs using ResuMate's AI-powered platform
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary group text-lg py-4 px-10"
                  >
                    Start Your Journey
                    <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    to="/about"
                    className="btn-secondary text-lg py-4 px-10 flex items-center justify-center"
                  >
                    See How It Works
                  </Link>
                </div>

                {/* Trust indicators */}
                <div className="mt-12 pt-8 border-t border-white/10 grid grid-cols-3 gap-6 md:gap-12">
                  <div>
                    <p className="text-3xl font-bold text-white">10K+</p>
                    <p className="text-sm text-gray-300 mt-1">Active Members</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">95%</p>
                    <p className="text-sm text-gray-300 mt-1">Success Rate</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">2M+</p>
                    <p className="text-sm text-gray-300 mt-1">Jobs Matched</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-dark-700/50 py-16 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-12 mb-12">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold">
                    RM
                  </div>
                  <span className="text-neon-cyan font-bold text-lg">ResuMate</span>
                </div>
                <p className="text-sm text-gray-500">Transforming careers with AI-powered insights</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-100 mb-4">Product</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/upload" className="hover:text-neon-cyan transition">Upload Resume</Link></li>
                  <li><Link to="/about" className="hover:text-neon-cyan transition">About Us</Link></li>
                  <li><Link to="/" className="hover:text-neon-cyan transition">Features</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-100 mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link to="/about" className="hover:text-neon-cyan transition">About</Link></li>
                  <li><Link to="/contact" className="hover:text-neon-cyan transition">Contact</Link></li>
                  <li><a href="#" className="hover:text-neon-cyan transition">Blog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-100 mb-4">Legal</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-neon-cyan transition">Privacy</a></li>
                  <li><a href="#" className="hover:text-neon-cyan transition">Terms</a></li>
                  <li><a href="#" className="hover:text-neon-cyan transition">Security</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-dark-700/50 pt-8">
              <p className="text-center text-gray-500 text-sm">
                &copy; 2026 ResuMate. All rights reserved. | Built with ❤️ for your success
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}