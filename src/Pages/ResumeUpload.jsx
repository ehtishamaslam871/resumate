import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.name.toLowerCase();
      if (fileType.endsWith(".pdf") || fileType.endsWith(".doc") || fileType.endsWith(".docx")) {
        setFile(selectedFile);
      } else {
        alert("Please upload only PDF or DOCX files");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
   
    if (!file) {
      alert("Please upload your resume first");
      return;
    }
    alert("Resume uploaded successfully! Redirecting...");
    navigate("/analysis");
  };

  const clearFile = () => {
    setFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-teal-400 flex
            items-center justify-center text-gray-900 font-extrabold">
              RM
            </div>
            <span className="text-cyan-300 text-xl font-bold">ResuMate</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Upload Your Resume
          </h1>
          <p className="text-cyan-400 text-xl mb-6">
            Get AI-Powered Analysis & Instant Job Matching
          </p>
          <p className="text-gray-300 text-lg max-w-2xl mx-auto">
            Upload your resume and let our AI analyze your skills, suggest improvements, 
            and match you with perfect job opportunities.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info & Auth */}
          <div className="space-y-8">
            <div className="bg-gray-800 p-8 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4">Why Upload Your Resume?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="bg-cyan-500 text-gray-900 p-2 rounded-lg mt-1">
                    <span className="font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Resume Analysis</h3>
                    <p className="text-gray-300 text-sm">Get detailed feedback on your resume content and formatting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-cyan-500 text-gray-900 p-2 rounded-lg mt-1">
                    <span className="font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Smart Job Matching</h3>
                    <p className="text-gray-300 text-sm">Find roles that perfectly match your skills and experience</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="bg-cyan-500 text-gray-900 p-2 rounded-lg mt-1">
                    <span className="font-bold">✓</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">Skill Gap Analysis</h3>
                    <p className="text-gray-300 text-sm">Discover skills to improve for better job opportunities</p>
                  </div>
                </div>
              </div>
            </div>

            
            
          </div>

          {/* Right Side - Upload Form */}
          <div className="bg-gray-800 p-8 rounded-2xl">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Upload Resume</h2>
              <p className="text-gray-400">Supported formats: PDF, DOC, DOCX</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center mb-6 hover:border-cyan-500 transition cursor-pointer">
                  {!file ? (
                    <div 
                      onClick={() => document.getElementById('fileInput').click()}
                      className="space-y-4"
                    >
                      <div className="text-4xl">📄</div>
                      <div>
                        <p className="text-gray-300 font-medium text-lg">Click to upload your resume</p>
                        <p className="text-gray-500 text-sm mt-1">or drag and drop your file here</p>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="text-4xl text-green-400">✅</div>
                    <div className="text-left bg-gray-700 p-4 rounded-lg">
                      <p className="font-medium text-gray-100">{file.name}</p>
                      <p className="text-gray-400 text-sm">Size: {(file.size / 1024).toFixed(2)} KB</p>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                          onClick={() => document.getElementById('fileInput').click()}
                        className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                      >
                        Change File
                      </button>
                      <button
                        type="button"
                        onClick={clearFile}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={!file}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition ${
                    file
                      ? "bg-cyan-500 text-gray-900 hover:bg-cyan-600 shadow-lg"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {file ? "Analyze My Resume →" : "Upload Resume to Analyze"}
                </button>

                {file && (
                  <button
                    type="button"
                    onClick={clearFile}
                    className="w-full py-3 border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-700 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Security Note */}
              <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
                <p className="text-gray-400 text-sm text-center">
                  🔒 Your files are secure and private. We only use them for analysis and never share with third parties.
                </p>
              </div>
              {/* Hidden file input always present so Change File can trigger it */}
              <input
                id="fileInput"
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}