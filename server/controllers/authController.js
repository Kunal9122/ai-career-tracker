const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// Fields safe to send back to the client. Never include password.
const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  location: user.location,
  education: user.education,
  skills: user.skills,
  experience: user.experience,
  targetRoles: user.targetRoles,
  preferredLocations: user.preferredLocations,
  primaryResumeId: user.primaryResumeId,
  profileCompletion: user.profileCompletion(),
  createdAt: user.createdAt,
});

// @route POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Role is always forced to 'candidate' on public registration.
  // Admin accounts are created via seed script or by an existing admin, never self-service.
  const user = await User.create({ name, email, password, role: 'candidate' });

  const token = generateToken(user._id, user.role);
  success(res, { user: sanitizeUser(user), token }, 'Registration successful', 201);
});

// @route POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (!user.isActive) {
    throw new ApiError(403, 'This account has been deactivated');
  }

  const token = generateToken(user._id, user.role);
  success(res, { user: sanitizeUser(user), token }, 'Login successful');
});

// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  success(res, { user: sanitizeUser(req.user) }, 'Current user fetched');
});

// @route PUT /api/users/profile
const updateProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'phone',
    'location',
    'education',
    'skills',
    'experience',
    'targetRoles',
    'preferredLocations',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      req.user[field] = req.body[field];
    }
  });

  await req.user.save();
  success(res, { user: sanitizeUser(req.user) }, 'Profile updated');
});

// @route PUT /api/auth/change-password
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();
  success(res, {}, 'Password changed successfully');
});

// @route POST /api/auth/logout
// Stateless JWT: logout is handled client-side by discarding the token.
// This endpoint exists for API completeness / future token-blacklist support.
const logout = asyncHandler(async (req, res) => {
  success(res, {}, 'Logged out successfully');
});

module.exports = { register, login, getMe, updateProfile, changePassword, logout, sanitizeUser };
