'use strict';

const PaymentConfig = require('./payment.model');
const { uploadBuffer } = require('../../config/cloudinary');
const createAuditLog = require('../../utils/auditLog');
const { cacheDel } = require('../../services/cache');
const { CACHE_KEYS } = require('../../constants/events');

async function getActiveConfig() {
  const config = await PaymentConfig.findOne({ active: true }).lean();
  if (!config) {
    const err = new Error('No active payment configuration found'); err.statusCode = 404; throw err;
  }
  return config;
}

async function createConfig({ body, file, admin, req }) {
  const { upiId, payeeName, note } = body;

  // Deactivate existing configs
  await PaymentConfig.updateMany({ active: true }, { active: false });

  let qrImage = '';
  if (file) {
    const result = await uploadBuffer(file.buffer, {
      folder: 'techfest2026/payment-qr',
      public_id: `payment-qr-${Date.now()}`,
    });
    qrImage = result.secure_url;
  }

  const config = await PaymentConfig.create({ upiId, payeeName, note, qrImage, active: true, updatedBy: admin._id });

  await cacheDel(CACHE_KEYS.PAYMENT_CONFIG);

  await createAuditLog({
    adminId: admin._id, adminEmail: admin.email,
    action: 'CREATE_PAYMENT_CONFIG', targetModel: 'PaymentConfig', targetId: config._id.toString(),
    changes: { after: { upiId, payeeName } }, req,
  });

  return config;
}

async function updateConfig({ configId, body, file, admin, req }) {
  const config = await PaymentConfig.findById(configId);
  if (!config) { const err = new Error('Config not found'); err.statusCode = 404; throw err; }

  const before = { upiId: config.upiId, payeeName: config.payeeName, note: config.note };

  if (body.upiId !== undefined) config.upiId = body.upiId;
  if (body.payeeName !== undefined) config.payeeName = body.payeeName;
  if (body.note !== undefined) config.note = body.note;
  config.updatedBy = admin._id;

  if (file) {
    const result = await uploadBuffer(file.buffer, {
      folder: 'techfest2026/payment-qr',
      public_id: `payment-qr-${Date.now()}`,
    });
    config.qrImage = result.secure_url;
  }

  await config.save();
  await cacheDel(CACHE_KEYS.PAYMENT_CONFIG);

  await createAuditLog({
    adminId: admin._id, adminEmail: admin.email,
    action: 'UPDATE_PAYMENT_CONFIG', targetModel: 'PaymentConfig', targetId: config._id.toString(),
    changes: { before, after: { upiId: config.upiId, payeeName: config.payeeName } }, req,
  });

  return config;
}

module.exports = { getActiveConfig, createConfig, updateConfig };
