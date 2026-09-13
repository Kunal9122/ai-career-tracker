const asyncHandler = require('express-async-handler');
const { callAI } = require('../services/aiService');
const { retrieveContext } = require('../services/contextRetrievalService');
const ApiError = require('../utils/ApiError');
const { success } = require('../utils/apiResponse');

const Resume = require('../models/Resume');
const Job = require('../models/Job');
const ResumeAnalysis = require('../models/ResumeAnalysis');
const InterviewSession = require('../models/InterviewSession');
const AiUsageLog = require('../models/AiUsageLog');
const User = require('../models/User');

const { resumeParserSystemPrompt, buildResumeParserUserPrompt } = require('../services/prompts/resumeParserPrompt');
const { jobAnalyzerSystemPrompt, buildJobAnalyzerUserPrompt } = require('../services/prompts/jobAnalyzerPrompt');
const { resumeMatcherSystemPrompt, buildResumeMatcherUserPrompt } = require('../services/prompts/resumeMatcherPrompt');
const { atsSystemPrompt, buildAtsUserPrompt } = require('../services/prompts/atsPrompt');
const { resumeImproveSystemPrompt, buildResumeImproveUserPrompt } = require('../services/prompts/resumeImprovePrompt');
const { skillGapSystemPrompt, buildSkillGapUserPrompt } = require('../services/prompts/skillGapPrompt');
const { interviewQuestionsSystemPrompt, buildInterviewQuestionsUserPrompt } = require('../services/prompts/interviewPrompt');
const { interviewFeedbackSystemPrompt, buildInterviewFeedbackUserPrompt } = require('../services/prompts/feedbackPrompt');
const { careerAssistantSystemPrompt, buildCareerAssistantUserPrompt } = require('../services/prompts/careerAssistantPrompt');

// Wraps an AI feature call with usage logging (Phase 15 admin monitoring).
// Logging never records prompt/response bodies - only feature, status, timing.
async function withUsageLogging(userId, feature, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    await AiUsageLog.create({ userId, feature, status: 'success', durationMs: Date.now() - start });
    return result;
  } catch (err) {
    await AiUsageLog.create({
      userId,
      feature,
      status: 'failed',
      errorMessage: err.message?.slice(0, 300),
      durationMs: Date.now() - start,
    });
    throw err;
  }
}

async function getOwnedResume(resumeId, userId) {
  const resume = await Resume.findById(resumeId).select('+extractedText');
  if (!resume) throw new ApiError(404, 'Resume not found');
  if (resume.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this resume');
  }
  return resume;
}

async function getOwnedJob(jobId, userId) {
  const job = await Job.findById(jobId);
  if (!job) throw new ApiError(404, 'Job not found');
  if (job.userId.toString() !== userId.toString()) {
    throw new ApiError(403, 'You do not have access to this job');
  }
  return job;
}

// @route POST /api/ai/parse-resume  { resumeId }
const parseResume = asyncHandler(async (req, res) => {
  const { resumeId } = req.body;
  if (!resumeId) throw new ApiError(400, 'resumeId is required');

  const resume = await getOwnedResume(resumeId, req.user._id);

  try {
    const parsedData = await withUsageLogging(req.user._id, 'parse-resume', () =>
      callAI({
        systemPrompt: resumeParserSystemPrompt,
        userPrompt: buildResumeParserUserPrompt(resume.extractedText),
      })
    );

    resume.parsedData = parsedData;
    resume.parseStatus = 'success';
    resume.parseError = undefined;
    await resume.save();

    success(res, { resume: { _id: resume._id, parsedData, parseStatus: 'success' } }, 'Resume parsed successfully');
  } catch (err) {
    // Never corrupt existing data on failure - just record the error status
    resume.parseStatus = 'failed';
    resume.parseError = err.message?.slice(0, 300);
    await resume.save();
    throw err;
  }
});

