'use strict';

const crypto = require('crypto');
const razorpay = require('../../services/razorpay');
const { RAZORPAY_KEY_SECRET } = require('../../config/env');

/**
 * Create Razorpay order
 */
exports.createOrder = async (req, res, next) => {
  try {
    const { amount, eventId, eventTitle } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid amount',
      });
    }

    // Create order options
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (₹300 = 30000 paise)
      currency: 'INR',
      receipt: `event_${eventId}_${Date.now()}`,
      notes: {
        eventId: eventId,
        eventTitle: eventTitle || 'Event Registration',
      },
    };

    // Create order via Razorpay API
    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay payment signature
 */
exports.verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification parameters',
      });
    }

    // Generate signature for verification
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest('hex');

    // Verify signature
    if (razorpay_signature === expectedSign) {
      // Fetch payment details from Razorpay
      const payment = await razorpay.payments.fetch(razorpay_payment_id);

      res.json({
        success: true,
        verified: true,
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount / 100, // Convert paise to rupees
          status: payment.status,
          method: payment.method,
          email: payment.email,
          contact: payment.contact,
        },
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        message: 'Invalid payment signature',
      });
    }
  } catch (error) {
    console.error('Razorpay payment verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message,
    });
  }
};

/**
 * Get Razorpay Key ID for frontend
 */
exports.getKeyId = async (req, res, next) => {
  try {
    const { RAZORPAY_KEY_ID } = require('../../config/env');
    
    res.json({
      success: true,
      data: {
        keyId: RAZORPAY_KEY_ID,
      },
    });
  } catch (error) {
    console.error('Error fetching Razorpay key:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment configuration',
    });
  }
};
