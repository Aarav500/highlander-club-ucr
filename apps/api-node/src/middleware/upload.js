const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

let storage;
let s3 = null;

if (process.env.S3_BUCKET) {
  // S3 storage when bucket is configured
  const multerS3 = require('multer-s3');
  const { S3Client } = require('@aws-sdk/client-s3');
  s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
  storage = multerS3({
    s3,
    bucket: process.env.S3_BUCKET,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `uploads/${uuidv4()}${ext}`);
    },
  });
} else {
  // Fallback to memory storage for dev/testing
  console.log('⚠️  S3_BUCKET not set — using memory storage for uploads');
  storage = multer.memoryStorage();
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(Object.assign(new Error('Only JPEG, PNG, and WebP images are allowed'), { status: 400 }));
    }
  },
});

module.exports = { upload, s3 };
