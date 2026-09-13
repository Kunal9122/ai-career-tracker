const express = require('express');
const router = express.Router();

const {
  uploadResumeFile,
  getResumes,
  getResumeById,
  deleteResume,
  setPrimaryResume,
} = require('../controllers/resumeController');
const { protect } = require('../middleware/authMiddleware');
const { uploadResume } = require('../middleware/uploadMiddleware');

router.use(protect);

router.post('/upload', uploadResume.single('resume'), uploadResumeFile);
router.get('/', getResumes);
router.get('/:id', getResumeById);
router.delete('/:id', deleteResume);
router.put('/:id/primary', setPrimaryResume);

module.exports = router;
