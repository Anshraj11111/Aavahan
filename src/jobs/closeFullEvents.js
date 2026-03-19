'use strict';

const cron = require('node-cron');
const Event = require('../modules/events/event.model');
const { EVENT_STATUS } = require('../constants/statuses');

/**
 * Every 15 minutes: close published events that have reached max registrations.
 */
function startCloseFullEventsJob() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await Event.updateMany(
        {
          status: EVENT_STATUS.PUBLISHED,
          maxRegistrations: { $ne: null },
          $expr: { $gte: ['$currentRegistrations', '$maxRegistrations'] },
        },
        { $set: { status: EVENT_STATUS.CLOSED } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] closeFullEvents: closed ${result.modifiedCount} event(s)`);
      }
    } catch (err) {
      console.error('[Cron] closeFullEvents error:', err.message);
    }
  });
}

module.exports = startCloseFullEventsJob;
