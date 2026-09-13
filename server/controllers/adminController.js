const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Resume = require('../models/Resume');
const InterviewSession = require('../models/InterviewSession');
const AiUsageLog = require('../models/AiUsageLog');
const Skill = require('../models/Skill');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// @route GET /api/admin/stats
const getPlatformStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCandidates,
    totalJobs,
    totalApplications,
    totalResumes,
    totalInterviews,
    applicationsByStatus,
    aiUsageByFeature,
    aiFailureCount,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'candidate' }),
    Job.countDocuments(),
    JobApplication.countDocuments(),
    Resume.countDocuments(),
    InterviewSession.countDocuments(),
    JobApplication.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    AiUsageLog.aggregate([{ $group: { _id: '$feature', count: { $sum: 1 } } }]),
    AiUsageLog.countDocuments({ status: 'failed' }),
  ]);

  success(res, {
    totalUsers,
    totalCandidates,
    totalJobs,
    totalApplications,
    totalResumes,
    totalInterviews,
    applicationsByStatus,
    aiUsageByFeature,
    aiFailureCount,
  }, 'Platform stats fetched');
});

// @route GET /api/admin/users
const listUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, q } = req.query;
  const filter = {};
  if (q) {
    filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  }

  const pageNum = Math.max(parseInt(page, 10) || 1, 1);
  const limitNum = Math.min(parseInt(limit, 10) || 20, 100);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('name email role isActive createdAt')
      .sort('-createdAt')
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum),
    User.countDocuments(filter),
  ]);

  success(res, { users, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } }, 'Users fetched');
});

// @route PUT /api/admin/users/:id/status
const setUserActiveStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.role === 'admin') throw new ApiError(400, 'Cannot deactivate an admin account');

  user.isActive = Boolean(isActive);
  await user.save();
  success(res, { user: { _id: user._id, isActive: user.isActive } }, 'User status updated');
});

// @route GET /api/admin/skills
const listSkills = asyncHandler(async (req, res) => {
  const skills = await Skill.find().sort('name');
  success(res, { skills }, 'Skills fetched');
});

// @route POST /api/admin/skills
const createSkill = asyncHandler(async (req, res) => {
  const { name, category, demandLevel } = req.body;
  if (!name) throw new ApiError(400, 'Skill name is required');

  const existing = await Skill.findOne({ name: name.trim() });
  if (existing) throw new ApiError(409, 'Skill already exists');

  const skill = await Skill.create({ name: name.trim(), category, demandLevel });
  success(res, { skill }, 'Skill created', 201);
});

// @route DELETE /api/admin/skills/:id
const deleteSkill = asyncHandler(async (req, res) => {
  const skill = await Skill.findById(req.params.id);
  if (!skill) throw new ApiError(404, 'Skill not found');
  await skill.deleteOne();
  success(res, {}, 'Skill deleted');
});

// @route GET /api/admin/ai-usage
const getAiUsage = asyncHandler(async (req, res) => {
  const recentLogs = await AiUsageLog.find().populate('userId', 'name email').sort('-createdAt').limit(50);
  success(res, { logs: recentLogs }, 'AI usage logs fetched');
});

module.exports = {
  getPlatformStats,
  listUsers,
  setUserActiveStatus,
  listSkills,
  createSkill,
  deleteSkill,
  getAiUsage,
};
