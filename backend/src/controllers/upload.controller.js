const s3Service = require('../services/s3.service');

const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const customPath = req.body.path || null;
    const result = await s3Service.uploadFile(req.file, customPath);
    
    return res.status(200).json({
      message: 'Upload successful',
      url: result.url,
      key: result.key
    });
  } catch (error) {
    console.error('Error uploading to S3:', error);
    return res.status(500).json({ 
      message: 'Internal server error during upload',
      error: error.message 
    });
  }
};

const uploadMultipleImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const uploadPromises = req.files.map(file => s3Service.uploadFile(file));
    const results = await Promise.all(uploadPromises);
    
    return res.status(200).json({
      message: 'Uploads successful',
      files: results
    });
  } catch (error) {
    console.error('Error uploading multiple images to S3:', error);
    return res.status(500).json({ 
      message: 'Internal server error during upload',
      error: error.message 
    });
  }
};

module.exports = {
  uploadImage,
  uploadMultipleImages
};
