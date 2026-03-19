'use strict';

const router = require('express').Router();
const { getTicket, getTicketsByContactHandler } = require('./ticket.controller');

router.get('/by-contact', getTicketsByContactHandler);
router.get('/:uniqueId', getTicket);

module.exports = router;
