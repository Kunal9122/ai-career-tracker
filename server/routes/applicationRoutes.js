const express = require('express');
const router = express.Router();

const {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const validateRequest = require('../middleware/validateRequest');
const {
  createApplicationValidator,
  updateApplicationValidator,
} = require('../validators/applicationValidators');

router.use(protect);

router.route('/').post(createApplicationValidator, validateRequest, createApplication).get(getApplications);
router
  .route('/:id')
  .get(getApplicationById)
  .put(updateApplicationValidator, validateRequest, updateApplication)
  .delete(deleteApplication);

module.exports = router;
