const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
require('dotenv').config();

async function checkEventStatus() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ Connected to MongoDB');

    const events = await Event.find({ status: 'published' })
      .select('title currentRegistrations maxRegistrations registrationDeadline')
      .sort({ title: 1 })
      .lean();

    console.log(`\n📊 Total Events: ${events.length}\n`);
    console.log('=' .repeat(100));

    let openCount = 0;
    let fullCount = 0;
    let closedCount = 0;

    events.forEach((event, index) => {
      const now = new Date();
      const hasSpace = !event.maxRegistrations || event.currentRegistrations < event.maxRegistrations;
      const deadlineOpen = !event.registrationDeadline || new Date(event.registrationDeadline) > now;
      const isOpen = hasSpace && deadlineOpen;

      let status = 'OPEN';
      if (event.maxRegistrations && event.currentRegistrations >= event.maxRegistrations) {
        status = 'FULL';
        fullCount++;
      } else if (event.registrationDeadline && new Date(event.registrationDeadline) < now) {
        status = 'CLOSED';
        closedCount++;
      } else {
        openCount++;
      }

      console.log(`${index + 1}. ${event.title}`);
      console.log(`   Status: ${status}`);
      console.log(`   Registrations: ${event.currentRegistrations} / ${event.maxRegistrations || '∞'}`);
      console.log(`   Deadline: ${event.registrationDeadline ? new Date(event.registrationDeadline).toLocaleDateString('en-IN') : 'None'}`);
      console.log(`   Has Space: ${hasSpace}`);
      console.log(`   Deadline Open: ${deadlineOpen}`);
      console.log('-'.repeat(100));
    });

    console.log(`\n📈 Summary:`);
    console.log(`   🟢 OPEN: ${openCount}`);
    console.log(`   🔴 FULL: ${fullCount}`);
    console.log(`   🟡 CLOSED: ${closedCount}`);

    await mongoose.disconnect();
    console.log('\n✓ Disconnected from MongoDB');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkEventStatus();
