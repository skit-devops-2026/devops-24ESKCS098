const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { uploadToCloudinary } = require('../config/cloudinary');
const auth = require('../middleware/auth');

// POST /api/upload - Upload proof photo from device
router.post('/', auth, upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No image file provided' });
    }

    const imageUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    res.json({
      success: true,
      url: imageUrl,
      fileName: req.file.originalname,
      size: req.file.size,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
