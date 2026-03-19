'use strict';

const cron = require('node-cron');
const Registration = require('../modules/registrations/registration.model');
const { sendPendingVerificationReminder } = require('../services/email');
const { PAYMENT_STATUS } = require('../constants/statuses');
const env = require('../config/env');

/**
 * Daily at 9 AM: find registrations pending_verification for > 24h, send reminder to admin.
 */
function startPendingVerificationReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const registrations = await Registration.find({
        paymentStatus: PAYMENT_STATUS.PENDING_VERIFICATION,
        createdAt: { $lt: cutoff },
      })
        .select('uniqueRegistrationId fullName eventTitle createdAt')
        .lean();

      if (registrations.length === 0) return;

      await sendPendingVerificationReminder({
        to: env.ADMIN_ALERT_EMAIL,
        count: registrations.length,
        registrations,
      });

      console.log(`[Cron] pendingVerificationReminder: notified admin of ${registrations.length} pending registration(s)`);
    } catch (err) {
      console.error('[Cron] pendingVerificationReminder error:', err.message);
    }
  });
}

module.exports = startPendingVerificationReminderJob;
