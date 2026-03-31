const express = require('express');
const router = express.Router();
const multer = require('multer');
const uploadController = require('../controllers/upload.controller');
const { checkFileExists } = require('../services/s3.service');

const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

router.post('/single', upload.single('image'), uploadController.uploadImage);
router.post('/multiple', upload.array('images', 10), uploadController.uploadMultipleImages);

router.get('/check-image', async (req, res) => {
  try {
    const { prefix } = req.query;
    
    if (!prefix) {
      return res.status(400).json({ error: 'prefix query parameter is required' });
    }
    
    const result = await checkFileExists(prefix);
    res.json(result);
  } catch (error) {
    console.error('Error checking image:', error);
    res.status(500).json({ error: 'Failed to check image' });
  }
});

module.exports = router;
