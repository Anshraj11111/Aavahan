const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
require('dotenv').config();

async function publishClosedEvents() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Find all CLOSED events
    const closedEvents = await Event.find({ status: 'closed' });
    console.log(`\n📋 Found ${closedEvents.length} CLOSED events\n`);

    if (closedEvents.length === 0) {
      console.log('✓ No closed events to publish');
      await mongoose.disconnect();
      return;
    }

    // Update all to PUBLISHED
    const result = await Event.updateMany(
      { status: 'closed' },
      { $set: { status: 'published' } }
    );

    console.log(`✅ Published ${result.modifiedCount} events:`);
    closedEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title}`);
    });

    // Verify
    const publishedCount = await Event.countDocuments({ status: 'published' });
    console.log(`\n📊 Total Published Events Now: ${publishedCount}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    console.log('\n🔄 Now refresh your frontend to see all 20 events!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

publishClosedEvents();
