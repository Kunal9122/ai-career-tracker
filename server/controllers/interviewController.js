const asyncHandler = require('express-async-handler');
const InterviewSession = require('../models/InterviewSession');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// @route GET /api/interviews
const getSessions = asyncHandler(async (req, res) => {
  const sessions = await InterviewSession.find({ userId: req.user._id })
    .populate('jobId', 'company position')
    .sort('-createdAt');
  success(res, { sessions }, 'Interview sessions fetched');
});

// @route GET /api/interviews/:id
const getSessionById = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findById(req.params.id).populate('jobId', 'company position');
  if (!session) throw new ApiError(404, 'Interview session not found');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this interview session');
  }
  success(res, { session }, 'Interview session fetched');
});

// @route DELETE /api/interviews/:id
const deleteSession = asyncHandler(async (req, res) => {
  const session = await InterviewSession.findById(req.params.id);
  if (!session) throw new ApiError(404, 'Interview session not found');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this interview session');
  }
  await session.deleteOne();
  success(res, {}, 'Interview session deleted');
});

module.exports = { getSessions, getSessionById, deleteSession };
