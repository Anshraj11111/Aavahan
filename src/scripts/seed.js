'use strict';

/**
 * Seed script for Tech Fest 2026.
 * Idempotent: clears existing seed data before inserting.
 * Run: node src/scripts/seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const env = require('../config/env');
const Admin = require('../modules/admin/admin.model');
const Event = require('../modules/events/event.model');
const Coordinator = require('../modules/coordinators/coordinator.model');
const PaymentConfig = require('../modules/payments/payment.model');
const Announcement = require('../modules/announcements/announcement.model');
const generateSlug = require('../utils/generateSlug');

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('[Seed] Connected to MongoDB');

  // ─── Clear existing seed data ──────────────────────────────────────────────
  const seedEmails = [
    'superadmin@techfest2026.com', 'cultural@techfest2026.com',
    'technical@techfest2026.com', 'coordinator@techfest2026.com',
  ];
  const seedSlugs = [
    'battle-of-bands', 'solo-dance', 'group-dance', 'nukkad-natak', 'singing-competition',
    'hackathon-2026', 'paper-presentation', 'robo-race', 'code-sprint', 'ui-ux-design-challenge',
    'tech-quiz', 'gaming-tournament', 'project-exhibition', 'photography-contest', 'debate-competition',
  ];
  await Promise.all([
    Admin.deleteMany({ email: { $in: seedEmails } }),
    Event.deleteMany({ slug: { $in: seedSlugs } }),
    Coordinator.deleteMany({ email: { $in: ['rahul@techfest2026.com', 'priya@techfest2026.com', 'amit@techfest2026.com'] } }),
    PaymentConfig.deleteMany({ upiId: 'techfest2026@upi' }),
    Announcement.deleteMany({ title: { $in: ['Registrations Open!', 'Payment Instructions', 'Last Date Reminder'] } }),
  ]);
  console.log('[Seed] Cleared existing seed data');

  // ─── Admins ────────────────────────────────────────────────────────────────
  const adminDocs = [
    { name: 'Super Admin', email: 'superadmin@techfest2026.com', password: 'Admin@2026', role: 'super_admin', isActive: true },
    { name: 'Cultural Admin', email: 'cultural@techfest2026.com', password: 'Admin@2026', role: 'cultural_admin', isActive: true },
    { name: 'Technical Admin', email: 'technical@techfest2026.com', password: 'Admin@2026', role: 'technical_admin', isActive: true },
    { name: 'Coordinator Admin', email: 'coordinator@techfest2026.com', password: 'Admin@2026', role: 'coordinator', isActive: true },
  ];
  // Use save() so the pre-save bcrypt hook fires
  const admins = await Promise.all(adminDocs.map((d) => new Admin(d).save()));
  console.log(`[Seed] Created ${admins.length} admins`);

  const superAdmin = admins[0];

  // ─── Events ────────────────────────────────────────────────────────────────
  const day1 = new Date('2026-04-01'); // Ethnic Day
  const day2 = new Date('2026-04-02'); // Technical Day 1
  const day3 = new Date('2026-04-03'); // Technical Day 2
  const deadline = new Date('2026-03-25');

  const eventDefs = [
    // Day 1 - Ethnic Day (Cultural Events)
    { 
      title: 'Traditional Dress Show', 
      category: 'cultural', 
      day: 'Day 1', 
      date: day1, 
      participationType: 'solo', 
      entryFee: 100, 
      maxRegistrations: 50,
      startTime: '10:00 AM',
      endTime: '12:00 PM',
      shortDescription: 'Showcase traditional attire from different cultures and regions of India',
      longDescription: 'Celebrate Unity in Diversity by wearing and presenting traditional dress from your culture. Participants will walk the ramp and explain the significance of their attire.'
    },
    { 
      title: 'Folk Dance Performances', 
      category: 'cultural', 
      day: 'Day 1', 
      date: day1, 
      participationType: 'team', 
      minTeamSize: 5, 
      maxTeamSize: 15, 
      entryFee: 300, 
      maxRegistrations: 20,
      startTime: '12:30 PM',
      endTime: '02:30 PM',
      shortDescription: 'Perform traditional folk dances from various Indian states',
      longDescription: 'Teams will perform authentic folk dances representing different regions of India. Costumes, music, and choreography should reflect traditional culture.'
    },
    { 
      title: 'Ethnic Fashion Walk', 
      category: 'cultural', 
      day: 'Day 1', 
      date: day1, 
      participationType: 'solo', 
      entryFee: 150, 
      maxRegistrations: 40,
      startTime: '03:00 PM',
      endTime: '04:30 PM',
      shortDescription: 'Fashion show featuring ethnic and traditional wear',
      longDescription: 'A glamorous fashion walk showcasing the beauty of ethnic Indian fashion. Participants will model traditional outfits with modern styling.'
    },
    { 
      title: 'Mr. & Ms. Ethnic Shri Ram', 
      category: 'cultural', 
      day: 'Day 1', 
      date: day1, 
      participationType: 'solo', 
      entryFee: 200, 
      maxRegistrations: 30,
      startTime: '05:00 PM',
      endTime: '07:00 PM',
      shortDescription: 'Pageant celebrating cultural diversity and talent',
      longDescription: 'A prestigious competition to crown Mr. & Ms. Ethnic Shri Ram. Rounds include traditional wear, talent showcase, and Q&A.'
    },
    { 
      title: 'Cultural Night', 
      category: 'cultural', 
      day: 'Day 1', 
      date: day1, 
      participationType: 'team', 
      minTeamSize: 1, 
      maxTeamSize: 20, 
      entryFee: 0, 
      maxRegistrations: 100,
      startTime: '07:30 PM',
      endTime: '10:00 PM',
      shortDescription: 'Evening of cultural performances, music, and dance',
      longDescription: 'A grand cultural night featuring performances from students across all institutes. Open stage for all cultural activities.'
    },
    
    // Day 2 - Technical Day 1
    { 
      title: 'Hackathon 2026', 
      category: 'technical', 
      day: 'Day 2', 
      date: day2, 
      participationType: 'team', 
      minTeamSize: 2, 
      maxTeamSize: 4, 
      entryFee: 400, 
      maxRegistrations: 30,
      startTime: '09:00 AM',
      endTime: '09:00 PM',
      shortDescription: '24-hour coding marathon to build innovative solutions',
      longDescription: '24-hour hackathon where teams will develop innovative tech solutions. Themes include AI, IoT, Web Development, and Mobile Apps.'
    },
    { 
      title: 'Coding Competition', 
      category: 'technical', 
      day: 'Day 2', 
      date: day2, 
      participationType: 'solo', 
      entryFee: 200, 
      maxRegistrations: 80,
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      shortDescription: 'Competitive programming challenge',
      longDescription: 'Test your coding skills in this competitive programming contest. Solve algorithmic problems within time limits.'
    },
    { 
      title: 'AI Workshop', 
      category: 'technical', 
      day: 'Day 2', 
      date: day2, 
      participationType: 'solo', 
      entryFee: 150, 
      maxRegistrations: 60,
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      shortDescription: 'Hands-on workshop on Artificial Intelligence and Machine Learning',
      longDescription: 'Learn the fundamentals of AI and ML through practical examples. Build your first ML model in this interactive workshop.'
    },
    { 
      title: 'Robotics Challenge', 
      category: 'technical', 
      day: 'Day 2', 
      date: day2, 
      participationType: 'team', 
      minTeamSize: 2, 
      maxTeamSize: 4, 
      entryFee: 500, 
      maxRegistrations: 20,
      startTime: '10:00 AM',
      endTime: '04:00 PM',
      shortDescription: 'Build and compete with robots',
      longDescription: 'Design, build, and program robots to complete challenging tasks. Categories include line following, maze solving, and robo soccer.'
    },
    { 
      title: 'Technical Workshops', 
      category: 'technical', 
      day: 'Day 2', 
      date: day2, 
      participationType: 'solo', 
      entryFee: 100, 
      maxRegistrations: 100,
      startTime: '11:00 AM',
      endTime: '05:00 PM',
      shortDescription: 'Various technical workshops by industry experts',
      longDescription: 'Multiple workshops covering Web Development, Cloud Computing, Cybersecurity, and more. Learn from industry professionals.'
    },
    
    // Day 3 - Technical Day 2
    { 
      title: 'Startup Pitch', 
      category: 'technical', 
      day: 'Day 3', 
      date: day3, 
      participationType: 'team', 
      minTeamSize: 1, 
      maxTeamSize: 5, 
      entryFee: 300, 
      maxRegistrations: 25,
      startTime: '10:00 AM',
      endTime: '01:00 PM',
      shortDescription: 'Present your startup ideas to investors and judges',
      longDescription: 'Pitch your innovative startup ideas to a panel of investors and industry experts. Best ideas win funding and mentorship.'
    },
    { 
      title: 'Innovation Lab', 
      category: 'technical', 
      day: 'Day 3', 
      date: day3, 
      participationType: 'team', 
      minTeamSize: 2, 
      maxTeamSize: 5, 
      entryFee: 250, 
      maxRegistrations: 30,
      startTime: '10:00 AM',
      endTime: '03:00 PM',
      shortDescription: 'Showcase innovative tech projects and prototypes',
      longDescription: 'Display your innovative projects, prototypes, and research work. Interact with visitors and judges to explain your innovation.'
    },
    { 
      title: 'Project Presentations', 
      category: 'technical', 
      day: 'Day 3', 
      date: day3, 
      participationType: 'team', 
      minTeamSize: 2, 
      maxTeamSize: 4, 
      entryFee: 200, 
      maxRegistrations: 40,
      startTime: '02:00 PM',
      endTime: '05:00 PM',
      shortDescription: 'Present technical projects and research papers',
      longDescription: 'Present your technical projects, research papers, and case studies. Categories include all engineering and technology domains.'
    },
    { 
      title: 'Live Musical Concert - ASTRA 13', 
      category: 'cultural', 
      day: 'Day 3', 
      date: day3, 
      participationType: 'solo', 
      entryFee: 0, 
      maxRegistrations: 1000,
      startTime: '06:00 PM',
      endTime: '09:00 PM',
      shortDescription: 'Live performance by ASTRA 13 band',
      longDescription: 'Experience an electrifying live musical concert by the renowned band ASTRA 13. An evening of music, energy, and entertainment!'
    },
    { 
      title: 'Closing Ceremony & Prize Distribution', 
      category: 'cultural', 
      day: 'Day 3', 
      date: day3, 
      participationType: 'solo', 
      entryFee: 0, 
      maxRegistrations: 1000,
      startTime: '09:30 PM',
      endTime: '11:00 PM',
      shortDescription: 'Grand closing ceremony with prize distribution',
      longDescription: 'The grand finale of Tech Fest 2026 with prize distribution, awards ceremony, and closing performances.'
    },
  ];

  const events = await Event.insertMany(
    eventDefs.map((e) => ({
      ...e,
      slug: generateSlug(e.title),
      status: 'published',
      featured: [
        'Hackathon 2026', 
        'Mr. & Ms. Ethnic Shri Ram', 
        'Robotics Challenge', 
        'Live Musical Concert - ASTRA 13',
        'Startup Pitch',
        'Cultural Night'
      ].includes(e.title),
      registrationDeadline: deadline,
      venue: e.venue || 'Main Campus, Shri Ram Group, Jabalpur',
      createdBy: superAdmin._id,
      isSeed: true,
    }))
  );
  console.log(`[Seed] Created ${events.length} events`);

  // ─── Coordinators ──────────────────────────────────────────────────────────
  const coordinators = await Coordinator.insertMany([
    { name: 'Rahul Sharma', role: 'Cultural Head', department: 'Arts', day: 'Day 1', phone: '9876543210', email: 'rahul@techfest2026.com', active: true },
    { name: 'Priya Verma', role: 'Technical Head', department: 'CS', day: 'Day 2', phone: '9876543211', email: 'priya@techfest2026.com', active: true },
    { name: 'Amit Patel', role: 'General Coordinator', department: 'Mechanical', day: 'All', phone: '9876543212', email: 'amit@techfest2026.com', active: true },
  ]);
  console.log(`[Seed] Created ${coordinators.length} coordinators`);

  // ─── Payment Config ────────────────────────────────────────────────────────
  await PaymentConfig.create({
    upiId: 'techfest2026@upi',
    payeeName: 'Shri Ram Group Tech Fest',
    note: 'Pay registration fee via UPI. Use your Registration ID as payment note.',
    active: true,
    isSeed: true,
  });
  console.log('[Seed] Created payment config');

  // ─── Announcements ─────────────────────────────────────────────────────────
  const now = new Date();
  const endOfFest = new Date('2026-04-18');
  await Announcement.insertMany([
    { title: 'Registrations Open!', message: 'Registrations for Tech Fest 2026 are now open. Register early to secure your spot!', type: 'info', startDate: now, endDate: endOfFest, active: true, createdBy: superAdmin._id },
    { title: 'Payment Instructions', message: 'Pay via UPI to techfest2026@upi. Upload screenshot during registration. Approval within 24-48 hours.', type: 'update', startDate: now, endDate: endOfFest, active: true, createdBy: superAdmin._id },
    { title: 'Last Date Reminder', message: 'Last date to register is April 10, 2026. Do not miss out!', type: 'urgent', startDate: now, endDate: new Date('2026-04-10'), active: true, createdBy: superAdmin._id },
  ]);
  console.log('[Seed] Created 3 announcements');

  console.log('\n[Seed] ✅ Seeding complete!');
  console.log('Admin credentials (all use password: Admin@2026):');
  admins.forEach((a) => console.log(`  ${a.role}: ${a.email}`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('[Seed] Error:', err.message);
  process.exit(1);
});


