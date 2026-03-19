'use strict';

const mongoose = require('mongoose');

const paymentConfigSchema = new mongoose.Schema(
  {
    qrImage: { type: String, default: '' },
    upiId: { type: String, required: [true, 'UPI ID is required'], trim: true },
    payeeName: { type: String, required: [true, 'Payee name is required'], trim: true },
    note: { type: String, trim: true, default: '' },
    active: { type: Boolean, default: true },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  },
  { timestamps: true }
);

// Only one active config at a time — enforced at service layer
paymentConfigSchema.index({ active: 1 });

const PaymentConfig = mongoose.model('PaymentConfig', paymentConfigSchema);
module.exports = PaymentConfig;
