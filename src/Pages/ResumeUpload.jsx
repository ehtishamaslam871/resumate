import React, { useState, useCallback } from "react";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { AlertCircle, CheckCircle, Loader, Upload, FileText, X, Shield } from "lucide-react";

export default function ResumeUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();

  const processFile = useCallback((selectedFile) => {
    setError(null);
    setSuccess(null);
    if (!selectedFile) return;
    const fileType = selectedFile.name.toLowerCase();
    const isValidType = fileType.endsWith(".pdf") || fileType.endsWith(".doc") || fileType.endsWith(".docx");
    const maxSize = 5 * 1024 * 1024;
    const isValidSize = selectedFile.size <= maxSize;
    if (!isValidType) { setError("Please upload only PDF, DOC, or DOCX files"); return; }
    if (!isValidSize) { setError("File size must be less than 5MB"); return; }
    setFile(selectedFile);
  }, []);

  const handleFileChange = (e) => processFile(e.target.files[0]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    processFile(e.dataTransfer.files[0]);
  }, [processFile]);

  const handleDragOver = useCallback((e) => { e.preventDefault(); setDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setDragOver(false), []);

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
    <div className="min-h-screen bg-dark-950">
      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-extrabold">
              RM
            </div>
            <span className="text-neon-cyan text-2xl font-display font-bold">ResuMate</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-display font-bold mb-4 text-gray-100">
            Upload Your Resume
          </h1>
          <p className="text-neon-cyan text-xl mb-6 font-semibold">
            Get AI-Powered Analysis & Instant Job Matching
          </p>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Upload your resume and let our AI analyze your skills, suggest improvements, 
            and match you with perfect job opportunities.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left Side - Info & Auth */}
          <div className="space-y-8">
            <div className="card-glass-hover p-8">
              <h2 className="text-2xl font-bold mb-4 text-gray-100">Why Upload Your Resume?</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">AI Resume Analysis</h3>
                    <p className="text-gray-400 text-sm">Get detailed feedback on your resume content and formatting</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">Smart Job Matching</h3>
                    <p className="text-gray-400 text-sm">Find roles that perfectly match your skills and experience</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-dark-950 font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-100">Skill Gap Analysis</h3>
                    <p className="text-gray-400 text-sm">Discover skills to improve for better job opportunities</p>
                  </div>
                </div>
              </div>
            </div>

            
            
          </div>

          {/* Right Side - Upload Form */}
          <div className="card-glass-hover p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2 text-gray-100">Upload Resume</h2>
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
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-8 text-center mb-6 transition-all duration-300 cursor-pointer
                  ${dragOver
                    ? 'border-neon-cyan bg-neon-cyan/5 scale-[1.02] shadow-lg shadow-neon-cyan/10'
                    : file
                      ? 'border-green-500/40 bg-green-500/5'
                      : 'border-dark-700 hover:border-neon-cyan/50 hover:bg-dark-800/30'
                  }`}
              >
                  {!file ? (
                    <div 
                      onClick={() => !uploading && document.getElementById('fileInput').click()}
                      className="space-y-4"
                    >
                      <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center transition-colors
                        ${dragOver ? 'bg-neon-cyan/20' : 'bg-dark-800 border border-dark-700/50'}`}>
                        <Upload className={`w-6 h-6 transition-colors ${dragOver ? 'text-neon-cyan' : 'text-gray-500'}`} />
                      </div>
                      <div>
                        <p className="text-gray-300 font-medium text-lg">
                          {dragOver ? 'Drop your file here' : 'Click to upload your resume'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">or drag and drop your file here</p>
                        <div className="flex items-center justify-center gap-2 mt-3">
                          {['PDF', 'DOC', 'DOCX'].map(f => (
                            <span key={f} className="px-2 py-0.5 text-[10px] font-semibold bg-dark-800 border border-dark-700/50 rounded text-gray-500">{f}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                  <div className="space-y-4">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="text-left bg-dark-800/60 p-4 rounded-xl border border-dark-700/50">
                      <p className="font-medium text-gray-100 truncate">{file.name}</p>
                      <p className="text-gray-500 text-sm">Size: {(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                    {!uploading && (
                      <div className="flex gap-3 justify-center">
                        <button
                          type="button"
                          onClick={() => document.getElementById('fileInput').click()}
                          className="px-4 py-2 bg-dark-800 border border-dark-700 text-gray-300 rounded-lg hover:bg-dark-700 transition"
                        >
                          Change File
                        </button>
                        <button
                          type="button"
                          onClick={clearFile}
                          className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition"
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
                    <p className="text-sm font-medium text-neon-cyan">{Math.round(uploadProgress)}%</p>
                  </div>
                  <div className="w-full bg-dark-800 rounded-full h-2 overflow-hidden border border-dark-700/50">
                    <div
                      className="bg-gradient-to-r from-neon-cyan to-neon-purple h-full rounded-full transition-all duration-300"
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
                  className={`btn-primary w-full ${!file || uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {uploading ? (
                    <>
                      <Loader className="w-5 h-5 animate-spin inline mr-2" />
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
                    className="btn-secondary w-full"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Security Note */}
              <div className="mt-6 p-4 card-glass rounded-xl flex items-center gap-3">
                <Shield className="w-5 h-5 text-green-500 flex-shrink-0" />
                <p className="text-gray-500 text-sm">
                  Your files are secure and private. We only use them for analysis and never share with third parties.
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