'use strict';

const express = require('express');
const router = express.Router();

const eventController = require('./event.controller');
const authenticate = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { validate } = require('../../middlewares/validate');
const { upload } = require('../../middlewares/upload');
const { createEventSchema, updateEventSchema } = require('./event.validator');
const { ROLES } = require('../../constants/roles');

const canManageEvents = [ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN];

// All admin event routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /admin/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.post('/', authorize(...canManageEvents), validate(createEventSchema), eventController.createEvent);

/**
 * @swagger
 * /admin/events:
 *   get:
 *     summary: List all events (admin)
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.get('/', eventController.getEvents);

/**
 * @swagger
 * /admin/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', eventController.getEventById);

/**
 * @swagger
 * /admin/events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.put('/:id', authorize(...canManageEvents), validate(updateEventSchema), eventController.updateEvent);

/**
 * @swagger
 * /admin/events/{id}:
 *   delete:
 *     summary: Delete an event (only if no registrations)
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), eventController.deleteEvent);

/**
 * @swagger
 * /admin/events/{id}/image:
 *   post:
 *     summary: Upload event poster or banner image
 *     tags: [Admin - Events]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/image',
  authorize(...canManageEvents),
  upload.single('image'),
  eventController.uploadEventImage
);

module.exports = router;
