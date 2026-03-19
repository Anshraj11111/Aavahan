'use strict';

const cron = require('node-cron');
const Event = require('../modules/events/event.model');
const { EVENT_STATUS } = require('../constants/statuses');

/**
 * Every 15 minutes: close published events whose registrationDeadline has passed.
 */
function startCloseExpiredEventsJob() {
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await Event.updateMany(
        {
          status: EVENT_STATUS.PUBLISHED,
          registrationDeadline: { $lt: new Date() },
        },
        { $set: { status: EVENT_STATUS.CLOSED } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Cron] closeExpiredEvents: closed ${result.modifiedCount} event(s)`);
      }
    } catch (err) {
      console.error('[Cron] closeExpiredEvents error:', err.message);
    }
  });
}

module.exports = startCloseExpiredEventsJob;
