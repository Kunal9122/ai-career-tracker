/**
 * Seed script for local development.
 * Run with: npm run seed
 *
 * Creates:
 *  - 1 admin account
 *  - 2 candidate accounts (one with realistic MERN-dev profile data)
 *  - A predefined skills catalog
 *  - Sample jobs with required skills
 *  - Sample applications across different pipeline stages
 *
 * Safe to run multiple times against a fresh dev database - it wipes
 * existing data in these collections first. NEVER run against production.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const Skill = require('../models/Skill');
const Resume = require('../models/Resume');
const InterviewSession = require('../models/InterviewSession');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const Notification = require('../models/Notification');
const AiUsageLog = require('../models/AiUsageLog');

const SKILLS = [
  { name: 'React', category: 'Frontend', demandLevel: 'High' },
  { name: 'JavaScript', category: 'Language', demandLevel: 'High' },
  { name: 'TypeScript', category: 'Language', demandLevel: 'High' },
  { name: 'Node.js', category: 'Backend', demandLevel: 'High' },
  { name: 'Express.js', category: 'Backend', demandLevel: 'Medium' },
  { name: 'MongoDB', category: 'Database', demandLevel: 'High' },
  { name: 'PostgreSQL', category: 'Database', demandLevel: 'Medium' },
  { name: 'Docker', category: 'DevOps', demandLevel: 'High' },
  { name: 'AWS', category: 'Cloud', demandLevel: 'High' },
  { name: 'System Design', category: 'Other', demandLevel: 'High' },
  { name: 'REST APIs', category: 'Backend', demandLevel: 'High' },
  { name: 'GraphQL', category: 'Backend', demandLevel: 'Medium' },
  { name: 'Git', category: 'DevOps', demandLevel: 'High' },
  { name: 'Communication', category: 'Soft Skill', demandLevel: 'High' },
];

const seed = async () => {
  await connectDB();
  console.log('Connected. Wiping existing seed collections...');

  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    JobApplication.deleteMany({}),
    Skill.deleteMany({}),
    Resume.deleteMany({}),
    InterviewSession.deleteMany({}),
    ResumeAnalysis.deleteMany({}),
    Notification.deleteMany({}),
    AiUsageLog.deleteMany({}),
  ]);

  console.log('Seeding skills catalog...');
  await Skill.insertMany(SKILLS);

  console.log('Seeding users...');
  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@careertracker.dev',
    password: 'Admin@1234',
    role: 'admin',
  });

  const candidate = await User.create({
    name: 'Priya Sharma',
    email: 'priya@careertracker.dev',
    password: 'Candidate@1234',
    role: 'candidate',
    phone: '+91-9876543210',
    location: 'Pune, India',
    skills: ['React', 'JavaScript', 'Node.js', 'MongoDB', 'Express.js', 'Git'],
    education: [
      { degree: 'B.Tech', institution: 'Pune Institute of Technology', fieldOfStudy: 'Computer Engineering', startYear: 2020, endYear: 2024 },
    ],
    experience: [
      { title: 'Frontend Intern', company: 'TechNova Solutions', startDate: new Date('2023-05-01'), endDate: new Date('2023-08-01'), description: 'Built React dashboards for internal analytics.' },
    ],
    targetRoles: ['MERN Developer', 'Frontend Engineer'],
    preferredLocations: ['Bangalore', 'Pune', 'Remote'],
  });

  const secondCandidate = await User.create({
    name: 'Rahul Verma',
    email: 'rahul@careertracker.dev',
    password: 'Candidate@1234',
    role: 'candidate',
    location: 'Bangalore, India',
    skills: ['JavaScript', 'Node.js', 'MongoDB'],
    targetRoles: ['Backend Developer'],
    preferredLocations: ['Bangalore'],
  });

  console.log('Seeding jobs...');
  const jobs = await Job.insertMany([
    {
      userId: candidate._id,
      company: 'Wells Fintech',
      position: 'MERN Stack Developer',
      location: 'Bangalore, India',
      jobType: 'Full-time',
      salary: '8-12 LPA',
      description:
        'We are looking for a MERN Stack Developer to build scalable web applications. You will work with React, Node.js, Express, and MongoDB to deliver features end-to-end. Experience with Docker and AWS is a plus. Strong understanding of REST APIs and Git required.',
      requiredSkills: ['React', 'Node.js', 'Express.js', 'MongoDB', 'REST APIs'],
      source: 'Manual',
    },
    {
      userId: candidate._id,
      company: 'CloudScale Systems',
      position: 'Frontend Engineer',
      location: 'Remote',
      jobType: 'Full-time',
      salary: '10-15 LPA',
      description:
        'Frontend Engineer role focused on React and TypeScript. You will own component architecture, performance, and accessibility. Familiarity with Docker-based deployment pipelines and AWS S3/CloudFront preferred.',
      requiredSkills: ['React', 'TypeScript', 'JavaScript', 'Docker', 'AWS'],
      source: 'Manual',
    },
    {
      userId: candidate._id,
      company: 'DataForge Analytics',
      position: 'Backend Developer',
      location: 'Pune, India',
      jobType: 'Full-time',
      salary: '9-13 LPA',
      description:
        'Backend Developer to design and maintain Node.js/Express services backed by MongoDB and PostgreSQL. System design experience for high-throughput APIs is required.',
      requiredSkills: ['Node.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'System Design'],
      source: 'Manual',
    },
    {
      userId: secondCandidate._id,
      company: 'Orbit Labs',
      position: 'Full Stack Developer',
      location: 'Bangalore, India',
      jobType: 'Full-time',
      salary: '11-16 LPA',
      description:
        'Full Stack Developer working across our React frontend and Node/GraphQL backend. AWS and Docker experience valued.',
      requiredSkills: ['React', 'Node.js', 'GraphQL', 'AWS', 'Docker'],
      source: 'Manual',
    },
  ]);

  console.log('Seeding applications across pipeline stages...');
  await JobApplication.create([
    { userId: candidate._id, jobId: jobs[0]._id, status: 'Interview', recruiter: { name: 'Anita Rao', email: 'anita@wellsfintech.example' }, notes: 'Second round scheduled.' },
    { userId: candidate._id, jobId: jobs[1]._id, status: 'Applied' },
    { userId: candidate._id, jobId: jobs[2]._id, status: 'Saved' },
    { userId: secondCandidate._id, jobId: jobs[3]._id, status: 'Screening' },
  ]);

  console.log('\nSeed complete.\n');
  console.log('Sample login credentials:');
  console.log('  Admin:     admin@careertracker.dev / Admin@1234');
  console.log('  Candidate: priya@careertracker.dev / Candidate@1234');
  console.log('  Candidate: rahul@careertracker.dev / Candidate@1234\n');

  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
