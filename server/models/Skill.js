const mongoose = require('mongoose');

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['Frontend', 'Backend', 'Database', 'DevOps', 'Cloud', 'Language', 'Soft Skill', 'Other'],
      default: 'Other',
    },
    demandLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
  },
  { timestamps: true }
);

skillSchema.index({ name: 1 }, { unique: true });
skillSchema.index({ category: 1 });

module.exports = mongoose.model('Skill', skillSchema);
