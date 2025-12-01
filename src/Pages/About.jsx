import React from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import AboutImage from "../assets/ABOUT.png";

const About = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-20">
        <section className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-gray-900 font-extrabold">
                RM
              </div>
              <span className="text-cyan-300 font-medium">ResuMate</span>
            </div>

            <h1 className="text-4xl font-bold">
              About ResuMate
            </h1>

            <p className="text-gray-300 text-lg">
              We help job seekers create better resumes and find their dream jobs through AI technology.
            </p>

            <p className="text-gray-300">
              Our platform uses smart algorithms to analyze your skills, suggest improvements, and match you with the right opportunities.
            </p>

            <p className="text-gray-300">
              Join thousands of users who have found success with our resume builder and job matching services.
            </p>

            <div className="flex gap-4">
              <Link
                to="/services"
                className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-medium hover:bg-cyan-600"
              >
                Our Services
              </Link>

              <Link
                to="/contact"
                className="px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-800"
              >
                Contact Us
              </Link>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="flex justify-center">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <img
                src={AboutImage}
                alt="About ResuMate"
                className="w-full rounded-lg max-w-md"
              />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default About;