const asyncHandler = require('express-async-handler');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// @route POST /api/applications
const createApplication = asyncHandler(async (req, res) => {
  const { jobId, resumeId, status, notes, recruiter, source } = req.body;

  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this job');
  }

  const existing = await JobApplication.findOne({ userId: req.user._id, jobId });
  if (existing) throw new ApiError(409, 'An application for this job already exists');

  const application = await JobApplication.create({
    userId: req.user._id,
    jobId,
    resumeId,
    status: status || 'Saved',
    appliedDate: status && status !== 'Saved' ? new Date() : undefined,
    notes,
    recruiter,
    source,
  });

  success(res, { application }, 'Application created', 201);
});

// @route GET /api/applications
// Supports filtering by status (for the Kanban board) and pagination
const getApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const filter = { userId: req.user._id };
  if (status) filter.status = status;

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
  const skip = (pageNum - 1) * limitNum;

  const [applications, total] = await Promise.all([
    JobApplication.find(filter)
      .populate('jobId', 'company position location jobType')
      .populate('resumeId', 'fileName isPrimary')
      .sort('-updatedAt')
      .skip(skip)
      .limit(limitNum),
    JobApplication.countDocuments(filter),
  ]);

  success(res, {
    applications,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  }, 'Applications fetched');
});

// @route GET /api/applications/:id
const getApplicationById = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id)
    .populate('jobId')
    .populate('resumeId', 'fileName isPrimary');
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this application');
  }
  success(res, { application }, 'Application fetched');
});

// @route PUT /api/applications/:id
const updateApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this application');
  }

  const allowedFields = ['status', 'resumeId', 'interviewDate', 'notes', 'recruiter', 'source'];
  const previousStatus = application.status;

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) application[field] = req.body[field];
  });

  if (req.body.status && req.body.status !== previousStatus && !application.appliedDate && req.body.status !== 'Saved') {
    application.appliedDate = new Date();
  }

  await application.save();

  // Notify the user of the status change so the dashboard/notification center reflects it
  if (req.body.status && req.body.status !== previousStatus) {
    await Notification.create({
      userId: req.user._id,
      title: 'Application status updated',
      message: `Status changed from ${previousStatus} to ${application.status}`,
      type: 'status_change',
      relatedApplicationId: application._id,
    });
  }

  success(res, { application }, 'Application updated');
});

// @route DELETE /api/applications/:id
const deleteApplication = asyncHandler(async (req, res) => {
  const application = await JobApplication.findById(req.params.id);
  if (!application) throw new ApiError(404, 'Application not found');
  if (application.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this application');
  }
  await application.deleteOne();
  success(res, {}, 'Application deleted');
});

module.exports = {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
};
