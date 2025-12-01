import React, { useState } from "react";
import Navbar from "../components/Navbar";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Message sent! We'll get back to you soon.");
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-cyan-500 text-gray-900 px-3 py-2 rounded-full font-bold">
              RM
            </div>
            <span className="text-cyan-300 font-medium">ResuMate</span>
          </div>
          <h1 className="text-4xl font-bold mb-4">Contact Support</h1>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Have questions about your resume or need help with job matching? 
            We're here to help you succeed in your job search.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-gray-800 p-8 rounded-lg">
              <h2 className="text-2xl font-bold mb-6 text-cyan-400">Get in Touch</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">📧 Email Support</h3>
                  <p className="text-gray-300">Get detailed help with resume reviews and job matching</p>
                  <a 
                    href="mailto:support@resumate.com" 
                    className="text-cyan-300 hover:text-cyan-200 mt-2 inline-block"
                  >
                    support@resumate.com
                  </a>
                </div>

                <div>
                  <h3 className="font-semibold mb-2"> Response Time</h3>
                  <p className="text-gray-300">We typically reply within 24 hours</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2"> Quick Help</h3>
                  <p className="text-gray-300">
                    For resume feedback, technical issues, or account questions
                  </p>
                </div>
              </div>
            </div>
            </div>

          {/* Contact Form */}
          <div className="bg-gray-800 p-8 rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-cyan-400">Send us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-300 mb-2">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">How can we help?</label>
                <select className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none">
                  <option>Resume Review</option>
                  <option>Job Matching</option>
                  <option>Technical Support</option>
                  <option>Account Help</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Your Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  rows="5"
                  placeholder="Tell us how we can help you with your resume or job search..."
                  className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full bg-cyan-500 text-gray-900 py-3 rounded-lg font-semibold hover:bg-cyan-600 transition"
              >
                Send Message
              </button>

              <p className="text-gray-400 text-sm text-center">
                We'll respond to your message within 24 hours
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;