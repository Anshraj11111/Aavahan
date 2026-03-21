'use strict';

const express = require('express');
const router = express.Router();

const registrationController = require('./registration.controller');
const { validate } = require('../../middlewares/validate');
const { registrationLimiter, uploadLimiter, verificationLimiter } = require('../../middlewares/rateLimiter');
const { upload } = require('../../middlewares/upload');
const { registrationSchema } = require('./registration.validator');

/**
 * @swagger
 * /registrations:
 *   post:
 *     summary: Submit a new event registration with payment screenshot
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, email, phone, instituteName, eventId]
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               instituteName:
 *                 type: string
 *               eventId:
 *                 type: string
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Registration submitted
 *       400:
 *         description: Validation error or business rule violation
 *       409:
 *         description: Duplicate registration
 *       429:
 *         description: Rate limit exceeded
 */
router.post(
  '/',
  registrationLimiter,
  uploadLimiter,
  upload.single('screenshot'),
  validate(registrationSchema),
  registrationController.createRegistration
);

/**
 * @swagger
 * /registrations/verify-payment:
 *   post:
 *     summary: Verify payment screenshot and transaction ID match
 *     tags: [Registrations]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [transactionId, screenshot]
 *             properties:
 *               transactionId:
 *                 type: string
 *               screenshot:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Payment verified successfully
 *       400:
 *         description: Verification failed
 */
router.post(
  '/verify-payment',
  verificationLimiter,
  upload.single('screenshot'),
  registrationController.verifyPayment
);

module.exports = router;
