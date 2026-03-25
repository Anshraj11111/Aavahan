const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/techfest').then(async () => {
  const Event = require('./src/modules/events/event.model');
  const events = await Event.find({});
  
  console.log('Total events:', events.length);
  console.log('\nEvent Details:');
  
  events.forEach((e, index) => {
    console.log(`\n${index + 1}. ${e.title}`);
    console.log(`   Registration Deadline: ${e.registrationDeadline || 'NULL/EMPTY'}`);
    console.log(`   Max Registrations: ${e.maxRegistrations || 'NULL/UNLIMITED'}`);
    console.log(`   Current Registrations: ${e.currentRegistrations || 0}`);
    console.log(`   Status: ${e.status}`);
  });
  
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
