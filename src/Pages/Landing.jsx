import React, { useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Zap, Sparkles, Target, Users, TrendingUp, Upload, BarChart3, Briefcase, CheckCircle } from 'lucide-react'

/* ── Intersection-Observer hook for scroll-reveal ── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('revealed'); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-6 transition-all duration-700 ease-out [&.revealed]:opacity-100 [&.revealed]:translate-y-0 ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Sparkles, title: 'AI-Powered Analysis', description: 'Get instant feedback on your resume with advanced AI algorithms', color: 'from-neon-cyan to-neon-blue' },
    { icon: Target, title: 'Smart Job Matching', description: 'Find positions perfectly aligned with your skills and experience', color: 'from-neon-purple to-neon-pink' },
    { icon: TrendingUp, title: 'Career Growth', description: 'Optimize your profile and track your professional development', color: 'from-neon-pink to-neon-green' },
  ];

  const howItWorks = [
    { step: '01', icon: Upload, title: 'Upload Resume', desc: 'Upload your PDF, DOC, or DOCX resume in seconds' },
    { step: '02', icon: BarChart3, title: 'AI Analysis', desc: 'Our AI scores and provides detailed improvement tips' },
    { step: '03', icon: Briefcase, title: 'Get Matched', desc: 'Discover job opportunities tailored to your skills' },
    { step: '04', icon: CheckCircle, title: 'Land the Job', desc: 'Practice interviews and apply with confidence' },
  ];

  const stats = [
    { value: '10K+', label: 'Active Job Seekers' },
    { value: '95%', label: 'Success Rate' },
    { value: '2M+', label: 'Jobs Matched' },
  ];

  return (
    <div className="min-h-screen bg-dark-950 text-white overflow-x-hidden">
      <Navbar />

      {/* Animated gradient background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] bg-gradient-to-tr from-neon-purple/20 to-neon-pink/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-neon-blue/5 to-transparent rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* ─── Hero Section ────────────────────────── */}
        <section className="min-h-[92vh] flex items-center justify-center pt-20 px-6">
          <div className="max-w-7xl w-full">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Left Content */}
              <div className="space-y-8 animate-fade-in-up">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full backdrop-blur-sm">
                    <Zap className="w-4 h-4 text-neon-cyan" />
                    <span className="text-neon-cyan text-sm font-semibold tracking-wide">AI-Powered Resume Analyzer</span>
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-display font-bold leading-[1.1]">
                    Get Hired
                    <br />
                    <span className="text-gradient">Faster</span>
                  </h1>

                  <p className="text-lg sm:text-xl text-gray-300 leading-relaxed max-w-lg">
                    Analyze your resume with AI, match with perfect opportunities, and land your dream job with intelligent insights and real-time feedback.
                  </p>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => navigate('/auth')}
                    className="btn-primary group flex items-center justify-center gap-2 py-4 px-8 text-lg"
                  >
                    Get Started Free
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  <Link
                    to="/about"
                    className="btn-secondary flex items-center justify-center gap-2 py-4 px-8 text-lg"
                  >
                    Learn More
                  </Link>
                </div>

                {/* Trust Stats */}
                <div className="pt-8 border-t border-dark-700/50">
                  <p className="text-sm text-gray-500 mb-5 font-medium tracking-wide uppercase">Trusted by professionals worldwide</p>
                  <div className="grid grid-cols-3 gap-6">
                    {stats.map((stat, i) => (
                      <div key={i} className="group">
                        <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gradient">{stat.value}</p>
                        <p className="text-sm text-gray-400 group-hover:text-gray-300 transition mt-1">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Visual */}
              <div className="hidden lg:flex items-center justify-center relative">
                <div className="relative w-full max-w-lg">
                  {/* Main card */}
                  <div className="card-glass p-8 border border-neon-cyan/20 animate-glow rounded-2xl">
                    <div className="bg-gradient-to-br from-neon-cyan/10 to-neon-purple/10 h-56 rounded-xl flex items-center justify-center border border-dark-700/50 mb-6">
                      <div className="text-center">
                        <Sparkles className="w-20 h-20 text-neon-cyan mx-auto mb-3 animate-float" />
                        <p className="text-gray-400 font-medium text-sm">AI Analysis in Progress</p>
                      </div>
                    </div>

                    <div className="space-y-5">
                      {[
                        { label: 'Resume Score', value: 92, color: 'from-neon-cyan to-neon-blue', txt: 'text-neon-cyan' },
                        { label: 'Job Match', value: 87, color: 'from-neon-purple to-neon-pink', txt: 'text-neon-purple' },
                        { label: 'ATS Compatibility', value: 94, color: 'from-neon-green to-neon-cyan', txt: 'text-neon-green' },
                      ].map((bar) => (
                        <div key={bar.label}>
                          <div className="flex justify-between items-center mb-2">
                            <p className="text-sm text-gray-400">{bar.label}</p>
                            <p className={`text-sm font-bold ${bar.txt}`}>{bar.value}/100</p>
                          </div>
                          <div className="w-full h-2 bg-dark-800 rounded-full overflow-hidden border border-dark-700/40">
                            <div className={`h-full bg-gradient-to-r ${bar.color} rounded-full transition-all duration-1000`} style={{ width: `${bar.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Floating stat cards */}
                  <div className="absolute -top-5 -right-5 card-glass px-4 py-3 rounded-xl border border-neon-cyan/30 shadow-lg shadow-neon-cyan/10 animate-float">
                    <p className="text-2xl font-bold text-neon-cyan">95%</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Match Rate</p>
                  </div>
                  <div className="absolute -bottom-5 -left-5 card-glass px-4 py-3 rounded-xl border border-neon-purple/30 shadow-lg shadow-neon-purple/10 animate-float" style={{ animationDelay: '1s' }}>
                    <p className="text-2xl font-bold text-neon-purple">2.5s</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Analysis Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── How It Works ───────────────────────── */}
        <section className="py-28 px-6">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="section-header">
                <h2>How It Works</h2>
                <p>Four simple steps to your dream career</p>
              </div>
            </Reveal>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {howItWorks.map((item, i) => {
                const Icon = item.icon;
                return (
                  <Reveal key={i} delay={i * 120}>
                    <div className="relative card-glass-hover p-7 text-center group h-full">
                      {/* Step number */}
                      <span className="absolute top-4 right-4 text-xs font-bold text-dark-500 group-hover:text-neon-cyan/40 transition-colors">{item.step}</span>
                      <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 border border-dark-700/50
                        flex items-center justify-center group-hover:scale-110 group-hover:border-neon-cyan/40 transition-all duration-300">
                        <Icon className="w-6 h-6 text-neon-cyan" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-100 mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                      {/* Connector line (hidden on last) */}
                      {i < howItWorks.length - 1 && (
                        <div className="hidden lg:block absolute top-1/2 -right-3 w-6 border-t border-dashed border-dark-600" />
                      )}
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* ─── Features ───────────────────────────── */}
        <section className="py-28 px-6 bg-gradient-to-b from-transparent via-dark-900/30 to-transparent">
          <div className="max-w-6xl mx-auto">
            <Reveal>
              <div className="section-header">
                <h2>Powerful Features</h2>
                <p>Everything you need to succeed in your job search with cutting-edge AI technology</p>
              </div>
            </Reveal>

            <div className="grid md:grid-cols-3 gap-8 mb-14">
              {features.map((feature, i) => {
                const Icon = feature.icon;
                return (
                  <Reveal key={i} delay={i * 120}>
                    <div className="card-glass-hover p-8 group h-full flex flex-col">
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6
                        group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-neon-cyan/10`}>
                        <Icon className="w-7 h-7 text-dark-950" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-100 mb-3">{feature.title}</h3>
                      <p className="text-gray-400 leading-relaxed flex-grow">{feature.description}</p>
                      <div className="mt-6 pt-5 border-t border-dark-700/30 flex items-center gap-2 text-neon-cyan
                        group-hover:gap-3 transition-all duration-300">
                        <span className="text-sm font-semibold">Learn more</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Benefit cards */}
            <div className="grid md:grid-cols-2 gap-5">
              {[
                { icon: Sparkles, title: 'Instant Feedback', desc: 'Get detailed analysis of your resume in seconds with actionable recommendations', border: 'border-neon-cyan/40', bg: 'bg-neon-cyan/15', txt: 'text-neon-cyan' },
                { icon: Target, title: 'Targeted Matches', desc: 'Discover job opportunities perfectly aligned with your skills and career goals', border: 'border-neon-purple/40', bg: 'bg-neon-purple/15', txt: 'text-neon-purple' },
                { icon: TrendingUp, title: 'Career Growth', desc: 'Track progress and identify skill gaps to advance your professional development', border: 'border-neon-pink/40', bg: 'bg-neon-pink/15', txt: 'text-neon-pink' },
                { icon: Users, title: 'Expert Community', desc: 'Connect with thousands of professionals and get insights from industry experts', border: 'border-neon-blue/40', bg: 'bg-neon-blue/15', txt: 'text-neon-blue' },
              ].map((b, i) => (
                <Reveal key={i} delay={i * 100}>
                  <div className={`card-glass p-6 border-l-2 ${b.border} hover:bg-dark-800/50 transition-colors duration-300`}>
                    <div className="flex items-start gap-4">
                      <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center flex-shrink-0`}>
                        <b.icon className={`w-5 h-5 ${b.txt}`} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-100 mb-1.5">{b.title}</h4>
                        <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Section ────────────────────────── */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <Reveal>
              <div className="relative rounded-3xl p-12 md:p-20 text-center overflow-hidden
                bg-gradient-to-br from-neon-purple/15 via-dark-900/60 to-neon-pink/10
                border border-neon-purple/30">
                {/* Decorative blobs */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div className="absolute -top-24 -right-24 w-56 h-56 bg-neon-purple/15 rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-neon-pink/15 rounded-full blur-3xl" />
                </div>

                <div className="relative z-10">
                  <h2 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mb-6 text-gray-100">
                    Ready to Transform
                    <br className="hidden sm:block" />
                    Your Career?
                  </h2>
                  <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed">
                    Join thousands of professionals who've already landed their dream jobs using ResuMate's AI-powered platform
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                      onClick={() => navigate('/auth')}
                      className="btn-primary group text-lg py-4 px-10 inline-flex items-center justify-center gap-2"
                    >
                      Start Your Journey
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                    <Link to="/services" className="btn-secondary text-lg py-4 px-10 flex items-center justify-center">
                      Explore Services
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* ─── Footer ─────────────────────────────── */}
        <footer className="border-t border-dark-800/60 py-16 px-6 bg-dark-950/80">
          <div className="max-w-6xl mx-auto">
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold text-xs">
                    RM
                  </div>
                  <span className="text-gray-100 font-bold text-base">ResuMate</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">Transforming careers with AI-powered insights and intelligent job matching.</p>
              </div>
              {[
                { title: 'Product', links: [['Upload Resume', '/upload'], ['Services', '/services'], ['Features', '/']] },
                { title: 'Company', links: [['About', '/about'], ['Contact', '/contact'], ['Blog', '#']] },
                { title: 'Legal', links: [['Privacy', '#'], ['Terms', '#'], ['Security', '#']] },
              ].map((col) => (
                <div key={col.title}>
                  <h4 className="font-semibold text-gray-200 mb-4 text-sm tracking-wide uppercase">{col.title}</h4>
                  <ul className="space-y-2.5">
                    {col.links.map(([label, to]) => (
                      <li key={label}>
                        <Link to={to} className="text-sm text-gray-500 hover:text-neon-cyan transition-colors duration-200">{label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 text-sm">&copy; {new Date().getFullYear()} ResuMate. All rights reserved.</p>
              <p className="text-gray-600 text-sm">Built with <span className="text-red-400">&#9829;</span> for your success</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}