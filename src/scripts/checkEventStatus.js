require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');

/**
 * Script to check the status of all events in the database
 */
async function checkEventStatus() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('Error: MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB\n');

    // Get all events
    const allEvents = await Event.find({}).select('title status day category');
    console.log(`Total events in database: ${allEvents.length}\n`);

    if (allEvents.length === 0) {
      console.log('No events found in database');
    } else {
      console.log('Events:');
      allEvents.forEach((event, index) => {
        console.log(`${index + 1}. ${event.title}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Day: ${event.day}`);
        console.log(`   Category: ${event.category}\n`);
      });
    }

    // Count by status
    const statusCounts = await Event.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    console.log('Events by status:');
    statusCounts.forEach(item => {
      console.log(`  ${item._id}: ${item.count}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Script completed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkEventStatus();
