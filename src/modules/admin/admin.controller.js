'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const AuditLog = require('./auditlog.model');

const getAuditLogs = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, adminId, action, targetModel } = req.query;
  const filter = {};
  if (adminId) filter.adminId = adminId;
  if (action) filter.action = new RegExp(action, 'i');
  if (targetModel) filter.targetModel = targetModel;

  const skip = (Number(page) - 1) * Number(limit);
  const [logs, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    AuditLog.countDocuments(filter),
  ]);

  successResponse(res, {
    logs,
    pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) },
  }, 'Audit logs fetched');
});

module.exports = { getAuditLogs };
