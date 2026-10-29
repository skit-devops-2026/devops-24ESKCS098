import express from 'express';
import { upload } from '../middleware/upload.js';
import { uploadToCloudinary } from '../config/cloudinary.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

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

export default router;
