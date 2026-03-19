'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const { list, create, update, assign, deactivate } = require('./coordinator.controller');

router.use(auth);
router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), list);
router.post('/', authorize(ROLES.SUPER_ADMIN), create);
router.patch('/:id', authorize(ROLES.SUPER_ADMIN), update);
router.patch('/:id/assign-events', authorize(ROLES.SUPER_ADMIN), assign);
router.patch('/:id/deactivate', authorize(ROLES.SUPER_ADMIN), deactivate);

module.exports = router;
