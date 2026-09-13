const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const JobApplication = require('../models/JobApplication');
const Job = require('../models/Job');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const InterviewSession = require('../models/InterviewSession');
const { success } = require('../utils/apiResponse');

// @route GET /api/analytics/dashboard
// Aggregates everything the dashboard needs in one call so the client
// doesn't have to make 6+ separate requests.
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user._id);
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    totalApplications,
    applicationsThisMonth,
    statusCounts,
    savedJobs,
    applicationsOverTime,
    applicationsByCompany,
    matchScoreAgg,
    interviewScoreAgg,
    missingSkillsAgg,
  ] = await Promise.all([
    JobApplication.countDocuments({ userId, status: { $ne: 'Saved' } }),
    JobApplication.countDocuments({ userId, createdAt: { $gte: startOfMonth } }),
    JobApplication.aggregate([
      { $match: { userId } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    JobApplication.countDocuments({ userId, status: 'Saved' }),
    JobApplication.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    JobApplication.aggregate([
      { $match: { userId } },
      { $lookup: { from: 'jobs', localField: 'jobId', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $group: { _id: '$job.company', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
    ]),
    ResumeAnalysis.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgScore: { $avg: '$matchScore' } } },
    ]),
    InterviewSession.aggregate([
      { $match: { userId, status: 'completed' } },
      { $group: { _id: null, avgScore: { $avg: '$overallScore' } } },
    ]),
    ResumeAnalysis.aggregate([
      { $match: { userId } },
      { $unwind: '$missingSkills' },
      { $group: { _id: '$missingSkills', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]),
  ]);

  const statusMap = statusCounts.reduce((acc, s) => {
    acc[s._id] = s.count;
    return acc;
  }, {});

  const interviewsCount =
    (statusMap.Interview || 0) + (statusMap.Assessment || 0) + (statusMap.Screening || 0);
  const offersCount = statusMap.Offer || 0;
  const rejectionsCount = statusMap.Rejected || 0;

  // Conversion rate: of applications actually submitted, what fraction reached interview or offer
  const submitted = totalApplications;
  const reachedInterview = interviewsCount + offersCount;
  const interviewConversionRate = submitted > 0 ? Math.round((reachedInterview / submitted) * 100) : 0;

  // Resume match score trend - reuse createdAt-bucketed matchScore averages
  const matchScoreTrend = await ResumeAnalysis.aggregate([
    { $match: { userId } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        avgScore: { $avg: '$matchScore' },
      },
    },
    { $sort: { _id: 1 } },
    { $limit: 30 },
  ]);

  success(res, {
    summary: {
      totalApplications,
      applicationsThisMonth,
      interviews: interviewsCount,
      offers: offersCount,
      rejections: rejectionsCount,
      savedJobs,
      avgResumeMatchScore: matchScoreAgg[0]?.avgScore ? Math.round(matchScoreAgg[0].avgScore) : null,
      avgInterviewScore: interviewScoreAgg[0]?.avgScore
        ? Math.round(interviewScoreAgg[0].avgScore * 10) / 10
        : null,
    },
    charts: {
      applicationsOverTime: applicationsOverTime.map((d) => ({ date: d._id, count: d.count })),
      applicationsByStatus: statusCounts.map((s) => ({ status: s._id, count: s.count })),
      applicationsByCompany: applicationsByCompany.map((c) => ({ company: c._id, count: c.count })),
      interviewConversionRate,
      matchScoreTrend: matchScoreTrend.map((m) => ({ date: m._id, score: Math.round(m.avgScore) })),
      missingSkills: missingSkillsAgg.map((m) => ({ skill: m._id, count: m.count })),
    },
  }, 'Dashboard analytics fetched');
});

module.exports = { getDashboardAnalytics };
