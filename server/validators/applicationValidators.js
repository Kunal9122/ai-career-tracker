const { body } = require('express-validator');
const { APPLICATION_STATUSES } = require('../models/JobApplication');

const createApplicationValidator = [
  body('jobId').notEmpty().withMessage('jobId is required').isMongoId().withMessage('Invalid jobId'),
  body('resumeId').optional().isMongoId().withMessage('Invalid resumeId'),
  body('status').optional().isIn(APPLICATION_STATUSES).withMessage('Invalid status'),
];

const updateApplicationValidator = [
  body('status').optional().isIn(APPLICATION_STATUSES).withMessage('Invalid status'),
  body('resumeId').optional().isMongoId().withMessage('Invalid resumeId'),
  body('interviewDate').optional().isISO8601().withMessage('Invalid interview date'),
];

module.exports = { createApplicationValidator, updateApplicationValidator };
