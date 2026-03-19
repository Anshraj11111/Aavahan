'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const {
  getRegistrations, getRegistration, approve, reject, edit, cancel, regenQR,
} = require('./registration.admin.controller');

// All routes require authentication
router.use(auth);

router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN, ROLES.COORDINATOR), getRegistrations);
router.get('/:id', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN, ROLES.COORDINATOR), getRegistration);
router.patch('/:id/approve', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), approve);
router.patch('/:id/reject', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), reject);
router.patch('/:id/edit', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), edit);
router.patch('/:id/cancel', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), cancel);
router.post('/:id/regenerate-qr', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), regenQR);

module.exports = router;
