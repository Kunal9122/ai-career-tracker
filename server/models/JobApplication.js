const mongoose = require('mongoose');

const APPLICATION_STATUSES = [
  'Saved',
  'Applied',
  'Screening',
  'Assessment',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
];

const jobApplicationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'Saved',
    },
    statusHistory: [
      {
        status: { type: String, enum: APPLICATION_STATUSES },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    appliedDate: Date,
    interviewDate: Date,
    notes: { type: String, trim: true },
    recruiter: {
      name: String,
      email: String,
      phone: String,
    },
    source: { type: String, trim: true },
  },
  { timestamps: true }
);

jobApplicationSchema.index({ userId: 1, status: 1 });
jobApplicationSchema.index({ userId: 1, createdAt: -1 });
jobApplicationSchema.index({ userId: 1, jobId: 1 }, { unique: true });

jobApplicationSchema.pre('save', function trackStatusHistory(next) {
  if (this.isModified('status') || this.isNew) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
  }
  next();
});

module.exports = mongoose.model('JobApplication', jobApplicationSchema);
module.exports.APPLICATION_STATUSES = APPLICATION_STATUSES;
