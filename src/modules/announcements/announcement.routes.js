'use strict';

const router = require('express').Router();
const auth = require('../../middlewares/auth');
const authorize = require('../../middlewares/authorize');
const { ROLES } = require('../../constants/roles');
const { list, create, update, remove } = require('./announcement.controller');

router.get('/', auth, authorize(ROLES.SUPER_ADMIN, ROLES.CULTURAL_ADMIN, ROLES.TECHNICAL_ADMIN), list);
router.post('/', auth, authorize(ROLES.SUPER_ADMIN), create);
router.patch('/:id', auth, authorize(ROLES.SUPER_ADMIN), update);
router.delete('/:id', auth, authorize(ROLES.SUPER_ADMIN), remove);

module.exports = router;
