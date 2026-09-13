const express = require('express');
const router = express.Router();

const {
  getPlatformStats,
  listUsers,
  setUserActiveStatus,
  listSkills,
  createSkill,
  deleteSkill,
  getAiUsage,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

router.use(protect, authorize('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', listUsers);
router.put('/users/:id/status', setUserActiveStatus);
router.get('/skills', listSkills);
router.post('/skills', createSkill);
router.delete('/skills/:id', deleteSkill);
router.get('/ai-usage', getAiUsage);

module.exports = router;
