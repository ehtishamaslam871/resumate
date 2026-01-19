// Simple local upload wrapper. Replace with S3/Cloudinary as needed.
const path = require('path');

const uploadLocal = (file) => {
  // Assumes multer stored file in uploads/ with filename property
  const url = `${process.env.BASE_URL || 'http://localhost:5000'}/uploads/${file.filename}`;
  return url;
};

module.exports = { uploadLocal };
