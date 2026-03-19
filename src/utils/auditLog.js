'use strict';

/**
 * Create an AuditLog entry for a sensitive admin action.
 * Non-fatal: errors are logged but never thrown to callers.
 *
 * @param {object} params
 * @param {string} params.adminId
 * @param {string} params.adminEmail
 * @param {string} params.action - e.g. 'APPROVE_REGISTRATION', 'UPDATE_EVENT'
 * @param {string} [params.targetModel] - e.g. 'Registration', 'Event'
 * @param {string} [params.targetId]
 * @param {object} [params.changes] - { before: {}, after: {} }
 * @param {object} [params.req] - Express request (for IP/UA extraction)
 */
async function createAuditLog({ adminId, adminEmail, action, targetModel, targetId, changes, req }) {
  try {
    // Lazy-require to avoid circular dependency issues at module load time
    const AuditLog = require('../modules/admin/auditlog.model');

    const ipAddress = req
      ? req.ip || (req.headers && req.headers['x-forwarded-for']) || ''
      : '';
    const userAgent = req ? (req.headers && req.headers['user-agent']) || '' : '';

    await AuditLog.create({
      adminId,
      adminEmail,
      action,
      targetModel,
      targetId,
      changes: changes || {},
      ipAddress,
      userAgent,
    });
  } catch (err) {
    console.error('[AuditLog] Failed to create audit log:', err.message);
  }
}

module.exports = createAuditLog;
