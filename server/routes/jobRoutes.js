const express = require('express');
const router = express.Router();

const { createJob, getJobs, getJobById, updateJob, deleteJob } = require('../controllers/jobController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const { jobValidator } = require('../validators/jobValidators');

router.use(protect);

router.route('/').post(jobValidator, validateRequest, createJob).get(getJobs);
router.route('/:id').get(getJobById).put(updateJob).delete(deleteJob);

module.exports = router;
