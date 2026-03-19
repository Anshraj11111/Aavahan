'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const { getAuditLogs } = require('./admin.controller');

router.get('/audit-logs', auth, authorize(ROLES.SUPER_ADMIN), getAuditLogs);

module.exports = router;
