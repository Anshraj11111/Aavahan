'use strict';

/**
 * Clear all seed data from database
 * Run: node src/scripts/clearSeedData.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const env = require('../config/env');
const Admin = require('../modules/admin/admin.model');
const Event = require('../modules/events/event.model');
const Coordinator = require('../modules/coordinators/coordinator.model');
const PaymentConfig = require('../modules/payments/payment.model');
const Announcement = require('../modules/announcements/announcement.model');

async function clearSeedData() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Clear] Connected to MongoDB');

  // Delete ALL events (not just seed data) to ensure clean database
  const deletedEvents = await Event.deleteMany({});
  const deletedCoordinators = await Coordinator.deleteMany({});
  const deletedPaymentConfigs = await PaymentConfig.deleteMany({});
  const deletedAnnouncements = await Announcement.deleteMany({});
  
  console.log('[Clear] ✅ All data cleared!');
  console.log(`[Clear] Deleted ${deletedEvents.deletedCount} events`);
  console.log(`[Clear] Deleted ${deletedCoordinators.deletedCount} coordinators`);
  console.log(`[Clear] Deleted ${deletedPaymentConfigs.deletedCount} payment configs`);
  console.log(`[Clear] Deleted ${deletedAnnouncements.deletedCount} announcements`);
  console.log('[Clear] Database is now empty - ready for real data');
  console.log('[Clear] Admin accounts kept for login');

  await mongoose.disconnect();
}

clearSeedData().catch((err) => {
  console.error('[Clear] Error:', err.message);
  process.exit(1);
});
