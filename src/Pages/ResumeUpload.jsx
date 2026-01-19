import React, { useState } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AlertCircle, CheckCircle, Loader } from "lucide-react";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setSuccess(null);
    
    if (selectedFile) {
      // Validate file type
      const fileType = selectedFile.name.toLowerCase();
      const isValidType = fileType.endsWith(".pdf") || fileType.endsWith(".doc") || fileType.endsWith(".docx");
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      const isValidSize = selectedFile.size <= maxSize;

      if (!isValidType) {
        setError("Please upload only PDF, DOC, or DOCX files");
        return;
      }

      if (!isValidSize) {
        setError("File size must be less than 5MB");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError("Please upload your resume first");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev < 90) return prev + Math.random() * 30;
          return prev;
        });
      }, 300);

      // Upload resume to backend (pass file directly, not FormData)
      const response = await api.resume.uploadResume(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      setSuccess("Resume uploaded successfully! Your resume is being analyzed...");
      
      // Redirect to analysis page with resume ID
      setTimeout(() => {
        navigate(`/analysis/${response.resume._id}`);
      }, 1500);
    } catch (err) {
      setError(err.message || "Failed to upload resume. Please try again.");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setUploadProgress(0);
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
              <p className="text-gray-400">Supported formats: PDF, DOC, DOCX (Max 5MB)</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-400">Upload Error</p>
                  <p className="text-red-300 text-sm mt-1">{error}</p>
                </div>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="mb-6 p-4 bg-green-500/20 border border-green-500/50 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-green-400">Success</p>
                  <p className="text-green-300 text-sm mt-1">{success}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center mb-6 hover:border-cyan-500 transition cursor-pointer">
                  {!file ? (
                    <div 
                      onClick={() => !uploading && document.getElementById('fileInput').click()}
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
                    {!uploading && (
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
                    )}
                  </div>
                )}
              </div>

              {/* Upload Progress Bar */}
              {uploading && uploadProgress > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-400">Uploading and analyzing...</p>
                    <p className="text-sm font-medium text-cyan-400">{Math.round(uploadProgress)}%</p>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-4">
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition flex items-center justify-center gap-2 ${
                    file && !uploading
                      ? "bg-cyan-500 text-gray-900 hover:bg-cyan-600 shadow-lg"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin" />
                      Analyzing Resume...
                    </>
                  ) : file ? (
                    "Analyze My Resume →"
                  ) : (
                    "Upload Resume to Analyze"
                  )}
                </button>

                {file && !uploading && (
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
                disabled={uploading}
              />
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}