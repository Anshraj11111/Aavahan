require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('../modules/events/event.model');
const Registration = require('../modules/registrations/registration.model');

/**
 * Restore test data if database is empty
 */
async function restoreTestData() {
  try {
    console.log('🔧 Restoring Test Data...\n');
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ MONGODB_URI not found');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✓ Connected to MongoDB\n');

    // Check existing data
    const eventCount = await Event.countDocuments();
    const regCount = await Registration.countDocuments();
    
    console.log(`Current data: ${eventCount} events, ${regCount} registrations\n`);

    if (eventCount > 0) {
      console.log('✓ Events already exist. No need to restore.');
      console.log('   If events are not showing, run: node src/scripts/fixEventVisibility.js\n');
      await mongoose.connection.close();
      return;
    }

    console.log('📝 Creating test events...\n');

    // Create test events
    const testEvents = [
      {
        title: 'AI & Machine Learning Hackathon',
        shortDescription: 'Build innovative AI solutions',
        fullDescription: 'A 24-hour hackathon focused on AI and ML projects',
        category: 'technical',
        department: 'Computer Science',
        day: 'Day 2',
        date: new Date('2026-04-02'),
        startTime: '9:00 AM',
        endTime: '6:00 PM',
        venue: 'Main Auditorium',
        participationType: 'team',
        minTeamSize: 2,
        maxTeamSize: 4,
        entryFee: 500,
        maxRegistrations: 50,
        prizeDetails: '1st: ₹50,000, 2nd: ₹30,000, 3rd: ₹20,000',
        coordinatorName: 'Dr. Sharma',
        coordinatorPhone: '9876543210',
        coordinatorEmail: 'sharma@srigroup.net',
        eligibility: 'Open to all engineering students',
        featured: true,
        status: 'published',
        rules: ['Team size: 2-4 members', 'Bring your own laptop', 'No plagiarism'],
        tags: ['AI', 'ML', 'Hackathon', 'Coding']
      },
      {
        title: 'Web Development Workshop',
        shortDescription: 'Learn modern web development',
        fullDescription: 'Hands-on workshop on React, Node.js, and MongoDB',
        category: 'technical',
        department: 'Information Technology',
        day: 'Day 1',
        date: new Date('2026-04-01'),
        startTime: '10:00 AM',
        endTime: '4:00 PM',
        venue: 'Lab 101',
        participationType: 'solo',
        minTeamSize: 1,
        maxTeamSize: 1,
        entryFee: 200,
        maxRegistrations: 100,
        prizeDetails: 'Certificate of completion',
        coordinatorName: 'Prof. Kumar',
        coordinatorPhone: '9876543211',
        coordinatorEmail: 'kumar@srigroup.net',
        eligibility: 'Basic programming knowledge required',
        featured: true,
        status: 'published',
        rules: ['Bring laptop', 'Basic HTML/CSS knowledge', 'Attend full session'],
        tags: ['Web Dev', 'React', 'Node.js', 'Workshop']
      },
      {
        title: 'Cultural Dance Competition',
        shortDescription: 'Showcase your dance talent',
        fullDescription: 'Solo and group dance performances',
        category: 'cultural',
        department: 'All Departments',
        day: 'Day 3',
        date: new Date('2026-04-03'),
        startTime: '5:00 PM',
        endTime: '9:00 PM',
        venue: 'Open Ground',
        participationType: 'team',
        minTeamSize: 1,
        maxTeamSize: 10,
        entryFee: 100,
        maxRegistrations: 30,
        prizeDetails: '1st: ₹25,000, 2nd: ₹15,000, 3rd: ₹10,000',
        coordinatorName: 'Ms. Verma',
        coordinatorPhone: '9876543212',
        coordinatorEmail: 'verma@srigroup.net',
        eligibility: 'Open to all',
        featured: false,
        status: 'published',
        rules: ['Performance time: 5-8 minutes', 'Original choreography', 'Appropriate costumes'],
        tags: ['Dance', 'Cultural', 'Performance']
      }
    ];

    const createdEvents = await Event.insertMany(testEvents);
    console.log(`✓ Created ${createdEvents.length} test events\n`);

    createdEvents.forEach((event, i) => {
      console.log(`${i + 1}. ${event.title}`);
      console.log(`   Status: ${event.status}`);
      console.log(`   Day: ${event.day}`);
      console.log('');
    });

    await mongoose.connection.close();
    console.log('✓ Test data restored successfully!\n');
    console.log('💡 Now refresh your admin panel and events page\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

restoreTestData();
