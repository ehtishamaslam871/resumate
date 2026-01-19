const AWS = require('aws-sdk');
const { Storage } = require('@google-cloud/storage');
const path = require('path');

// AWS S3 Configuration
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'us-east-1',
});

// Google Cloud Storage Configuration
const gcsStorage = new Storage({
  projectId: process.env.GCS_PROJECT_ID,
  keyFilename: process.env.GCS_KEY_FILE,
});

// File upload to S3
const uploadToS3 = async (file, folder = 'resumes') => {
  try {
    if (!file) throw new Error('No file provided');

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    };

    const result = await s3.upload(params).promise();

    return {
      url: result.Location,
      key: result.Key,
      bucket: result.Bucket,
      size: file.size,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

// File download from S3
const downloadFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    const result = await s3.getObject(params).promise();
    return result.Body;
  } catch (error) {
    console.error('S3 download error:', error);
    throw error;
  }
};

// Delete file from S3
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    };

    await s3.deleteObject(params).promise();
    return true;
  } catch (error) {
    console.error('S3 delete error:', error);
    throw error;
  }
};

// File upload to Google Cloud Storage
const uploadToGCS = async (file, folder = 'resumes') => {
  try {
    if (!file) throw new Error('No file provided');

    const bucket = gcsStorage.bucket(process.env.GCS_BUCKET);
    const fileName = `${folder}/${Date.now()}-${file.originalname}`;
    const gcsFile = bucket.file(fileName);

    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        cacheControl: 'no-cache',
      },
    });

    const publicUrl = `https://storage.googleapis.com/${process.env.GCS_BUCKET}/${fileName}`;

    return {
      url: publicUrl,
      key: fileName,
      bucket: process.env.GCS_BUCKET,
      size: file.size,
    };
  } catch (error) {
    console.error('GCS upload error:', error);
    throw error;
  }
};

// File download from GCS
const downloadFromGCS = async (fileName) => {
  try {
    const bucket = gcsStorage.bucket(process.env.GCS_BUCKET);
    const file = bucket.file(fileName);

    const [data] = await file.download();
    return data;
  } catch (error) {
    console.error('GCS download error:', error);
    throw error;
  }
};

// Delete file from GCS
const deleteFromGCS = async (fileName) => {
  try {
    const bucket = gcsStorage.bucket(process.env.GCS_BUCKET);
    const file = bucket.file(fileName);

    await file.delete();
    return true;
  } catch (error) {
    console.error('GCS delete error:', error);
    throw error;
  }
};

// Unified interface - use based on configuration
const uploadFile = async (file, folder = 'resumes') => {
  const provider = process.env.CLOUD_STORAGE_PROVIDER || 's3';

  if (provider === 's3') {
    return uploadToS3(file, folder);
  } else if (provider === 'gcs') {
    return uploadToGCS(file, folder);
  } else {
    throw new Error('Invalid cloud storage provider');
  }
};

const downloadFile = async (key) => {
  const provider = process.env.CLOUD_STORAGE_PROVIDER || 's3';

  if (provider === 's3') {
    return downloadFromS3(key);
  } else if (provider === 'gcs') {
    return downloadFromGCS(key);
  } else {
    throw new Error('Invalid cloud storage provider');
  }
};

const deleteFile = async (key) => {
  const provider = process.env.CLOUD_STORAGE_PROVIDER || 's3';

  if (provider === 's3') {
    return deleteFromS3(key);
  } else if (provider === 'gcs') {
    return deleteFromGCS(key);
  } else {
    throw new Error('Invalid cloud storage provider');
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  deleteFile,
  uploadToS3,
  uploadToGCS,
  downloadFromS3,
  downloadFromGCS,
  deleteFromS3,
  deleteFromGCS,
};
