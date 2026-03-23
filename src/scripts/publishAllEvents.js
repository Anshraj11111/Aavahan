require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');

/**
 * Script to update all draft events to published status
 * This ensures all events show on the public frontend
 */
async function publishAllEvents() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Find all draft events
    const draftEvents = await Event.find({ status: 'draft' });
    console.log(`Found ${draftEvents.length} draft events`);

    if (draftEvents.length === 0) {
      console.log('No draft events to publish');
      await mongoose.connection.close();
      return;
    }

    // Update all to published
    const result = await Event.updateMany(
      { status: 'draft' },
      { $set: { status: 'published' } }
    );

    console.log(`✓ Updated ${result.modifiedCount} events to published status`);
    
    // Show updated events
    const publishedEvents = await Event.find({ status: 'published' }).select('title status');
    console.log('\nPublished events:');
    publishedEvents.forEach(event => {
      console.log(`  - ${event.title} (${event.status})`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Script completed successfully');
  } catch (error) {
    console.error('Error publishing events:', error);
    process.exit(1);
  }
}

publishAllEvents();
