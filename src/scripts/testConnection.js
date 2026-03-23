require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
const Registration = require('../modules/registrations/registration.model');

/**
 * Test database connection and show all data
 */
async function testConnection() {
  try {
    console.log('🔍 Testing Database Connection...\n');
    
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found in .env file');
      process.exit(1);
    }
    
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✓ Connected successfully!\n');

    // Check Events
    console.log('📅 EVENTS:');
    const events = await Event.find({}).select('title status featured day category createdAt').sort({ createdAt: -1 });
    console.log(`Total: ${events.length}\n`);
    
    if (events.length === 0) {
      console.log('❌ No events found in database!\n');
    } else {
      events.forEach((event, i) => {
        console.log(`${i + 1}. ${event.title}`);
        console.log(`   Status: ${event.status}`);
        console.log(`   Day: ${event.day || 'N/A'}`);
        console.log(`   Category: ${event.category || 'N/A'}`);
        console.log(`   Created: ${new Date(event.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // Check Registrations
    console.log('👥 REGISTRATIONS:');
    const registrations = await Registration.find({}).select('fullName eventTitle registrationStatus paymentStatus createdAt').sort({ createdAt: -1 });
    console.log(`Total: ${registrations.length}\n`);
    
    if (registrations.length === 0) {
      console.log('❌ No registrations found in database!\n');
    } else {
      registrations.forEach((reg, i) => {
        console.log(`${i + 1}. ${reg.fullName}`);
        console.log(`   Event: ${reg.eventTitle || 'N/A'}`);
        console.log(`   Status: ${reg.registrationStatus}`);
        console.log(`   Payment: ${reg.paymentStatus}`);
        console.log(`   Created: ${new Date(reg.createdAt).toLocaleString()}`);
        console.log('');
      });
    }

    // Summary
    console.log('📊 SUMMARY:');
    console.log(`   Events: ${events.length}`);
    console.log(`   Published Events: ${events.filter(e => e.status === 'published').length}`);
    console.log(`   Draft Events: ${events.filter(e => e.status === 'draft').length}`);
    console.log(`   Registrations: ${registrations.length}`);
    console.log(`   Approved: ${registrations.filter(r => r.registrationStatus === 'approved').length}`);
    console.log(`   Pending: ${registrations.filter(r => r.registrationStatus === 'pending').length}`);
    console.log('');

    await mongoose.connection.close();
    console.log('✓ Test completed!\n');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
