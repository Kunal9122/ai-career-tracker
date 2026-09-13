const { body } = require('express-validator');

const analyzeJobValidator = [
  body('jobDescription').trim().notEmpty().withMessage('jobDescription is required'),
];

const matchResumeValidator = [
  body('resumeId').notEmpty().isMongoId().withMessage('Valid resumeId is required'),
  body('jobId').notEmpty().isMongoId().withMessage('Valid jobId is required'),
];

const atsAnalysisValidator = [
  body('resumeId').notEmpty().isMongoId().withMessage('Valid resumeId is required'),
  body('jobId').optional().isMongoId().withMessage('Invalid jobId'),
];

const improveResumeValidator = [
  body('sectionName').trim().notEmpty().withMessage('sectionName is required'),
  body('sectionText').trim().notEmpty().withMessage('sectionText is required'),
];

const skillGapValidator = [
  body('jobId').optional().isMongoId().withMessage('Invalid jobId'),
];

const interviewQuestionsValidator = [
  body('mode').optional().isIn(['HR', 'Technical', 'Mixed', 'Role-specific']).withMessage('Invalid mode'),
  body('jobId').optional().isMongoId().withMessage('Invalid jobId'),
];

const interviewFeedbackValidator = [
  body('sessionId').notEmpty().isMongoId().withMessage('Valid sessionId is required'),
  body('questionIndex').isInt({ min: 0 }).withMessage('questionIndex must be a non-negative integer'),
  body('answer').trim().notEmpty().withMessage('answer is required'),
];

const chatValidator = [
  body('message').trim().notEmpty().withMessage('message is required'),
];

module.exports = {
  analyzeJobValidator,
  matchResumeValidator,
  atsAnalysisValidator,
  improveResumeValidator,
  skillGapValidator,
  interviewQuestionsValidator,
  interviewFeedbackValidator,
  chatValidator,
};
