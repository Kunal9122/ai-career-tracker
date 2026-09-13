const { body } = require('express-validator');

const jobValidator = [
  body('company').trim().notEmpty().withMessage('Company is required'),
  body('position').trim().notEmpty().withMessage('Position is required'),
  body('jobType')
    .optional()
    .isIn(['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'])
    .withMessage('Invalid job type'),
  body('requiredSkills').optional().isArray().withMessage('requiredSkills must be an array'),
  body('applicationDeadline').optional().isISO8601().withMessage('Invalid deadline date'),
];

module.exports = { jobValidator };
