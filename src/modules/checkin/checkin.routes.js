'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { checkinLimiter } = require('../../middlewares/rateLimiter');
const { ROLES } = require('../../constants/roles');
const { checkIn } = require('./checkin.controller');

router.post('/', auth, authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN, ROLES.COORDINATOR), checkinLimiter, checkIn);

module.exports = router;
