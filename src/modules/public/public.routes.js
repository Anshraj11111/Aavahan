'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('./public.controller');

/**
 * @swagger
 * /public/fest-info:
 *   get:
 *     summary: Get fest information
 *     tags: [Public]
 */
router.get('/fest-info', publicController.getFestInfo);

/**
 * @swagger
 * /public/stats:
 *   get:
 *     summary: Get homepage stats
 *     tags: [Public]
 */
router.get('/stats', publicController.getStats);

/**
 * @swagger
 * /public/events/featured:
 *   get:
 *     summary: Get featured events
 *     tags: [Public]
 */
router.get('/events/featured', publicController.getFeaturedEvents);

/**
 * @swagger
 * /public/events/{slug}:
 *   get:
 *     summary: Get event by slug
 *     tags: [Public]
 */
router.get('/events/:slug', publicController.getEventBySlug);

/**
 * @swagger
 * /public/events:
 *   get:
 *     summary: Get all published events
 *     tags: [Public]
 */
router.get('/events', publicController.getPublishedEvents);

/**
 * @swagger
 * /public/schedule:
 *   get:
 *     summary: Get day-wise schedule
 *     tags: [Public]
 */
router.get('/schedule', publicController.getSchedule);

/**
 * @swagger
 * /public/announcements:
 *   get:
 *     summary: Get active announcements
 *     tags: [Public]
 */
router.get('/announcements', publicController.getAnnouncements);

/**
 * @swagger
 * /public/payment-config:
 *   get:
 *     summary: Get active payment config (UPI/QR)
 *     tags: [Public]
 */
router.get('/payment-config', publicController.getPaymentConfig);

/**
 * @swagger
 * /public/ticket/{uniqueId}:
 *   get:
 *     summary: Check registration/ticket status
 *     tags: [Public]
 */
router.get('/ticket/:uniqueId', publicController.getTicketStatus);

module.exports = router;
