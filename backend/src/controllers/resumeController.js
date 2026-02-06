const Resume = require('../models/Resume');
const User = require('../models/User');
const groqService = require('../services/groqService');
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

    const fileUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
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

    // Extract text and call Groq AI
    try {
      console.log('🤖 Extracting text from file...');
      const resumeText = await extractTextFromFile(filePath, file.mimetype);
      console.log('✅ Extracted text length:', resumeText.length);
      
      console.log('🤖 Parsing resume with Groq...');
      const analysis = await groqService.parseResume(resumeText);
      
      console.log('Analysis result:', analysis);
      
      if (analysis.success && analysis.data) {
        const data = analysis.data;
        console.log('Parsed data received:', {
          skills: data.skills?.length,
          experience: data.experience?.length,
          education: data.education?.length,
          score: data.score
        });
        
        resume.parsedText = resumeText.substring(0, 10000);
        resume.skills = data.skills || [];
        resume.experience = data.experience || [];
        resume.education = data.education || [];
        resume.score = data.score || 0;
        resume.aiAnalysis = {
          fullName: data.fullName || user.name,
          email: data.email || user.email,
          phone: data.phone || user.phone,
          location: data.location || '',
          summary: data.summary || '',
          strengths: data.strengths || [],
          improvements: data.improvements || []
        };
        resume.aiModel = 'llama-3.1-8b-instant';
        resume.isParsed = true;
        console.log('✅ Resume parsed successfully');
      } else {
        console.warn('⚠️ AI parsing returned error:', analysis.error);
        resume.isParsed = false;
      }
      
      await resume.save();
      res.status(201).json({ 
        message: resume.isParsed ? 'Resume uploaded and parsed successfully' : 'Resume uploaded (AI analysis pending)',
        resume
      });
    } catch (aiErr) {
      console.error('❌ AI parse failed:', aiErr.message);
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
