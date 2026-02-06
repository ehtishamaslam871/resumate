import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { AlertCircle, CheckCircle, Loader, Download, Share2, ArrowLeft, Award, Briefcase, Code, Target, TrendingUp, Star, Eye, MapPin, DollarSign } from "lucide-react";

export default function Analysis() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [matchingJobs, setMatchingJobs] = useState(false);

  useEffect(() => {
    const fetchResume = async () => {
      try {
        console.log('Fetching resume:', resumeId);
        const response = await api.resume.get(resumeId);
        console.log('Resume fetched:', response);
        setResume(response.resume);
        
        // Fetch matched jobs
        try {
          setMatchingJobs(true);
          const matchResponse = await api.matching.getMatchedJobs(resumeId);
          console.log('Matched jobs:', matchResponse);
          setMatchedJobs(matchResponse.matchedJobs || []);
        } catch (matchErr) {
          console.log('Could not load matched jobs:', matchErr.message);
          setMatchedJobs([]);
        }
      } catch (err) {
        console.error('Error fetching resume:', err);
        setError(err.message || "Failed to fetch resume analysis");
        setTimeout(() => navigate("/upload"), 3000);
      } finally {
        setLoading(false);
        setMatchingJobs(false);
      }
    };

    if (resumeId) {
      fetchResume();
    }
  }, [resumeId, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <Loader className="w-20 h-20 animate-spin text-cyan-400" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 border-r-cyan-400 opacity-50 animate-pulse"></div>
            </div>
            <p className="text-xl text-gray-300 font-medium">Analyzing your resume...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
        <Navbar />
        <main className="max-w-6xl mx-auto px-6 py-16">
          <div className="p-8 bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/50 rounded-2xl flex items-start gap-6">
            <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-bold text-red-400 mb-2">Error Loading Resume</h3>
              <p className="text-red-300 text-lg mb-1">{error}</p>
              <p className="text-red-300/70 text-sm">Redirecting to upload page...</p>
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
  const isParsed = resume.isParsed ?? false;

  const getScoreColor = (score) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-amber-500";
    return "from-red-500 to-rose-500";
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 80) return "bg-green-500/20 text-green-400 border-green-500/50";
    if (score >= 60) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50";
    return "bg-red-500/20 text-red-400 border-red-500/50";
  };

  const downloadReport = () => {
    const report = `
═══════════════════════════════════════════════
       ResuMate Resume Analysis Report
═══════════════════════════════════════════════

Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}

FILE DETAILS
─────────────────────────────────────────────
Name: ${resume.originalName}
Size: ${(resume.fileSize / 1024).toFixed(2)} KB
Type: ${resume.mimeType}
Uploaded: ${new Date(resume.uploadDate).toLocaleDateString()}

RESUME SCORE: ${Math.round(resumeScore)}/100
${resumeScore >= 80 ? "✓ EXCELLENT" : resumeScore >= 60 ? "◐ GOOD" : "✗ NEEDS IMPROVEMENT"}

${isParsed ? `
PROFILE INFORMATION
─────────────────────────────────────────────
Name: ${aiAnalysis.fullName || "N/A"}
Email: ${aiAnalysis.email || "N/A"}
Phone: ${aiAnalysis.phone || "N/A"}
Location: ${aiAnalysis.location || "N/A"}

PROFESSIONAL SUMMARY
─────────────────────────────────────────────
${aiAnalysis.summary || "No summary available"}

SKILLS IDENTIFIED (${skills.length})
─────────────────────────────────────────────
${skills.map(s => `• ${s}`).join("\n")}

STRENGTHS
─────────────────────────────────────────────
${aiAnalysis.strengths?.map(s => `✓ ${s}`).join("\n") || "No strengths data"}

IMPROVEMENTS RECOMMENDED
─────────────────────────────────────────────
${aiAnalysis.improvements?.map(i => `• ${i}`).join("\n") || "No improvements data"}
` : `
NOTE: This resume was uploaded but AI analysis is pending.
Check back soon for detailed analysis.
`}

═══════════════════════════════════════════════
               End of Report
═══════════════════════════════════════════════
    `;
    
    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resumate-analysis-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Header with Navigation */}
        <div className="flex items-center justify-between mb-12">
          <button
            onClick={() => navigate("/upload")}
            className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition font-medium group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            Back to Upload
          </button>
          <div className="flex gap-3">
            <button 
              onClick={downloadReport}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700/50 hover:bg-gray-700 border border-gray-600 rounded-lg transition font-medium group"
            >
              <Download className="w-5 h-5 group-hover:scale-110 transition" />
              Download Report
            </button>
          </div>
        </div>

        {/* Main Score Card */}
        <div className="relative mb-12">
          <div className={`bg-gradient-to-r ${getScoreColor(resumeScore)} p-1 rounded-3xl`}>
            <div className="bg-gray-900 rounded-3xl p-12 backdrop-blur-sm">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Score Circle */}
                <div className="flex flex-col items-center justify-center">
                  <div className="relative w-40 h-40 mb-6">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="45" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="8" fill="none" />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        stroke="url(#scoreGradient)" 
                        strokeWidth="8" 
                        fill="none"
                        strokeDasharray={`${(resumeScore / 100) * 283} 283`}
                        className="transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgb(34, 197, 94)" />
                          <stop offset="100%" stopColor="rgb(6, 182, 212)" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <div className="text-5xl font-bold">{Math.round(resumeScore)}</div>
                      <div className="text-lg text-gray-400">/100</div>
                    </div>
                  </div>
                  <p className={`text-lg font-bold ${resumeScore >= 80 ? 'text-green-400' : resumeScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {resumeScore >= 80 ? "Excellent" : resumeScore >= 60 ? "Good" : "Needs Work"}
                  </p>
                </div>

                {/* File & Stats Info */}
                <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Briefcase className="w-6 h-6 text-cyan-400" />
                      <span className="text-gray-400 text-sm font-medium">FILE</span>
                    </div>
                    <p className="font-semibold text-lg mb-1 truncate">{resume.originalName}</p>
                    <p className="text-gray-500 text-sm">{resume.fileSize ? `${(resume.fileSize / 1024).toFixed(2)} KB` : 'Size unknown'}</p>
                  </div>

                  <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <Code className="w-6 h-6 text-cyan-400" />
                      <span className="text-gray-400 text-sm font-medium">SKILLS</span>
                    </div>
                    <p className="font-semibold text-lg">{skills.length}</p>
                    <p className="text-gray-500 text-sm">Detected</p>
                  </div>

                  {isParsed && (
                    <>
                      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                          <span className="text-gray-400 text-sm font-medium">STATUS</span>
                        </div>
                        <p className="font-semibold text-lg text-green-400">Analyzed</p>
                        <p className="text-gray-500 text-sm">AI parsed</p>
                      </div>

                      <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700">
                        <div className="flex items-center gap-3 mb-4">
                          <TrendingUp className="w-6 h-6 text-cyan-400" />
                          <span className="text-gray-400 text-sm font-medium">UPLOADED</span>
                        </div>
                        <p className="font-semibold text-lg">{new Date(resume.uploadDate).toLocaleDateString()}</p>
                        <p className="text-gray-500 text-sm">on this date</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isParsed ? (
          <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-500/50 rounded-2xl p-8 text-center">
            <Eye className="w-12 h-12 text-cyan-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-3">Resume Uploaded Successfully!</h3>
            <p className="text-gray-300 text-lg mb-6">AI analysis is being processed. Full insights will be available shortly. You can still view the basic file information above.</p>
            <button
              onClick={() => navigate("/upload")}
              className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
            >
              Upload Another Resume
            </button>
          </div>
        ) : (
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center hover:border-cyan-500/50 transition">
                <p className="text-gray-400 text-sm font-medium mb-2">EXPERIENCE</p>
                <p className="text-3xl font-bold text-cyan-400">{aiAnalysis.experience?.length || 0}</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center hover:border-cyan-500/50 transition">
                <p className="text-gray-400 text-sm font-medium mb-2">EDUCATION</p>
                <p className="text-3xl font-bold text-blue-400">{aiAnalysis.education?.length || 0}</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center hover:border-cyan-500/50 transition">
                <p className="text-gray-400 text-sm font-medium mb-2">STRENGTHS</p>
                <p className="text-3xl font-bold text-green-400">{aiAnalysis.strengths?.length || 0}</p>
              </div>
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 text-center hover:border-cyan-500/50 transition">
                <p className="text-gray-400 text-sm font-medium mb-2">TO IMPROVE</p>
                <p className="text-3xl font-bold text-yellow-400">{aiAnalysis.improvements?.length || 0}</p>
              </div>
            </div>

            {/* Candidate Profile Section */}
            {(aiAnalysis.fullName || aiAnalysis.email || aiAnalysis.phone || aiAnalysis.location) && (
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-2xl p-8 mb-10">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <Briefcase className="w-8 h-8 text-purple-400" />
                  Candidate Profile
                </h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {aiAnalysis.fullName && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Full Name</p>
                      <p className="text-xl font-semibold text-gray-100">{aiAnalysis.fullName}</p>
                    </div>
                  )}
                  {aiAnalysis.email && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Email</p>
                      <p className="text-xl font-semibold text-gray-100">{aiAnalysis.email}</p>
                    </div>
                  )}
                  {aiAnalysis.phone && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Phone</p>
                      <p className="text-xl font-semibold text-gray-100">{aiAnalysis.phone}</p>
                    </div>
                  )}
                  {aiAnalysis.location && (
                    <div>
                      <p className="text-gray-400 text-sm mb-1">Location</p>
                      <p className="text-xl font-semibold text-gray-100">{aiAnalysis.location}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-700 mb-8">
              <div className="flex gap-8 overflow-x-auto">
                {[
                  { id: "overview", label: "Overview", icon: Target },
                  { id: "skills", label: "Skills", icon: Code },
                  { id: "experience", label: "Experience", icon: Briefcase },
                  { id: "education", label: "Education", icon: Award },
                  { id: "improvements", label: "Improvements", icon: Star },
                  { id: "raw", label: "Raw Text", icon: Eye },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`pb-4 px-1 font-medium transition border-b-2 flex items-center gap-2 whitespace-nowrap ${
                        activeTab === tab.id
                          ? "text-cyan-400 border-cyan-400"
                          : "text-gray-400 border-transparent hover:text-gray-300"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-gray-800/50 border border-gray-700 p-10 rounded-2xl">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <div className="space-y-10">
                  {aiAnalysis.summary && (
                    <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-2xl p-8">
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Target className="w-8 h-8 text-cyan-400" />
                        Professional Summary
                      </h3>
                      <p className="text-gray-200 text-lg leading-relaxed">{aiAnalysis.summary}</p>
                    </div>
                  )}

                  {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                    <div>
                      <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <CheckCircle className="w-8 h-8 text-green-400" />
                        Your Strengths
                      </h3>
                      <div className="grid md:grid-cols-2 gap-4">
                        {aiAnalysis.strengths.map((strength, idx) => (
                          <div key={idx} className="bg-green-500/10 border border-green-500/30 rounded-xl p-5 hover:bg-green-500/20 transition">
                            <div className="flex items-start gap-3">
                              <Star className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
                              <p className="text-gray-200">{strength}</p>
                            </div>
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
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Code className="w-8 h-8 text-cyan-400" />
                    Skills Identified ({skills.length})
                  </h3>
                  {skills.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {skills.map((skill, idx) => (
                        <div 
                          key={idx} 
                          className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/50 px-5 py-4 rounded-xl text-center hover:border-cyan-400 transition group"
                        >
                          <p className="font-semibold text-gray-100 group-hover:text-cyan-300 transition">{skill}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-lg">No skills identified yet.</p>
                  )}
                </div>
              )}

              {/* Experience Tab */}
              {activeTab === "experience" && (
                <div>
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-blue-400" />
                    Work Experience ({aiAnalysis.experience?.length || 0})
                  </h3>
                  {aiAnalysis.experience && aiAnalysis.experience.length > 0 ? (
                    <div className="space-y-6">
                      {aiAnalysis.experience.map((exp, idx) => (
                        <div key={idx} className="bg-blue-500/10 border-l-4 border-blue-400 p-8 rounded-r-xl hover:bg-blue-500/20 transition">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-xl font-bold text-gray-100">{exp.jobTitle || exp.title || `Job ${idx + 1}`}</h4>
                              <p className="text-blue-300 font-medium">{exp.company || exp.employer || "Company Name"}</p>
                            </div>
                            {exp.duration && (
                              <span className="bg-blue-500/30 text-blue-200 px-3 py-1 rounded-full text-sm font-medium">{exp.duration}</span>
                            )}
                          </div>
                          {exp.description && (
                            <p className="text-gray-300 mt-4 leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-lg">No work experience found.</p>
                  )}
                </div>
              )}

              {/* Education Tab */}
              {activeTab === "education" && (
                <div>
                  <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Award className="w-8 h-8 text-purple-400" />
                    Education ({aiAnalysis.education?.length || 0})
                  </h3>
                  {aiAnalysis.education && aiAnalysis.education.length > 0 ? (
                    <div className="space-y-6">
                      {aiAnalysis.education.map((edu, idx) => (
                        <div key={idx} className="bg-purple-500/10 border-l-4 border-purple-400 p-8 rounded-r-xl hover:bg-purple-500/20 transition">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h4 className="text-xl font-bold text-gray-100">{edu.degree || edu.degreeType || "Degree"}</h4>
                              <p className="text-purple-300 font-medium">{edu.school || edu.institution || "School Name"}</p>
                            </div>
                            {edu.year && (
                              <span className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-sm font-medium">{edu.year}</span>
                            )}
                          </div>
                          {edu.field && (
                            <p className="text-gray-300 mt-2">Field: <span className="text-purple-200 font-semibold">{edu.field}</span></p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-lg">No education information found.</p>
                  )}
                </div>
              )}

              {/* Improvements Tab */}
              {activeTab === "improvements" && (
                <div className="space-y-8">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <Award className="w-8 h-8 text-yellow-400" />
                    Recommended Improvements
                  </h3>
                  {aiAnalysis.improvements && aiAnalysis.improvements.length > 0 ? (
                    <div className="space-y-4">
                      {aiAnalysis.improvements.map((improvement, idx) => (
                        <div key={idx} className="bg-yellow-500/10 border-l-4 border-yellow-400 p-6 rounded-r-xl hover:bg-yellow-500/20 transition">
                          <div className="flex items-start gap-4">
                            <div className="bg-yellow-500 text-gray-900 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold">
                              {idx + 1}
                            </div>
                            <p className="text-gray-200 text-lg mt-1">{improvement}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-lg">No specific improvements needed at this time. Your resume is in great shape!</p>
                  )}
                </div>
              )}

              {/* Raw Text Tab */}
              {activeTab === "raw" && (
                <div>
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Eye className="w-8 h-8 text-cyan-400" />
                    Extracted Resume Text
                  </h3>
                  <div className="bg-gray-900 border border-gray-700 p-6 rounded-xl max-h-[500px] overflow-y-auto">
                    <pre className="text-gray-300 text-sm whitespace-pre-wrap font-mono leading-relaxed">
                      {parsedText || "No text data available"}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Matched Jobs Section */}
            {isParsed && (
              <div className="mt-12">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-3xl font-bold flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-green-400" />
                    Matched Job Opportunities
                    {matchedJobs.length > 0 && (
                      <span className="text-sm bg-green-500/30 text-green-300 px-3 py-1 rounded-full">
                        {matchedJobs.length} matches
                      </span>
                    )}
                  </h2>
                </div>

                {matchingJobs ? (
                  <div className="bg-gray-800/50 border border-gray-700 p-8 rounded-2xl text-center">
                    <Loader className="w-8 h-8 animate-spin text-cyan-400 mx-auto mb-4" />
                    <p className="text-gray-300">Finding matching jobs...</p>
                  </div>
                ) : matchedJobs.length > 0 ? (
                  <div className="grid gap-6">
                    {matchedJobs.map((job) => (
                      <div key={job._id} className="bg-gradient-to-r from-green-500/10 to-cyan-500/10 border border-green-500/30 rounded-2xl p-8 hover:border-green-400/50 transition">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-2xl font-bold text-gray-100">{job.title}</h3>
                            <p className="text-green-400 font-semibold">{job.company}</p>
                            {job.location && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm mt-2">
                                <MapPin className="w-4 h-4" />
                                {job.location}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`text-4xl font-bold ${job.matchScore >= 80 ? 'text-green-400' : job.matchScore >= 60 ? 'text-yellow-400' : 'text-blue-400'}`}>
                              {job.matchScore}%
                            </div>
                            <p className="text-gray-400 text-sm">Match</p>
                            {job.matchedSkills > 0 && (
                              <p className="text-green-300 text-sm font-semibold mt-2">{job.matchedSkills} skills match</p>
                            )}
                          </div>
                        </div>

                        {job.description && (
                          <p className="text-gray-300 mb-4 line-clamp-2">{job.description}</p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex gap-4 text-sm text-gray-400">
                            {job.jobType && (
                              <div className="flex items-center gap-1">
                                <Briefcase className="w-4 h-4" />
                                {job.jobType}
                              </div>
                            )}
                            {job.salary && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                {job.salary}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/job/${encodeURIComponent(job.title)}`, { state: { job, resumeId } })}
                            className="px-6 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-cyan-500/30 rounded-2xl p-12 text-center">
                    <Briefcase className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-bold text-gray-100 mb-2">No matches yet</h3>
                    <p className="text-gray-400 mb-6">We'll match you with relevant jobs as more positions become available.</p>
                    <button
                      onClick={() => navigate("/jobs")}
                      className="px-6 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
                    >
                      Explore All Jobs
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Footer */}
            <div className="mt-12 grid md:grid-cols-2 gap-6">
              <button
                onClick={() => navigate("/upload")}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-gray-900 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-cyan-500/50 transition transform hover:scale-105"
              >
                Upload Another Resume
              </button>
              <button
                onClick={() => navigate("/jobs")}
                className="px-8 py-4 border-2 border-cyan-500 text-cyan-300 rounded-xl font-bold text-lg hover:bg-cyan-500/10 transition"
              >
                Explore All Job Opportunities
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
