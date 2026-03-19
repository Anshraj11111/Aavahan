'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { uploadLimiter } = require('../../middlewares/rateLimiter');
const { upload } = require('../../middlewares/upload');
const { ROLES } = require('../../constants/roles');
const { getConfig, create, update } = require('./payment.controller');

router.get('/', auth, authorize(ROLES.SUPER_ADMIN), getConfig);
router.post('/', auth, authorize(ROLES.SUPER_ADMIN), uploadLimiter, upload.single('qrImage'), create);
router.patch('/:id', auth, authorize(ROLES.SUPER_ADMIN), uploadLimiter, upload.single('qrImage'), update);

module.exports = router;
