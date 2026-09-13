const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// @route POST /api/jobs
const createJob = asyncHandler(async (req, res) => {
  const job = await Job.create({ ...req.body, userId: req.user._id });
  success(res, { job }, 'Job created', 201);
});

// @route GET /api/jobs
// Supports: search (q), jobType filter, sort, pagination
const getJobs = asyncHandler(async (req, res) => {
  const { q, jobType, sortBy = '-createdAt', page = 1, limit = 10 } = req.query;

  const filter = { userId: req.user._id };
  if (jobType) filter.jobType = jobType;
  if (q) {
    filter.$or = [
      { company: { $regex: q, $options: 'i' } },
      { position: { $regex: q, $options: 'i' } },
      { requiredSkills: { $regex: q, $options: 'i' } },
    ];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 10, 50);
  const skip = (pageNum - 1) * limitNum;

  const [jobs, total] = await Promise.all([
    Job.find(filter).sort(sortBy).skip(skip).limit(limitNum),
    Job.countDocuments(filter),
  ]);

  success(res, {
    jobs,
    pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
  }, 'Jobs fetched');
});

// @route GET /api/jobs/:id
const getJobById = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this job');
  }
  success(res, { job }, 'Job fetched');
});

// @route PUT /api/jobs/:id
const updateJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this job');
  }

  const allowedFields = [
    'company',
    'position',
    'location',
    'jobType',
    'salary',
    'jobUrl',
    'description',
    'requiredSkills',
    'applicationDeadline',
    'notes',
  ];
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) job[field] = req.body[field];
  });

  await job.save();
  success(res, { job }, 'Job updated');
});

// @route DELETE /api/jobs/:id
const deleteJob = asyncHandler(async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this job');
  }

  // Prevent orphaned applications referencing a deleted job
  await JobApplication.deleteMany({ jobId: job._id, userId: req.user._id });
  await job.deleteOne();

  success(res, {}, 'Job deleted');
});

module.exports = { createJob, getJobs, getJobById, updateJob, deleteJob };
