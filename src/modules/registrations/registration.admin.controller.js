'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const {
  listRegistrations,
  approveRegistration,
  rejectRegistration,
  editRegistration,
  cancelRegistration,
  regenerateQR,
} = require('./registration.admin.service');

const getRegistrations = asyncHandler(async (req, res) => {
  const data = await listRegistrations({ query: req.query });
  successResponse(res, data, 'Registrations fetched');
});

const getRegistration = asyncHandler(async (req, res) => {
  const Registration = require('./registration.model');
  const reg = await Registration.findById(req.params.id).lean();
  if (!reg) { const e = new Error('Not found'); e.statusCode = 404; throw e; }
  successResponse(res, { registration: reg }, 'Registration fetched');
});

const approve = asyncHandler(async (req, res) => {
  const reg = await approveRegistration({ registrationId: req.params.id, admin: req.admin, req });
  successResponse(res, { registration: reg }, 'Registration approved');
});

const reject = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reg = await rejectRegistration({ registrationId: req.params.id, reason, admin: req.admin, req });
  successResponse(res, { registration: reg }, 'Registration rejected');
});

const edit = asyncHandler(async (req, res) => {
  const reg = await editRegistration({ registrationId: req.params.id, updates: req.body, admin: req.admin, req });
  successResponse(res, { registration: reg }, 'Registration updated');
});

const cancel = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const reg = await cancelRegistration({ registrationId: req.params.id, reason, admin: req.admin, req });
  successResponse(res, { registration: reg }, 'Registration cancelled');
});

const regenQR = asyncHandler(async (req, res) => {
  const reg = await regenerateQR({ registrationId: req.params.id, admin: req.admin, req });
  successResponse(res, { registration: reg }, 'QR regenerated');
});

module.exports = { getRegistrations, getRegistration, approve, reject, edit, cancel, regenQR };