// @route POST /api/ai/analyze-job  { jobDescription, jobId? }
const analyzeJob = asyncHandler(async (req, res) => {
  const { jobDescription, jobId } = req.body;

  const analysis = await withUsageLogging(req.user._id, 'analyze-job', () =>
    callAI({
      systemPrompt: jobAnalyzerSystemPrompt,
      userPrompt: buildJobAnalyzerUserPrompt(jobDescription),
    })
  );

  // Optionally sync extracted required skills back onto a saved Job record
  if (jobId) {
    const job = await getOwnedJob(jobId, req.user._id);
    if (analysis.requiredSkills?.length && !job.requiredSkills?.length) {
      job.requiredSkills = analysis.requiredSkills;
      await job.save();
    }
  }

  success(res, { analysis }, 'Job description analyzed');
});

// @route POST /api/ai/match-resume  { resumeId, jobId }
const matchResume = asyncHandler(async (req, res) => {
  const { resumeId, jobId } = req.body;

  const [resume, job] = await Promise.all([
    getOwnedResume(resumeId, req.user._id),
    getOwnedJob(jobId, req.user._id),
  ]);

  if (!job.description) {
    throw new ApiError(400, 'This job has no description to match against. Add one first.');
  }

  const result = await withUsageLogging(req.user._id, 'match-resume', () =>
    callAI({
      systemPrompt: resumeMatcherSystemPrompt,
      userPrompt: buildResumeMatcherUserPrompt(resume.extractedText, job.description),
    })
  );

  const analysis = await ResumeAnalysis.create({
    userId: req.user._id,
    resumeId,
    jobId,
    matchScore: result.matchScore,
    matchedSkills: result.matchedSkills,
    missingSkills: result.missingSkills,
    keywordAnalysis: result.keywordAnalysis,
    strengths: result.strengths,
    weaknesses: result.weaknesses,
    recommendations: result.recommendations,
  });

  success(res, { analysis }, 'Resume matched against job', 201);
});

// @route POST /api/ai/ats-analysis  { resumeId, jobId? }
const atsAnalysis = asyncHandler(async (req, res) => {
  const { resumeId, jobId } = req.body;
  const resume = await getOwnedResume(resumeId, req.user._id);

  let jobDescription = null;
  if (jobId) {
    const job = await getOwnedJob(jobId, req.user._id);
    jobDescription = job.description;
  }

  const result = await withUsageLogging(req.user._id, 'ats-analysis', () =>
    callAI({
      systemPrompt: atsSystemPrompt,
      userPrompt: buildAtsUserPrompt(resume.extractedText, jobDescription),
    })
  );

  resume.atsScore = result.atsScore;
  await resume.save();

  success(res, { result }, 'ATS analysis complete');
});

// @route POST /api/ai/improve-resume  { sectionName, sectionText }
const improveResume = asyncHandler(async (req, res) => {
  const { sectionName, sectionText } = req.body;

  const result = await withUsageLogging(req.user._id, 'improve-resume', () =>
    callAI({
      systemPrompt: resumeImproveSystemPrompt,
      userPrompt: buildResumeImproveUserPrompt(sectionName, sectionText),
    })
  );

  success(res, { result }, 'Resume section improved');
});

// @route POST /api/ai/skill-gap  { jobId? }
const skillGap = asyncHandler(async (req, res) => {
  const { jobId } = req.body;
  const user = await User.findById(req.user._id);

  let targetSkills = [];
  let targetRole = user.targetRoles?.[0] || null;

  if (jobId) {
    const job = await getOwnedJob(jobId, req.user._id);
    targetSkills = job.requiredSkills || [];
    targetRole = job.position;
  } else {
    // No specific job - aggregate required skills across the user's saved jobs
    const jobs = await Job.find({ userId: req.user._id }).select('requiredSkills').limit(20);
    targetSkills = [...new Set(jobs.flatMap((j) => j.requiredSkills || []))];
  }

  if (targetSkills.length === 0) {
    throw new ApiError(400, 'No target skills available. Add a job with required skills, or specify jobId.');
  }

  const result = await withUsageLogging(req.user._id, 'skill-gap', () =>
    callAI({
      systemPrompt: skillGapSystemPrompt,
      userPrompt: buildSkillGapUserPrompt(user.skills || [], targetRole, targetSkills),
    })
  );

  success(res, { result }, 'Skill gap analysis complete');
});

