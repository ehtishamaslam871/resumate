import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { AlertCircle, CheckCircle, Loader, Download, Share2, ArrowLeft, Award, Briefcase, Code, Target } from "lucide-react";

export default function Analysis() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const fetchResume = async () => {
      try {
        const response = await api.resume.get(resumeId);
        setResume(response.resume);
      } catch (err) {
        setError(err.message || "Failed to fetch resume analysis");
        // Redirect after 3 seconds if error
        setTimeout(() => navigate("/upload"), 3000);
      } finally {
        setLoading(false);
      }
    };

    if (resumeId) {
      fetchResume();
    }
  }, [resumeId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
            <p className="text-gray-300 text-lg">Analyzing your resume...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="p-6 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-red-400 mb-2">Error Loading Resume</h3>
              <p className="text-red-300">{error}</p>
              <p className="text-red-300/70 text-sm mt-2">Redirecting to upload page...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!resume) {
    return null;
  }

  const aiAnalysis = resume.aiAnalysis || {};
  const resumeScore = resume.score || 0;
  const skills = resume.skills || [];
  const parsedText = resume.parsedText || "";

  const getScoreColor = (score) => {
    if (score >= 80) return "text-green-400 bg-green-500/20";
    if (score >= 60) return "text-yellow-400 bg-yellow-500/20";
    return "text-red-400 bg-red-500/20";
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Upload
          </button>
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              <Download className="w-5 h-5" />
              Download Report
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition">
              <Share2 className="w-5 h-5" />
              Share
            </button>
          </div>
        </div>

        {/* Resume Score Card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Score */}
          <div className="bg-gray-800 p-8 rounded-2xl text-center">
            <p className="text-gray-400 mb-3">Resume Score</p>
            <div className={`text-6xl font-bold mb-2 ${getScoreColor(resumeScore)}`}>
              {Math.round(resumeScore)}%
            </div>
            <p className="text-gray-400 text-sm">
              {resumeScore >= 80 ? "Excellent" : resumeScore >= 60 ? "Good" : "Needs Improvement"}
            </p>
          </div>

          {/* Skills Count */}
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">Skills Identified</p>
              <Code className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="text-4xl font-bold mb-2">{skills.length}</p>
            <p className="text-gray-400 text-sm">Technical & soft skills detected</p>
          </div>

          {/* File Info */}
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-400">File Details</p>
              <Briefcase className="w-6 h-6 text-cyan-400" />
            </div>
            <p className="font-semibold text-lg mb-2 truncate">{resume.originalName}</p>
            <p className="text-gray-400 text-sm">Resume uploaded and analyzed</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <div className="flex gap-6">
            {[
              { id: "overview", label: "Overview" },
              { id: "skills", label: "Skills" },
              { id: "improvements", label: "Improvements" },
              { id: "raw", label: "Parsed Text" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-4 px-2 font-medium transition border-b-2 ${
                  activeTab === tab.id
                    ? "text-cyan-400 border-cyan-400"
                    : "text-gray-400 border-transparent hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-gray-800 p-8 rounded-2xl">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Summary */}
              {aiAnalysis.summary && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Target className="w-6 h-6 text-cyan-400" />
                    Summary
                  </h3>
                  <p className="text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
                </div>
              )}

              {/* Strengths */}
              {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    Strengths
                  </h3>
                  <ul className="space-y-2">
                    {aiAnalysis.strengths.map((strength, idx) => (
                      <li key={idx} className="flex items-start gap-3 text-gray-300">
                        <span className="text-green-400 font-bold mt-1">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Experience Highlights */}
              {aiAnalysis.experience && aiAnalysis.experience.length > 0 && (
                <div>
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-cyan-400" />
                    Experience Highlights
                  </h3>
                  <div className="space-y-3">
                    {aiAnalysis.experience.map((exp, idx) => (
                      <div key={idx} className="bg-gray-700/50 p-4 rounded-lg">
                        <p className="font-semibold text-gray-100">{exp.title || `Experience ${idx + 1}`}</p>
                        <p className="text-gray-400 text-sm mt-1">{exp.details || exp}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Code className="w-6 h-6 text-cyan-400" />
                Skills Identified ({skills.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {skills.map((skill, idx) => (
                  <div key={idx} className="bg-gray-700 px-4 py-3 rounded-lg text-center">
                    <p className="font-medium text-gray-100">{skill}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Improvements Tab */}
          {activeTab === "improvements" && (
            <div className="space-y-6">
              {aiAnalysis.improvements && aiAnalysis.improvements.length > 0 ? (
                <>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Award className="w-6 h-6 text-yellow-400" />
                    Recommended Improvements
                  </h3>
                  <div className="space-y-4">
                    {aiAnalysis.improvements.map((improvement, idx) => (
                      <div key={idx} className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-lg">
                        <p className="text-yellow-300 font-medium mb-2">Improvement {idx + 1}</p>
                        <p className="text-gray-300">{improvement}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-gray-400">No specific improvements needed at this time.</p>
              )}

              {/* Action Items */}
              <div className="mt-8 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                <p className="text-cyan-300 font-semibold mb-3">Next Steps:</p>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>✓ Review the improvements above and update your resume</li>
                  <li>✓ Tailor your resume for specific job positions</li>
                  <li>✓ Optimize keywords for ATS (Applicant Tracking System)</li>
                  <li>✓ Check the matched jobs below</li>
                </ul>
              </div>
            </div>
          )}

          {/* Raw Parsed Text Tab */}
          {activeTab === "raw" && (
            <div>
              <h3 className="text-xl font-bold mb-4">Extracted Resume Text</h3>
              <div className="bg-gray-700/50 p-4 rounded-lg max-h-[500px] overflow-y-auto">
                <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono">
                  {parsedText}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Matched Jobs Section */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Briefcase className="w-7 h-7 text-cyan-400" />
              Matched Job Opportunities
            </h2>
            <button
              onClick={() => navigate("/jobs")}
              className="text-cyan-400 hover:text-cyan-300 transition text-sm font-medium"
            >
              View All Jobs →
            </button>
          </div>
          <div className="bg-gray-800/50 p-8 rounded-2xl text-center">
            <p className="text-gray-400 mb-4">Based on your resume analysis, we found matching opportunities</p>
            <button
              onClick={() => navigate("/jobs")}
              className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
            >
              Explore Job Listings →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
