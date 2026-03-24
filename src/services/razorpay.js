'use strict';

const Razorpay = require('razorpay');
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = require('../config/env');

// Initialize Razorpay instance
const razorpayInstance = new Razorpay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

module.exports = razorpayInstance;
