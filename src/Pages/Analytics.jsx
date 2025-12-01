import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function Analytics() {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    
    setTimeout(() => {
      setAnalysis({
        resumeScore: 78,
        skills: ["JavaScript", "React", "Node.js", "Python", "MongoDB"],
        missingSkills: ["TypeScript", "AWS", "Docker"],
        jobMatches: [
          { title: "Frontend Developer", match: 85, company: "Tech Corp", dueDate: '2025-12-15' },
          { title: "Full Stack Developer", match: 78, company: "Startup Inc", dueDate: '2025-12-01' },
          { title: "React Developer", match: 92, company: "Digital Solutions", dueDate: '2025-12-31' }
        ],
        suggestions: [
          "Add more quantifiable achievements to your experience section",
          "Include relevant projects to showcase your skills",
          "Consider adding a summary section at the top",
          "Add links to your GitHub or portfolio"
        ]
      });
      setLoading(false);
    }, 2000);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-cyan-500 mx-auto mb-4"></div>
            <p className="text-gray-300">Analyzing your resume...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleDownloadReport = () => {
    try {
      const report = {
        generatedAt: new Date().toISOString(),
        resumeScore: analysis.resumeScore,
        skills: analysis.skills,
        missingSkills: analysis.missingSkills,
        jobMatches: analysis.jobMatches,
        suggestions: analysis.suggestions,
      };

      // Create a human-readable text report
      let content = `ResuMate Resume Analysis Report\nGenerated: ${report.generatedAt}\n\n`;
      content += `Resume Score: ${report.resumeScore}/100\n\n`;
      content += `Skills:\n - ${report.skills.join('\n - ')}\n\n`;
      content += `Skills to Learn:\n - ${report.missingSkills.join('\n - ')}\n\n`;
      content += `Top Job Matches:\n`;
      report.jobMatches.forEach((j) => {
        content += ` - ${j.title} @ ${j.company} (${j.match}% match)\n`;
      });
      content += `\nSuggestions:\n - ${report.suggestions.join('\n - ')}\n`;

      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `resumate_report_${Date.now()}.txt`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to download report", e);
      alert("Unable to download report at this time.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-cyan-500 text-gray-900 px-4 py-3 rounded-full font-bold text-xl">
              RM
            </div>
            <span className="text-cyan-300 text-xl font-bold">ResuMate</span>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">
            Resume Analysis Results
          </h1>
          <p className="text-gray-300 text-lg">
            Your resume has been analyzed. Here's how you can improve and which jobs match your profile.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Score & Skills */}
          <div className="lg:col-span-1 space-y-8">
            {/* Resume Score */}
            <div className="bg-gray-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4 text-cyan-400">Resume Score</h2>
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full border-4 border-cyan-500 flex items-center justify-center">
                    <span className="text-3xl font-bold">{analysis.resumeScore}/100</span>
                  </div>
                </div>
                <p className="text-gray-300 mt-4">
                  {analysis.resumeScore >= 80 
                    ? "Excellent! Your resume is well-structured." 
                    : analysis.resumeScore >= 60 
                    ? "Good! Some improvements can make it great."
                    : "Needs work. Follow the suggestions below."
                  }
                </p>
              </div>
            </div>

            {/* Your Skills */}
            <div className="bg-gray-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4 text-cyan-400">Your Skills</h2>
              <div className="flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="bg-gray-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4 text-cyan-400">Skills to Learn</h2>
              <div className="space-y-2">
                {analysis.missingSkills.map((skill, index) => (
                  <div key={index} className="flex items-center gap-3 text-gray-300">
                    <span className="text-red-400">•</span>
                    {skill}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Job Matches & Suggestions */}
          <div className="lg:col-span-2 space-y-8">
            {/* Job Matches */}
            <div className="bg-gray-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-6 text-cyan-400">Top Job Matches</h2>
              <div className="space-y-4">
                {analysis.jobMatches.map((job, index) => (
                  <div key={index} className="bg-gray-700 p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <p className="text-gray-400">{job.company}</p>
                      </div>
                      <div className="text-right">
                        <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
                          {job.match}% Match
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => navigate(`/job/${encodeURIComponent(job.title)}`, { state: { job, skills: analysis.skills } })}
                      className="w-full mt-3 py-2 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
                    >
                      View Job Details
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Improvement Suggestions */}
            <div className="bg-gray-800 p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-6 text-cyan-400">Improvement Suggestions</h2>
              <div className="space-y-4">
                {analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-start gap-3 bg-gray-700/50 p-4 rounded-lg">
                    <div className="bg-cyan-500 text-gray-900 p-2 rounded-lg mt-1">
                      <span className="font-bold">💡</span>
                    </div>
                    <p className="text-gray-300">{suggestion}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button 
                onClick={() => navigate("/upload")}
                className="flex-1 py-3 bg-cyan-500 text-gray-900 rounded-lg font-semibold hover:bg-cyan-600 transition"
              >
                Upload New Resume
              </button>
              <button onClick={handleDownloadReport} className="flex-1 py-3 border border-cyan-500 text-cyan-300 rounded-lg font-semibold hover:bg-cyan-500/10 transition">
                Download Report
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}