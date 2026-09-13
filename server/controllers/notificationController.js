const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

// @route GET /api/notifications
const getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly } = req.query;
  const filter = { userId: req.user._id };
  if (unreadOnly === 'true') filter.read = false;

  const notifications = await Notification.find(filter).sort('-createdAt').limit(50);
  const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

  success(res, { notifications, unreadCount }, 'Notifications fetched');
});

// @route PUT /api/notifications/:id/read
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) throw new ApiError(404, 'Notification not found');
  if (notification.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this notification');
  }
  notification.read = true;
  await notification.save();
  success(res, { notification }, 'Notification marked as read');
});

// @route PUT /api/notifications/read-all
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user._id, read: false }, { read: true });
  success(res, {}, 'All notifications marked as read');
});

module.exports = { getNotifications, markAsRead, markAllAsRead };
