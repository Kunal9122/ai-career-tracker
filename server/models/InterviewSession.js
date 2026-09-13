const mongoose = require('mongoose');

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: {
      type: String,
      enum: ['HR', 'Technical', 'Project', 'DSA', 'SQL', 'System Design', 'Behavioral'],
    },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'] },
    answer: String,
    feedback: {
      correctness: Number,
      relevance: Number,
      completeness: Number,
      communication: Number,
      confidence: Number,
      technicalDepth: Number,
      comments: String,
      betterAnswer: String,
    },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job' },
    mode: {
      type: String,
      enum: ['HR', 'Technical', 'Mixed', 'Role-specific'],
      default: 'Mixed',
    },
    status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
    questions: [qaSchema],
    technicalScore: { type: Number, min: 0, max: 10 },
    communicationScore: { type: Number, min: 0, max: 10 },
    confidenceScore: { type: Number, min: 0, max: 10 },
    overallScore: { type: Number, min: 0, max: 10 },
    strengths: [String],
    weaknesses: [String],
    topicsToRevise: [String],
  },
  { timestamps: true }
);

interviewSessionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewSession', interviewSessionSchema);
