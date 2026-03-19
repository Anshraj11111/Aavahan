'use strict';

const Registration = require('../registrations/registration.model');
const Event = require('../events/event.model');
const { ROLES } = require('../../constants/roles');
const { REGISTRATION_STATUS, PAYMENT_STATUS } = require('../../constants/statuses');

/**
 * Build a base registration filter based on admin role.
 * Non-super_admin admins only see registrations for events in their category.
 */
async function buildRoleFilter(admin) {
  if (admin.role === ROLES.SUPER_ADMIN) return {};
  // For cultural/technical admins, filter by their category
  const categoryMap = {
    [ROLES.CULTURAL_ADMIN]: 'cultural',
    [ROLES.TECHNICAL_ADMIN]: 'technical',
  };
  const category = categoryMap[admin.role];
  if (!category) return {};
  const events = await Event.find({ category }).select('_id').lean();
  const eventIds = events.map((e) => e._id);
  return { eventId: { $in: eventIds } };
}

async function getOverallStats(admin) {
  const baseFilter = await buildRoleFilter(admin);
  const [
    totalRegistrations,
    pendingVerification,
    approved,
    rejected,
    checkedIn,
    totalRevenue,
  ] = await Promise.all([
    Registration.countDocuments(baseFilter),
    Registration.countDocuments({ ...baseFilter, paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION }),
    Registration.countDocuments({ ...baseFilter, registrationStatus: REGISTRATION_STATUS.APPROVED }),
    Registration.countDocuments({ ...baseFilter, registrationStatus: REGISTRATION_STATUS.REJECTED }),
    Registration.countDocuments({ ...baseFilter, registrationStatus: REGISTRATION_STATUS.CHECKED_IN }),
    Registration.aggregate([
      { $match: { ...baseFilter, paymentStatus: PAYMENT_STATUS.PAID } },
      { $group: { _id: null, total: { $sum: '$amountExpected' } } },
    ]),
  ]);
  return {
    totalRegistrations,
    pendingVerification,
    approved,
    rejected,
    checkedIn,
    totalRevenue: totalRevenue[0]?.total || 0,
  };
}

async function getEventWiseStats(admin) {
  const baseFilter = await buildRoleFilter(admin);
  return Registration.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: '$eventId',
        eventTitle: { $first: '$eventTitle' },
        eventDay: { $first: '$eventDay' },
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$registrationStatus', REGISTRATION_STATUS.APPROVED] }, 1, 0] } },
        checkedIn: { $sum: { $cond: [{ $eq: ['$registrationStatus', REGISTRATION_STATUS.CHECKED_IN] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.PAID] }, '$amountExpected', 0] } },
      },
    },
    { $sort: { total: -1 } },
  ]);
}

async function getDayWiseStats(admin) {
  const baseFilter = await buildRoleFilter(admin);
  return Registration.aggregate([
    { $match: baseFilter },
    {
      $group: {
        _id: '$eventDay',
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ['$registrationStatus', REGISTRATION_STATUS.APPROVED] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $eq: ['$paymentStatus', PAYMENT_STATUS.PAID] }, '$amountExpected', 0] } },
      },
    },
    { $sort: { _id: 1 } },
  ]);
}

async function getCategoryWiseStats(admin) {
  const baseFilter = await buildRoleFilter(admin);
  const events = await Event.find({}).select('_id category').lean();
  const categoryMap = {};
  events.forEach((e) => { categoryMap[e._id.toString()] = e.category; });

  const regs = await Registration.find(baseFilter).select('eventId registrationStatus amountExpected paymentStatus').lean();
  const stats = {};
  regs.forEach((r) => {
    const cat = categoryMap[r.eventId?.toString()] || 'other';
    if (!stats[cat]) stats[cat] = { category: cat, total: 0, approved: 0, revenue: 0 };
    stats[cat].total++;
    if (r.registrationStatus === REGISTRATION_STATUS.APPROVED) stats[cat].approved++;
    if (r.paymentStatus === PAYMENT_STATUS.PAID) stats[cat].revenue += r.amountExpected;
  });
  return Object.values(stats).sort((a, b) => b.total - a.total);
}

async function getLatestRegistrations(admin, limit = 10) {
  const baseFilter = await buildRoleFilter(admin);
  return Registration.find(baseFilter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('uniqueRegistrationId fullName eventTitle eventDay registrationStatus paymentStatus createdAt')
    .lean();
}

async function getTopEvents(admin, limit = 5) {
  const baseFilter = await buildRoleFilter(admin);
  return Registration.aggregate([
    { $match: baseFilter },
    { $group: { _id: '$eventId', eventTitle: { $first: '$eventTitle' }, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: limit },
  ]);
}

async function getPendingVerifications(admin) {
  const baseFilter = await buildRoleFilter(admin);
  return Registration.find({ ...baseFilter, paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION })
    .sort({ createdAt: 1 })
    .select('uniqueRegistrationId fullName eventTitle eventDay amountExpected createdAt transactionId paymentScreenshotUrl')
    .lean();
}

module.exports = {
  getOverallStats,
  getEventWiseStats,
  getDayWiseStats,
  getCategoryWiseStats,
  getLatestRegistrations,
  getTopEvents,
  getPendingVerifications,
};
