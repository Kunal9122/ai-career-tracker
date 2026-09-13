const mongoose = require('mongoose');

const parsedDataSchema = new mongoose.Schema(
  {
    summary: String,
    education: [
      {
        degree: String,
        institution: String,
        fieldOfStudy: String,
        year: String,
      },
    ],
    skills: [String],
    experience: [
      {
        title: String,
        company: String,
        duration: String,
        description: String,
      },
    ],
    projects: [
      {
        name: String,
        description: String,
        technologies: [String],
      },
    ],
    certifications: [String],
    achievements: [String],
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSize: Number,
    isPrimary: { type: Boolean, default: false },
    extractedText: { type: String, select: false }, // raw text, hidden by default (can be large)
    parsedData: parsedDataSchema,
    parseStatus: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },
    parseError: String,
    atsScore: { type: Number, min: 0, max: 100 },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

resumeSchema.index({ userId: 1, uploadedAt: -1 });
resumeSchema.index({ userId: 1, isPrimary: 1 });

module.exports = mongoose.model('Resume', resumeSchema);
