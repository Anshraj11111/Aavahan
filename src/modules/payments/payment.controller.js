'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { getActiveConfig, createConfig, updateConfig } = require('./payment.service');

const getConfig = asyncHandler(async (req, res) => {
  const config = await getActiveConfig();
  successResponse(res, { config }, 'Payment config fetched');
});

const create = asyncHandler(async (req, res) => {
  const config = await createConfig({ body: req.body, file: req.file, admin: req.admin, req });
  successResponse(res, { config }, 'Payment config created', 201);
});

const update = asyncHandler(async (req, res) => {
  const config = await updateConfig({ configId: req.params.id, body: req.body, file: req.file, admin: req.admin, req });
  successResponse(res, { config }, 'Payment config updated');
});

module.exports = { getConfig, create, update };
