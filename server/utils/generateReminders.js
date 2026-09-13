// Run this on a schedule (e.g. `node utils/generateReminders.js` via cron,
// or a platform's scheduled task feature) to populate interview/deadline
// notifications. Not run automatically by the server itself.
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const { generateInterviewReminders, generateDeadlineReminders } = require('../services/notificationService');

(async () => {
  await connectDB();
  const interviewCount = await generateInterviewReminders();
  const deadlineCount = await generateDeadlineReminders();
  console.log(`Created ${interviewCount} interview reminders and ${deadlineCount} deadline reminders.`);
  await mongoose.connection.close();
  process.exit(0);
})();
