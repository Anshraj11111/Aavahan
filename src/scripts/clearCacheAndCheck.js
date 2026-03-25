const mongoose = require('mongoose');
const redis = require('../config/redis');
const Event = require('../modules/events/event.model');
require('dotenv').config();

async function clearCacheAndCheck() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    // Clear ALL Redis cache
    console.log('\n🗑️  Clearing Redis cache...');
    const { getRedisClient } = require('../config/redis');
    const redisClient = getRedisClient();
    if (redisClient) {
      await redisClient.flushall();
      console.log('✓ Redis cache cleared');
    } else {
      console.log('⚠️  Redis not connected, skipping cache clear');
    }

    // Count all events
    const totalEvents = await Event.countDocuments({});
    const publishedEvents = await Event.countDocuments({ status: 'published' });
    const draftEvents = await Event.countDocuments({ status: 'draft' });

    console.log(`\n📊 Event Counts:`);
    console.log(`   Total: ${totalEvents}`);
    console.log(`   Published: ${publishedEvents}`);
    console.log(`   Draft: ${draftEvents}`);

    // Get all events
    const allEvents = await Event.find({})
      .select('title status')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`\n📋 All Events in Database:`);
    allEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. ${event.title} - ${event.status.toUpperCase()}`);
    });

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
    console.log('\n✅ Cache cleared! Now refresh your frontend.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

clearCacheAndCheck();
