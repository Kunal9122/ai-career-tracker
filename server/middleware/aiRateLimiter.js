const rateLimit = require('express-rate-limit');

// AI calls are expensive (latency + cost), so they get a stricter limit
// than the rest of the API. Configurable via env so deployments can tune it.
const aiRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS, 10) || 60000,
  max: parseInt(process.env.AI_RATE_LIMIT_MAX, 10) || 15,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id?.toString() || req.ip,
  message: {
    success: false,
    message: 'Too many AI requests. Please wait a moment before trying again.',
  },
});

module.exports = aiRateLimiter;
