const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
require('dotenv').config();

async function checkAllEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Get ALL events (including drafts)
    const allEvents = await Event.find({})
      .select('title status currentRegistrations maxRegistrations')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n📊 Total Events (All Status): ${allEvents.length}\n`);
    console.log('=' .repeat(100));

    const byStatus = {
      published: [],
      draft: [],
      closed: []
    };

    allEvents.forEach((event, index) => {
      byStatus[event.status] = byStatus[event.status] || [];
      byStatus[event.status].push(event);

      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status.toUpperCase()}`);
      console.log(`   Registrations: ${event.currentRegistrations} / ${event.maxRegistrations || '∞'}`);
      console.log('-'.repeat(100));
    });

    console.log(`\n📈 Summary by Status:`);
    console.log(`   📗 PUBLISHED: ${byStatus.published?.length || 0}`);
    console.log(`   📝 DRAFT: ${byStatus.draft?.length || 0}`);
    console.log(`   📕 CLOSED: ${byStatus.closed?.length || 0}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkAllEvents();
