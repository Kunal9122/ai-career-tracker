const mongoose = require('mongoose');

// Tracks every AI feature invocation for admin monitoring (Phase 15) and
// for debugging failures without storing full prompt/response bodies
// (keeps sensitive resume/job content out of the log).
const aiUsageLogSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    feature: {
      type: String,
      enum: [
        'parse-resume',
        'analyze-job',
        'match-resume',
        'ats-analysis',
        'improve-resume',
        'skill-gap',
        'interview-questions',
        'interview-feedback',
        'chat',
      ],
      required: true,
    },
    status: { type: String, enum: ['success', 'failed'], required: true },
    errorMessage: String,
    durationMs: Number,
  },
  { timestamps: true }
);

aiUsageLogSchema.index({ createdAt: -1 });
aiUsageLogSchema.index({ feature: 1, status: 1 });

module.exports = mongoose.model('AiUsageLog', aiUsageLogSchema);
