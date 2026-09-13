const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const educationSchema = new mongoose.Schema(
  {
    degree: String,
    institution: String,
    fieldOfStudy: String,
    startYear: Number,
    endYear: Number,
    grade: String,
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    title: String,
    company: String,
    startDate: Date,
    endDate: Date,
    current: { type: Boolean, default: false },
    description: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['candidate', 'admin'],
      default: 'candidate',
    },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    education: [educationSchema],
    skills: [{ type: String, trim: true }],
    experience: [experienceSchema],
    targetRoles: [{ type: String, trim: true }],
    preferredLocations: [{ type: String, trim: true }],
    primaryResumeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Resume' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ role: 1 });

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.profileCompletion = function profileCompletion() {
  const fields = [
    this.name,
    this.phone,
    this.location,
    this.skills?.length,
    this.education?.length,
    this.experience?.length,
    this.targetRoles?.length,
    this.preferredLocations?.length,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};

module.exports = mongoose.model('User', userSchema);
