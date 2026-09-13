const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['interview', 'deadline', 'followup', 'status_change', 'recommendation', 'system'],
      default: 'system',
    },
    read: { type: Boolean, default: false },
    relatedApplicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobApplication' },
  },
  { timestamps: true }
);

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
