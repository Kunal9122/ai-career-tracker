const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Resume = require('../models/Resume');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');
const { extractTextFromPdf } = require('../services/pdfService');

// @route POST /api/resumes/upload
const uploadResumeFile = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError(400, 'No file uploaded. Attach a PDF under the "resume" field.');
  }

  let extractedText = '';
  try {
    extractedText = await extractTextFromPdf(req.file.path);
  } catch (err) {
    // Clean up the orphaned file so we don't leak disk space, then rethrow
    fs.unlink(req.file.path, () => {});
    throw err;
  }

  const existingCount = await Resume.countDocuments({ userId: req.user._id });

  const resume = await Resume.create({
    userId: req.user._id,
    fileName: req.file.originalname,
    filePath: req.file.path,
    fileSize: req.file.size,
    isPrimary: existingCount === 0, // first upload becomes primary automatically
    extractedText,
    parseStatus: 'pending',
  });

  // Return without the (potentially large) extractedText field
  const resumeResponse = resume.toObject();
  delete resumeResponse.extractedText;

  success(res, { resume: resumeResponse }, 'Resume uploaded successfully', 201);
});

// @route GET /api/resumes
const getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ userId: req.user._id }).sort('-uploadedAt');
  success(res, { resumes }, 'Resumes fetched');
});

// @route GET /api/resumes/:id
const getResumeById = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id).select('+extractedText');
  if (!resume) throw new ApiError(404, 'Resume not found');
  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this resume');
  }
  success(res, { resume }, 'Resume fetched');
});

// @route DELETE /api/resumes/:id
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) throw new ApiError(404, 'Resume not found');
  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this resume');
  }

  // Remove the file from disk (path is our own generated path, never user input)
  if (resume.filePath && fs.existsSync(resume.filePath)) {
    fs.unlinkSync(resume.filePath);
  }
  await resume.deleteOne();

  // If the deleted resume was primary, promote the most recent remaining one
  if (resume.isPrimary) {
    const next = await Resume.findOne({ userId: req.user._id }).sort('-uploadedAt');
    if (next) {
      next.isPrimary = true;
      await next.save();
    }
  }

  success(res, {}, 'Resume deleted');
});

// @route PUT /api/resumes/:id/primary
const setPrimaryResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findById(req.params.id);
  if (!resume) throw new ApiError(404, 'Resume not found');
  if (resume.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this resume');
  }

  await Resume.updateMany({ userId: req.user._id }, { isPrimary: false });
  resume.isPrimary = true;
  await resume.save();

  success(res, { resume }, 'Primary resume updated');
});

module.exports = { uploadResumeFile, getResumes, getResumeById, deleteResume, setPrimaryResume };
