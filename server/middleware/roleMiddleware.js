const ApiError = require('../utils/ApiError');

// Usage: router.get('/admin-only', protect, authorize('admin'), handler)
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, 'Not authorized');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(403, `Role '${req.user.role}' is not permitted to access this resource`);
    }
    next();
  };
};

module.exports = { authorize };
