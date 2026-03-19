'use strict';

const authService = require('./auth.service');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');

/**
 * POST /api/v1/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { token, admin } = await authService.login({ email, password, req });

  return successResponse(res, { token, admin }, 'Login successful');
});

/**
 * GET /api/v1/auth/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  return successResponse(res, { admin: req.admin }, 'Profile fetched');
});

/**
 * POST /api/v1/auth/logout
 * JWT is stateless — client discards token. We just confirm.
 */
const logout = asyncHandler(async (req, res) => {
  return successResponse(res, null, 'Logged out successfully');
});

module.exports = { login, getProfile, logout };
