'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const {
  overallStats, eventWise, dayWise, categoryWise,
  latestRegistrations, topEvents, pendingVerifications,
} = require('./dashboard.controller');

const mgmt = authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN);

router.use(auth, mgmt);
router.get('/stats', overallStats);
router.get('/event-wise', eventWise);
router.get('/day-wise', dayWise);
router.get('/category-wise', categoryWise);
router.get('/latest-registrations', latestRegistrations);
router.get('/top-events', topEvents);
router.get('/pending-verifications', pendingVerifications);

module.exports = router;