// @route POST /api/ai/interview-questions  { jobId?, mode?, count? }
const interviewQuestions = asyncHandler(async (req, res) => {
  const { jobId, mode, count } = req.body;
  const user = await User.findById(req.user._id);

  let jobDescription = null;
  let targetRole = user.targetRoles?.[0] || null;
  if (jobId) {
    const job = await getOwnedJob(jobId, req.user._id);
    jobDescription = job.description;
    targetRole = job.position;
  }

  const primaryResume = await Resume.findOne({ userId: req.user._id, isPrimary: true });

  const result = await withUsageLogging(req.user._id, 'interview-questions', () =>
    callAI({
      systemPrompt: interviewQuestionsSystemPrompt,
      userPrompt: buildInterviewQuestionsUserPrompt({
        resumeSummary: primaryResume?.parsedData?.summary,
        jobDescription,
        skills: user.skills,
        targetRole,
        mode,
        count,
      }),
    })
  );

  const session = await InterviewSession.create({
    userId: req.user._id,
    jobId: jobId || undefined,
    mode: mode || 'Mixed',
    status: 'in-progress',
    questions: result.questions.map((q) => ({ question: q.question, category: q.category, difficulty: q.difficulty })),
  });

  success(res, { session }, 'Interview questions generated', 201);
});

// @route POST /api/ai/interview-feedback  { sessionId, questionIndex, answer }
const interviewFeedback = asyncHandler(async (req, res) => {
  const { sessionId, questionIndex, answer } = req.body;

  const session = await InterviewSession.findById(sessionId);
  if (!session) throw new ApiError(404, 'Interview session not found');
  if (session.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'You do not have access to this interview session');
  }
  if (!session.questions[questionIndex]) {
    throw new ApiError(400, 'Invalid questionIndex for this session');
  }

  const question = session.questions[questionIndex];

  const feedback = await withUsageLogging(req.user._id, 'interview-feedback', () =>
    callAI({
      systemPrompt: interviewFeedbackSystemPrompt,
      userPrompt: buildInterviewFeedbackUserPrompt(question.question, answer, question.category),
    })
  );

  question.answer = answer;
  question.feedback = feedback;

  // If every question now has an answer, compute session-level aggregate scores
  const allAnswered = session.questions.every((q) => q.answer);
  if (allAnswered) {
    const avg = (key) => {
      const scores = session.questions.map((q) => q.feedback?.[key]).filter((v) => typeof v === 'number');
      return scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    };
    session.technicalScore = avg('technicalDepth');
    session.communicationScore = avg('communication');
    session.confidenceScore = avg('confidence');
    const overallParts = [avg('correctness'), avg('relevance'), avg('completeness'), avg('communication'), avg('confidence'), avg('technicalDepth')].filter(
      (v) => v !== null
    );
    session.overallScore = overallParts.length
      ? Math.round((overallParts.reduce((a, b) => a + b, 0) / overallParts.length) * 10) / 10
      : null;
    session.status = 'completed';
  }

  await session.save();

  success(res, { feedback, session }, 'Answer evaluated');
});

// @route POST /api/ai/chat  { message }
const chat = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const contextBlock = await retrieveContext(req.user._id);

  const reply = await withUsageLogging(req.user._id, 'chat', () =>
    callAI({
      systemPrompt: careerAssistantSystemPrompt,
      userPrompt: buildCareerAssistantUserPrompt(contextBlock, message),
      expectJson: false,
      maxTokens: 800,
    })
  );

  success(res, { reply }, 'Assistant responded');
});

module.exports = {
  parseResume,
  analyzeJob,
  matchResume,
  atsAnalysis,
  improveResume,
  skillGap,
  interviewQuestions,
  interviewFeedback,
  chat,
};
