const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ApiError = require('../utils/ApiError');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const MAX_SIZE_BYTES = (parseInt(process.env.MAX_RESUME_SIZE_MB, 10) || 5) * 1024 * 1024;

// Only PDF resumes are accepted. Files are never executed - they are stored
// with a random name and served/read only through our own controllers.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `resume-${req.user._id}-${uniqueSuffix}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = path.extname(file.originalname).toLowerCase() === '.pdf';
  if (!isPdfMime || !isPdfExt) {
    return cb(new ApiError(400, 'Only PDF files are allowed for resume uploads'));
  }
  cb(null, true);
};

const uploadResume = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES, files: 1 },
});

module.exports = { uploadResume, UPLOAD_DIR };
