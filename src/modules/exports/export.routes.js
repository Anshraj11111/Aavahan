'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const { downloadCSV, downloadExcel } = require('./export.controller');

router.use(auth, authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN));
router.get('/csv', downloadCSV);
router.get('/excel', downloadExcel);

module.exports = router;
