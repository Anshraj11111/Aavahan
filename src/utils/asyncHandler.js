'use strict';

/**
 * Wraps an async Express route handler to automatically catch errors
 * and forward them to the centralized error handler via next().
 *
 * @param {Function} fn - Async controller function (req, res, next)
 * @returns {Function} Express middleware
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
