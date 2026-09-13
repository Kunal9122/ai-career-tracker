const express = require('express');
const router = express.Router();

const { getSessions, getSessionById, deleteSession } = require('../controllers/interviewController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);
router.get('/', getSessions);
router.get('/:id', getSessionById);
router.delete('/:id', deleteSession);

module.exports = router;
