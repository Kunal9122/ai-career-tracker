/**
 * notificationService.js
 *
 * Generates reminder notifications for upcoming interviews and application
 * deadlines. This is invoked by utils/generateReminders.js, which is meant
 * to be run on a schedule (cron, a hosting platform's scheduled jobs, etc.)
 * since this project does not bundle a background job runner.
 */

const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const Notification = require('../models/Notification');

async function generateInterviewReminders() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcoming = await JobApplication.find({
    interviewDate: { $gte: now, $lte: in24h },
  }).populate('jobId', 'company position');

  let created = 0;
  for (const app of upcoming) {
    const alreadyNotified = await Notification.findOne({
      userId: app.userId,
      relatedApplicationId: app._id,
      type: 'interview',
    });
    if (alreadyNotified) continue;

    await Notification.create({
      userId: app.userId,
      title: 'Upcoming interview',
      message: `Interview with ${app.jobId?.company || 'a company'} for ${app.jobId?.position || 'a role'} is coming up soon.`,
      type: 'interview',
      relatedApplicationId: app._id,
    });
    created += 1;
  }
  return created;
}

async function generateDeadlineReminders() {
  const now = new Date();
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const jobsWithDeadline = await Job.find({
    applicationDeadline: { $gte: now, $lte: in48h },
  });

  let created = 0;
  for (const job of jobsWithDeadline) {
    const alreadyNotified = await Notification.findOne({
      userId: job.userId,
      type: 'deadline',
      message: { $regex: job._id.toString() },
    });
    if (alreadyNotified) continue;

    await Notification.create({
      userId: job.userId,
      title: 'Application deadline approaching',
      message: `Deadline for ${job.position} at ${job.company} is within 48 hours. (ref:${job._id})`,
      type: 'deadline',
    });
    created += 1;
  }
  return created;
}

module.exports = { generateInterviewReminders, generateDeadlineReminders };
