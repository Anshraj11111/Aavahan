'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const {
  getOverallStats, getEventWiseStats, getDayWiseStats, getCategoryWiseStats,
  getLatestRegistrations, getTopEvents, getPendingVerifications,
} = require('./dashboard.service');

const overallStats = asyncHandler(async (req, res) => {
  const data = await getOverallStats(req.admin);
  successResponse(res, data, 'Overall stats');
});

const eventWise = asyncHandler(async (req, res) => {
  const data = await getEventWiseStats(req.admin);
  successResponse(res, { stats: data }, 'Event-wise stats');
});

const dayWise = asyncHandler(async (req, res) => {
  const data = await getDayWiseStats(req.admin);
  successResponse(res, { stats: data }, 'Day-wise stats');
});

const categoryWise = asyncHandler(async (req, res) => {
  const data = await getCategoryWiseStats(req.admin);
  successResponse(res, { stats: data }, 'Category-wise stats');
});

const latestRegistrations = asyncHandler(async (req, res) => {
  const data = await getLatestRegistrations(req.admin, Number(req.query.limit) || 10);
  successResponse(res, { registrations: data }, 'Latest registrations');
});

const topEvents = asyncHandler(async (req, res) => {
  const data = await getTopEvents(req.admin, Number(req.query.limit) || 5);
  successResponse(res, { events: data }, 'Top events');
});

const pendingVerifications = asyncHandler(async (req, res) => {
  const data = await getPendingVerifications(req.admin);
  successResponse(res, { registrations: data }, 'Pending verifications');
});

module.exports = { overallStats, eventWise, dayWise, categoryWise, latestRegistrations, topEvents, pendingVerifications };
