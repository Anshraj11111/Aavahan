'use strict';

const jwt = require('jsonwebtoken');
const Admin = require('../admin/admin.model');
const createAuditLog = require('../../utils/auditLog');
const env = require('../../config/env');

/**
 * Sign a JWT access token for an admin.
 */
function signToken(adminId) {
  return jwt.sign({ id: adminId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

/**
 * Admin login service.
 * Returns { token, admin } on success.
 * Throws with statusCode on failure.
 */
async function login({ email, password, req }) {
  // Find admin including password field
  const admin = await Admin.findOne({ email }).select('+password');

  if (!admin) {
    // Log failed attempt
    await createAuditLog({
      adminId: null,
      adminEmail: email,
      action: 'LOGIN_FAILED',
      changes: { reason: 'Admin not found' },
      req,
    }).catch(() => {});

    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  if (!admin.isActive) {
    const err = new Error('Your account has been deactivated. Contact super admin.');
    err.statusCode = 403;
    throw err;
  }

  const isMatch = await admin.comparePassword(password);

  if (!isMatch) {
    await createAuditLog({
      adminId: admin._id,
      adminEmail: admin.email,
      action: 'LOGIN_FAILED',
      targetModel: 'Admin',
      targetId: admin._id,
      changes: { reason: 'Wrong password' },
      req,
    });

    const err = new Error('Invalid email or password');
    err.statusCode = 401;
    throw err;
  }

  // Update lastLogin
  admin.lastLogin = new Date();
  await admin.save({ validateBeforeSave: false });

  const token = signToken(admin._id);

  // Log successful login
  await createAuditLog({
    adminId: admin._id,
    adminEmail: admin.email,
    action: 'LOGIN_SUCCESS',
    targetModel: 'Admin',
    targetId: admin._id,
    req,
  });

  // Return admin without password
  const adminObj = admin.toObject();
  delete adminObj.password;

  return { token, admin: adminObj };
}

module.exports = { login, signToken };
