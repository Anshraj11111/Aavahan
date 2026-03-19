'use strict';

const QRCode = require('qrcode');
const { uploadBuffer } = require('../config/cloudinary');

/**
 * Generate a QR code PNG from a payload object, upload to Cloudinary, return URL.
 * @param {object} payload - Data to encode in QR
 * @param {string} publicId - Cloudinary public_id for the file
 * @returns {Promise<string>} Cloudinary secure URL
 */
async function generateQR(payload, publicId) {
  const qrBuffer = await QRCode.toBuffer(JSON.stringify(payload), {
    type: 'png',
    width: 400,
    margin: 2,
    errorCorrectionLevel: 'H',
  });

  const result = await uploadBuffer(qrBuffer, {
    folder: 'techfest2026/qr-tickets',
    public_id: publicId || `qr-${Date.now()}`,
    format: 'png',
  });

  return result.secure_url;
}

module.exports = generateQR;
