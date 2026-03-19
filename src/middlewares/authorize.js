'use strict';

/**
 * Role-based access control middleware factory.
 * Usage: router.get('/route', authenticate, authorize('super_admin', 'cultural_admin'), handler)
 *
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.admin) {
      const err = new Error('Authentication required');
      err.statusCode = 401;
      return next(err);
    }

    if (!roles.includes(req.admin.role)) {
      const err = new Error(
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.admin.role}`
      );
      err.statusCode = 403;
      return next(err);
    }

    next();
  };
}

module.exports = authorize;
