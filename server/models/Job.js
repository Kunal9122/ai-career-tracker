const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    company: { type: String, required: [true, 'Company is required'], trim: true },
    position: { type: String, required: [true, 'Position is required'], trim: true },
    location: { type: String, trim: true },
    jobType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'],
      default: 'Full-time',
    },
    salary: { type: String, trim: true },
    jobUrl: { type: String, trim: true },
    description: { type: String, trim: true },
    requiredSkills: [{ type: String, trim: true }],
    applicationDeadline: Date,
    notes: { type: String, trim: true },
    source: { type: String, trim: true, default: 'Manual' },
  },
  { timestamps: true }
);

jobSchema.index({ userId: 1, createdAt: -1 });
jobSchema.index({ userId: 1, company: 1 });
jobSchema.index({ requiredSkills: 1 });
jobSchema.index({ position: 'text', company: 'text', description: 'text' });

module.exports = mongoose.model('Job', jobSchema);
