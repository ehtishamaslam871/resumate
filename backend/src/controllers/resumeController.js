const Resume = require('../models/Resume');
const User = require('../models/User');
const modelService = require('../services/modelService');
const { parseResumeText } = require('../utils/resumeParser');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

// Helper function to extract text from PDF
const extractTextFromPDF = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(fileBuffer);
  return data.text;
};

// Helper function to extract text from DOCX
const extractTextFromDOCX = async (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer: fileBuffer });
  return result.value;
};

// Helper function to extract text from file
const extractTextFromFile = async (filePath, fileType) => {
  try {
    if (fileType.includes('pdf')) {
      return await extractTextFromPDF(filePath);
    } else if (fileType.includes('word') || fileType.includes('document')) {
      return await extractTextFromDOCX(filePath);
    } else if (fileType.includes('text')) {
      return fs.readFileSync(filePath, 'utf8');
    }
    throw new Error('Unsupported file type');
  } catch (error) {
    console.error('Text extraction error:', error);
    throw error;
  }
};

// ==================== UPLOAD RESUME ====================
exports.uploadResume = async (req, res) => {

  try {
    const file = req.file;
    if (!file) return res.status(400).json({ message: 'No file uploaded' });

    // File type validation: only allow PDF, DOC, DOCX
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.mimetype)) {
      // Optionally, delete the uploaded file if not valid
      const uploadedPath = path.join(__dirname, '../../uploads', file.filename);
      if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
      return res.status(400).json({ message: 'This file is not a resume, please upload another one.' });
    }

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;
    const filePath = path.join(__dirname, '../../uploads', file.filename);

    const user = await User.findById(req.user.id);

    let resume = new Resume({
      user: req.user.id,
      userId: req.user.id.toString(),
      originalName: file.originalname,
      filename: file.filename,
      url: fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadDate: new Date(),
      isDefault: false
    });

    await resume.save();

    // Extract text and parse resume (fast text parser first, AI enhancement async)
    try {
      console.log(' Extracting text from file...');
      const resumeText = await extractTextFromFile(filePath, file.mimetype);
      console.log(' Extracted text length:', resumeText.length);

      // --- Content-based validation: check for resume-like content ---
      const MIN_LENGTH = 400; // Minimum reasonable length for a resume
      const RESUME_KEYWORDS = [
        'experience', 'education', 'skills', 'summary', 'projects', 'certifications', 'work history', 'employment', 'professional', 'profile', 'objective'
      ];
      const lowerText = resumeText.toLowerCase();
      const hasKeyword = RESUME_KEYWORDS.some(k => lowerText.includes(k));
      if (resumeText.length < MIN_LENGTH || !hasKeyword) {
        // Optionally, delete the uploaded file if not valid
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        await Resume.findByIdAndDelete(resume._id);
        return res.status(400).json({ message: 'This file does not appear to be a resume. Please upload a valid resume document.' });
      }
      
      // ── Helper: ensure skills is always an array of individual strings ──
      const normalizeSkills = (raw) => {
        if (!raw) return [];
        // If it's a string, split by common delimiters
        if (typeof raw === 'string') {
          return raw.split(/[,;|•\n]+/).map(s => s.trim()).filter(s => s.length > 1);
        }
        // If it's an array, flatten any nested comma-separated strings
        if (Array.isArray(raw)) {
          const result = [];
          for (const item of raw) {
            if (typeof item === 'string' && item.includes(',')) {
              result.push(...item.split(',').map(s => s.trim()).filter(s => s.length > 1));
            } else if (typeof item === 'string' && item.trim().length > 1) {
              result.push(item.trim());
            }
          }
          return result;
        }
        return [];
      };

      // ── Helper: normalize experience entries to match schema (jobTitle, company) ──
      const normalizeExperience = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(e => ({
          jobTitle: e.jobTitle || e.title || e.position || e.role || '',
          company: e.company || e.employer || e.organization || '',
          duration: e.duration || e.period || e.dates || '',
          description: e.description || e.responsibilities || '',
        })).filter(e => e.jobTitle || e.company);
      };

      // ── Helper: normalize education entries to match schema (degree, school) ──
      const normalizeEducation = (arr) => {
        if (!Array.isArray(arr)) return [];
        return arr.map(e => ({
          degree: e.degree || e.degreeType || e.qualification || '',
          school: e.school || e.institution || e.university || e.college || '',
          field: e.field || e.major || e.specialization || '',
          year: e.year || e.dates || e.period || '',
        })).filter(e => e.degree || e.school);
      };

      // Primary: call the model server's regex parser (fast, comprehensive)
      console.log(' Parsing resume via model server (regex engine)...');
      let data;
      let usedModel = 'regex-nlp';
      
      try {
        const analysis = await modelService.parseResume(resumeText);
        
        if (analysis.success && analysis.data && typeof analysis.data === 'object') {
          const d = analysis.data;
          data = {
            fullName: d.fullName || '',
            email: d.email || '',
            phone: d.phone || '',
            location: d.location || '',
            summary: d.summary || '',
            skills: normalizeSkills(d.skills),
            experience: normalizeExperience(d.experience),
            education: normalizeEducation(d.education),
            projects: d.projects || [],
            certifications: d.certifications || [],
            score: d.score || 0,
            scoreBreakdown: d.scoreBreakdown || {},
            strengths: d.strengths || [],
            improvements: d.improvements || [],
          };
          usedModel = analysis.model || 'regex-nlp';
          console.log(' Model server parsed:', {
            skills: data.skills?.length || 0,
            experience: data.experience?.length || 0,
            education: data.education?.length || 0,
            score: data.score
          });
        } else {
          throw new Error('Model server returned empty data');
        }
      } catch (modelErr) {
        // Fallback: local JS text parser (if model server is unreachable)
        console.warn(' Model server unavailable, using local text parser:', modelErr.message);
        data = parseResumeText(resumeText);
        usedModel = 'text-parser-fallback';
        data.skills = normalizeSkills(data.skills);
        data.experience = normalizeExperience(data.experience);
        data.education = normalizeEducation(data.education);
      }
      
      console.log('Final parsed data:', {
        model: usedModel,
        skills: data.skills?.length,
        experience: data.experience?.length,
        education: data.education?.length,
        score: data.score
      });
      
      resume.parsedText = resumeText.substring(0, 10000);
      resume.skills = normalizeSkills(data.skills);
      resume.experience = normalizeExperience(data.experience);
      resume.education = normalizeEducation(data.education);
      resume.score = data.score || 0;
      resume.aiAnalysis = {
        fullName: data.fullName || user.name,
        email: data.email || user.email,
        phone: data.phone || user.phone,
        location: data.location || '',
        summary: data.summary || '',
        strengths: data.strengths || [],
        improvements: data.improvements || [],
        experience: normalizeExperience(data.experience),
        education: normalizeEducation(data.education),
      };
      resume.aiModel = usedModel;
      resume.isParsed = true;
      console.log(' Resume parsed successfully with', usedModel);
      
      await resume.save();
      res.status(201).json({ 
        message: 'Resume uploaded and parsed successfully',
        resume
      });
    } catch (aiErr) {
      console.error(' AI parse failed:', aiErr.message);
      console.error('Stack:', aiErr.stack);
      // Save resume without AI analysis if parsing fails
      resume.isParsed = false;
      await resume.save();
      res.status(201).json({ 
        message: 'Resume uploaded (AI analysis unavailable)',
        resume,
        warning: aiErr.message
      });
    }
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET RESUME ====================
exports.getResume = async (req, res) => {
  try {
    const resume = await Resume.findById(req.params.id);
    if (!resume) {
      console.log('Resume not found:', req.params.id);
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Check authorization
    console.log('Resume user:', resume.user.toString(), 'Req user:', req.user?.id?.toString());
    if (resume.user.toString() !== req.user?.id?.toString()) {
      console.log('Auth failed - user mismatch');
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ resume });
  } catch (err) {
    console.error('Get resume error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== GET USER RESUMES ====================
exports.getUserResumes = async (req, res) => {
  try {
    const resumes = await Resume.find({ user: req.user.id })
      .sort({ uploadDate: -1 })
      .limit(100);

    res.json({
      total: resumes.length,
      resumes
    });
  } catch (err) {
    console.error('Get user resumes error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== UPDATE RESUME ====================
exports.updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const { isDefault, notes } = req.body;

    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Check authorization
    if (resume.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (isDefault) {
      // Update all other resumes for this user to not be default
      await Resume.updateMany(
        { user: req.user.id },
        { isDefault: false }
      );
      resume.isDefault = true;
    }

    if (notes) resume.notes = notes;

    await resume.save();

    res.json({
      message: 'Resume updated successfully',
      resume
    });
  } catch (err) {
    console.error('Update resume error:', err);
    res.status(500).json({ message: err.message });
  }
};

// ==================== DELETE RESUME ====================
exports.deleteResume = async (req, res) => {
  try {
    const { id } = req.params;

    const resume = await Resume.findById(id);
    if (!resume) return res.status(404).json({ message: 'Resume not found' });

    // Check authorization
    if (resume.user.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete file from storage
    try {
      const filePath = path.join(__dirname, '../../uploads', resume.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileErr) {
      console.error('File deletion error:', fileErr);
    }

    await Resume.findByIdAndDelete(id);

    res.json({ message: 'Resume deleted successfully' });
  } catch (err) {
    console.error('Delete resume error:', err);
    res.status(500).json({ message: err.message });
  }
};
