'use strict';

/**
 * Setup real payment configuration
 * Run: node src/scripts/setupPaymentConfig.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const env = require('../config/env');
const PaymentConfig = require('../modules/payments/payment.model');

async function setupPaymentConfig() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Setup] Connected to MongoDB');

  // Delete any existing payment configs
  await PaymentConfig.deleteMany({});
  console.log('[Setup] Cleared existing payment configs');

  // Create the real payment config
  await PaymentConfig.create({
    upiId: '8269858259@ybl',
    payeeName: 'Shri Ram Group Tech Fest',
    note: 'Pay registration fee via UPI. Use your Registration ID as payment note.',
    active: true,
  });
  
  console.log('[Setup] ✅ Payment config created!');
  console.log('[Setup] UPI ID: 8269858259@ybl');

  await mongoose.disconnect();
}

setupPaymentConfig().catch((err) => {
  console.error('[Setup] Error:', err.message);
  process.exit(1);
});
