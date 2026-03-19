'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { getTicketByUniqueId, getTicketsByContact } = require('./ticket.service');

const getTicket = asyncHandler(async (req, res) => {
  const ticket = await getTicketByUniqueId(req.params.uniqueId);
  successResponse(res, { ticket }, 'Ticket fetched');
});

const getTicketsByContactHandler = asyncHandler(async (req, res) => {
  const { email, phone } = req.query;
  const tickets = await getTicketsByContact({ email, phone });
  successResponse(res, { tickets }, 'Tickets fetched');
});

module.exports = { getTicket, getTicketsByContactHandler };
