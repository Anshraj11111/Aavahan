require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
const { getRedisClient } = require('../config/redis');

/**
 * Comprehensive script to fix event visibility issues
 * 1. Checks all events in database
 * 2. Clears Redis cache
 * 3. Publishes any draft events
 */
async function fixEventVisibility() {
  try {
    console.log('🔧 Starting Event Visibility Fix...\n');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Step 1: Check all events
    console.log('📋 Checking all events in database...');
    const allEvents = await Event.find({}).select('title status featured day category createdAt');
    console.log(`Found ${allEvents.length} total events\n`);

    if (allEvents.length === 0) {
      console.log('❌ No events found in database!');
      console.log('The event might not have been saved properly.');
      console.log('Please try creating the event again from the admin panel.\n');
      await mongoose.connection.close();
      return;
    }

    // Display all events
    console.log('All events in database:');
    allEvents.forEach((event, index) => {
      console.log(`\n${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Featured: ${event.featured}`);
      console.log(`   Day: ${event.day || 'N/A'}`);
      console.log(`   Category: ${event.category || 'N/A'}`);
      console.log(`   Created: ${event.createdAt}`);
    });
    console.log('\n');

    // Step 2: Clear Redis cache
    console.log('🗑️  Clearing Redis cache...');
    try {
      const redis = getRedisClient();
      if (redis) {
        // Clear all event-related cache keys
        let cursor = '0';
        let totalDeleted = 0;
        
        do {
          const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', 'events:*', 'COUNT', 100);
          cursor = nextCursor;
          if (keys.length > 0) {
            await redis.del(...keys);
            totalDeleted += keys.length;
          }
        } while (cursor !== '0');
        
        // Also clear public stats cache
        await redis.del('public:stats');
        
        console.log(`✓ Cleared ${totalDeleted} cache keys\n`);
      } else {
        console.log('⚠️  Redis not connected - skipping cache clear\n');
      }
    } catch (error) {
      console.log('⚠️  Redis cache clear failed (this is OK if Redis is not running):', error.message, '\n');
    }

    // Step 3: Publish draft events
    const draftEvents = allEvents.filter(e => e.status === 'draft');
    if (draftEvents.length > 0) {
      console.log(`📢 Found ${draftEvents.length} draft event(s) - publishing them now...`);
      
      const result = await Event.updateMany(
        { status: 'draft' },
        { $set: { status: 'published' } }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} events to published status\n`);
    } else {
      console.log('✓ All events are already published\n');
    }

    // Step 4: Final verification
    console.log('✅ Final Status:');
    const publishedCount = await Event.countDocuments({ status: 'published' });
    const draftCount = await Event.countDocuments({ status: 'draft' });
    const closedCount = await Event.countDocuments({ status: 'closed' });
    
    console.log(`   Published: ${publishedCount}`);
    console.log(`   Draft: ${draftCount}`);
    console.log(`   Closed: ${closedCount}`);
    console.log(`   Total: ${allEvents.length}\n`);

    await mongoose.connection.close();
    console.log('✓ Script completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('   1. Refresh your admin panel');
    console.log('   2. Refresh your events page');
    console.log('   3. Events should now be visible\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixEventVisibility();
