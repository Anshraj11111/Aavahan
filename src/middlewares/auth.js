'use strict';

const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Admin = require('../modules/admin/admin.model');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Verify JWT from Authorization header and attach admin to req.admin.
 * Expects: Authorization: Bearer <token>
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const err = new Error('No token provided. Authorization denied.');
    err.statusCode = 401;
    return next(err);
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    return next(err); // JsonWebTokenError or TokenExpiredError
  }

  const admin = await Admin.findById(decoded.id).select('-password').lean();

  if (!admin) {
    const err = new Error('Admin not found');
    err.statusCode = 401;
    return next(err);
  }

  if (!admin.isActive) {
    const err = new Error('Account is deactivated');
    err.statusCode = 403;
    return next(err);
  }

  req.admin = admin;
  next();
});

module.exports = authenticate;
