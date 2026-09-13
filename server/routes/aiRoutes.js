const express = require('express');
const router = express.Router();

const {
  parseResume,
  analyzeJob,
  matchResume,
  atsAnalysis,
  improveResume,
  skillGap,
  interviewQuestions,
  interviewFeedback,
  chat,
} = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');
const aiRateLimiter = require('../middleware/aiRateLimiter');
const validateRequest = require('../middleware/validateRequest');
const {
  analyzeJobValidator,
  matchResumeValidator,
  atsAnalysisValidator,
  improveResumeValidator,
  skillGapValidator,
  interviewQuestionsValidator,
  interviewFeedbackValidator,
  chatValidator,
} = require('../validators/aiValidators');

router.use(protect, aiRateLimiter);

router.post('/parse-resume', parseResume);
router.post('/analyze-job', analyzeJobValidator, validateRequest, analyzeJob);
router.post('/match-resume', matchResumeValidator, validateRequest, matchResume);
router.post('/ats-analysis', atsAnalysisValidator, validateRequest, atsAnalysis);
router.post('/improve-resume', improveResumeValidator, validateRequest, improveResume);
router.post('/skill-gap', skillGapValidator, validateRequest, skillGap);
router.post('/interview-questions', interviewQuestionsValidator, validateRequest, interviewQuestions);
router.post('/interview-feedback', interviewFeedbackValidator, validateRequest, interviewFeedback);
router.post('/chat', chatValidator, validateRequest, chat);

module.exports = router;
