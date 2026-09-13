const asyncHandler = require('express-async-handler');
const Job = require('../models/Job');
const JobApplication = require('../models/JobApplication');
const { success } = require('../utils/apiResponse');

/**
 * Recommendations are computed from jobs already stored in the application
 * (added by any user, or the seed catalog) - never from a live external job
 * board, since no external job API is configured here. If one is added
 * later (e.g. via a connector), this is the only file that needs updating.
 */

function scoreJobAgainstSkills(job, candidateSkills) {
  const required = (job.requiredSkills || []).map((s) => s.toLowerCase());
  if (required.length === 0) return { score: 0, matched: [], missing: [] };

  const skillSet = new Set(candidateSkills.map((s) => s.toLowerCase()));
  const matched = required.filter((s) => skillSet.has(s));
  const missing = required.filter((s) => !skillSet.has(s));
  const score = Math.round((matched.length / required.length) * 100);

  return { score, matched, missing };
}

// @route GET /api/recommendations
const getRecommendations = asyncHandler(async (req, res) => {
  const candidateSkills = req.user.skills || [];
  const preferredLocations = (req.user.preferredLocations || []).map((l) => l.toLowerCase());

  if (candidateSkills.length === 0) {
    return success(
      res,
      { recommendations: [] },
      'Add skills to your profile to get personalized job recommendations'
    );
  }

  // Exclude jobs the user already has an application for
  const appliedJobIds = await JobApplication.find({ userId: req.user._id }).distinct('jobId');

  const candidateJobs = await Job.find({
    _id: { $nin: appliedJobIds },
    requiredSkills: { $exists: true, $not: { $size: 0 } },
  })
    .limit(100)
    .lean();

  const scored = candidateJobs
    .map((job) => {
      const { score, matched, missing } = scoreJobAgainstSkills(job, candidateSkills);
      const locationBoost =
        preferredLocations.length && job.location && preferredLocations.some((l) => job.location.toLowerCase().includes(l))
          ? 5
          : 0;
      return {
        job,
        matchScore: Math.min(100, score + locationBoost),
        matchedSkills: matched,
        missingSkills: missing,
      };
    })
    .filter((r) => r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  success(res, { recommendations: scored }, 'Recommendations generated');
});

module.exports = { getRecommendations };
