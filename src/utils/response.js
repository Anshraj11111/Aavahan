'use strict';

/**
 * Send a standardized success response.
 */
function successResponse(res, data = null, message = 'Success', statusCode = 200) {
  const body = { success: true, message };
  if (data !== null && data !== undefined) {
    body.data = data;
  }
  return res.status(statusCode).json(body);
}

/**
 * Send a standardized error response.
 */
function errorResponse(res, message = 'An error occurred', statusCode = 500, errors = []) {
  const body = { success: false, message };
  if (errors && errors.length > 0) {
    body.errors = errors;
  }
  return res.status(statusCode).json(body);
}

/**
 * Send a paginated list response.
 */
function paginatedResponse(res, data, pagination, message = 'Success') {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
  });
}

module.exports = { successResponse, errorResponse, paginatedResponse };
