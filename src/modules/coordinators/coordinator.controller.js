'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { listCoordinators, createCoordinator, updateCoordinator, assignEvents, deactivateCoordinator } = require('./coordinator.service');

const list = asyncHandler(async (req, res) => {
  const data = await listCoordinators({ query: req.query });
  successResponse(res, data, 'Coordinators fetched');
});

const create = asyncHandler(async (req, res) => {
  const coordinator = await createCoordinator({ body: req.body, admin: req.admin, req });
  successResponse(res, { coordinator }, 'Coordinator created', 201);
});

const update = asyncHandler(async (req, res) => {
  const coordinator = await updateCoordinator({ id: req.params.id, body: req.body, admin: req.admin, req });
  successResponse(res, { coordinator }, 'Coordinator updated');
});

const assign = asyncHandler(async (req, res) => {
  const coordinator = await assignEvents({ id: req.params.id, eventIds: req.body.eventIds, admin: req.admin, req });
  successResponse(res, { coordinator }, 'Events assigned');
});

const deactivate = asyncHandler(async (req, res) => {
  const coordinator = await deactivateCoordinator({ id: req.params.id, admin: req.admin, req });
  successResponse(res, { coordinator }, 'Coordinator deactivated');
});

module.exports = { list, create, update, assign, deactivate };
