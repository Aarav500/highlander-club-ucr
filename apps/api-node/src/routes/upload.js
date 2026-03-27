const express = require('express');
const router = express.Router();
const { PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');
const { authenticate } = require('../middleware/auth');
const { s3 } = require('../middleware/upload');

const ALLOWED_EXTS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };

// GET /api/upload/presign?contentType=image/jpeg
// Returns a presigned S3 PUT URL for direct mobile upload
router.get('/presign', authenticate, async (req, res, next) => {
  try {
    const { contentType } = req.query;
    const ext = ALLOWED_EXTS[contentType];
    if (!ext) {
      return res.status(400).json({ error: 'contentType must be image/jpeg, image/png, or image/webp' });
    }

    const key = `uploads/${uuidv4()}${ext}`;
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 min
    const publicUrl = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${key}`;

    res.json({ uploadUrl: url, publicUrl, key });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
