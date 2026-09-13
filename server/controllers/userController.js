const asyncHandler = require('express-async-handler');
const { sanitizeUser } = require('./authController');
const { success } = require('../utils/apiResponse');

// @route GET /api/users/profile
const getProfile = asyncHandler(async (req, res) => {
  success(res, { user: sanitizeUser(req.user) }, 'Profile fetched');
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

module.exports = { getProfile, updateProfile };
