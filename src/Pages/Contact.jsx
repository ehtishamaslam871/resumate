import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { Mail, MessageSquare, Clock, Zap } from "lucide-react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setForm({ name: "", email: "", message: "" });
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <div className="min-h-screen bg-dark-950 text-gray-100">
      <Navbar />

      {/* Animated background */}
      <div className="fixed top-0 right-0 -z-10 w-96 h-96 bg-gradient-to-br from-neon-cyan/5 to-neon-purple/5 rounded-full blur-3xl"></div>
      <div className="fixed bottom-0 left-0 -z-10 w-96 h-96 bg-gradient-to-tr from-neon-purple/5 to-neon-pink/5 rounded-full blur-3xl"></div>

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-extrabold text-lg">
              RM
            </div>
            <span className="text-gradient font-bold text-2xl">ResuMate</span>
          </div>
          <h1 className="text-5xl font-bold mb-6 text-gray-100">Contact Support</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Have questions about your resume or need help with job matching? We're here to help you succeed in your job search.
          </p>
        </div>

        {/* Success Message */}
        {submitted && (
          <div className="mb-8 p-4 bg-green-500/20 border border-green-500/50 rounded-lg text-green-400 text-center">
            ✅ Message sent! We'll get back to you within 24 hours.
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="card-glass p-8">
              <div className="flex items-start gap-4 mb-6">
                <Mail className="w-6 h-6 text-neon-cyan flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-100 mb-1">Email Support</h3>
                  <p className="text-gray-400 text-sm">Get detailed help with resume reviews and job matching</p>
                  <a href="mailto:support@resumate.com" className="text-neon-cyan hover:text-neon-blue mt-2 inline-block text-sm font-semibold">
                    support@resumate.com
                  </a>
                </div>
              </div>
            </div>

            <div className="card-glass p-8">
              <div className="flex items-start gap-4 mb-6">
                <Clock className="w-6 h-6 text-neon-blue flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-100 mb-1">Response Time</h3>
                  <p className="text-gray-400 text-sm">We typically reply within 24 hours during business days</p>
                </div>
              </div>
            </div>

            <div className="card-glass p-8">
              <div className="flex items-start gap-4">
                <Zap className="w-6 h-6 text-neon-purple flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-100 mb-1">Quick Help</h3>
                  <p className="text-gray-400 text-sm">For resume feedback, technical issues, or account questions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="card-glass p-8">
            <h2 className="text-2xl font-bold mb-6 text-gray-100 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-neon-cyan" />
              Send us a Message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input-modern"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">How can we help?</label>
                <select className="input-modern">
                  <option>Resume Review</option>
                  <option>Job Matching</option>
                  <option>Technical Support</option>
                  <option>Account Help</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-semibold mb-2">Your Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Tell us how we can help you with your resume or job search..."
                  className="input-modern resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;