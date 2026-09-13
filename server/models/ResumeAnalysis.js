const mongoose = require('mongoose');

const resumeAnalysisSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    matchScore: { type: Number, min: 0, max: 100, required: true },
    matchedSkills: [String],
    missingSkills: [String],
    keywordAnalysis: {
      matchedKeywords: [String],
      missingKeywords: [String],
    },
    strengths: [String],
    weaknesses: [String],
    recommendations: [String],
  },
  { timestamps: true }
);

resumeAnalysisSchema.index({ userId: 1, createdAt: -1 });
resumeAnalysisSchema.index({ userId: 1, resumeId: 1, jobId: 1 });

module.exports = mongoose.model('ResumeAnalysis', resumeAnalysisSchema);
