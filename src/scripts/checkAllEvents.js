require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');

/**
 * Script to check all events and publish any draft events
 */
async function checkAndPublishEvents() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Find ALL events regardless of status
    const allEvents = await Event.find({}).select('title status featured day category createdAt');
    console.log(`Total events in database: ${allEvents.length}\n`);

    if (allEvents.length === 0) {
      console.log('❌ No events found in database');
      console.log('The event might not have been saved properly.');
      await mongoose.connection.close();
      return;
    }

    console.log('All events:');
    allEvents.forEach((event, index) => {
      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Featured: ${event.featured}`);
      console.log(`   Day: ${event.day || 'N/A'}`);
      console.log(`   Category: ${event.category || 'N/A'}`);
      console.log(`   Created: ${event.createdAt}`);
      console.log('');
    });

    // Check for draft events
    const draftEvents = allEvents.filter(e => e.status === 'draft');
    if (draftEvents.length > 0) {
      console.log(`\n⚠️  Found ${draftEvents.length} draft event(s) - publishing them now...\n`);
      
      const result = await Event.updateMany(
        { status: 'draft' },
        { $set: { status: 'published' } }
      );
      
      console.log(`✓ Updated ${result.modifiedCount} events to published status\n`);
    } else {
      console.log('✓ All events are already published\n');
    }

    await mongoose.connection.close();
    console.log('✓ Script completed successfully');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAndPublishEvents();
