'use strict';

const express = require('express');
const router = express.Router();
const razorpayController = require('./razorpay.controller');

/**
 * @route   POST /api/v1/payments/razorpay/create-order
 * @desc    Create Razorpay order
 * @access  Public
 */
router.post('/create-order', razorpayController.createOrder);

/**
 * @route   POST /api/v1/payments/razorpay/verify
 * @desc    Verify Razorpay payment
 * @access  Public
 */
router.post('/verify', razorpayController.verifyPayment);

/**
 * @route   GET /api/v1/payments/razorpay/key
 * @desc    Get Razorpay Key ID
 * @access  Public
 */
router.get('/key', razorpayController.getKeyId);

module.exports = router;
