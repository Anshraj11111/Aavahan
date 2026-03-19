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
  const festStart = new Date('2026-04-15');
  const day2 = new Date('2026-04-16');
  const day3 = new Date('2026-04-17');
  const deadline = new Date('2026-04-10');

  const eventDefs = [
    // Day 1 - Cultural
    { title: 'Battle of Bands', category: 'cultural', day: 'Day 1', date: festStart, participationType: 'team', minTeamSize: 3, maxTeamSize: 8, entryFee: 500, maxRegistrations: 20 },
    { title: 'Solo Dance', category: 'cultural', day: 'Day 1', date: festStart, participationType: 'solo', entryFee: 200, maxRegistrations: 50 },
    { title: 'Group Dance', category: 'cultural', day: 'Day 1', date: festStart, participationType: 'team', minTeamSize: 5, maxTeamSize: 15, entryFee: 300, maxRegistrations: 15 },
    { title: 'Nukkad Natak', category: 'cultural', day: 'Day 1', date: festStart, participationType: 'team', minTeamSize: 5, maxTeamSize: 12, entryFee: 400, maxRegistrations: 10 },
    { title: 'Singing Competition', category: 'cultural', day: 'Day 1', date: festStart, participationType: 'solo', entryFee: 150, maxRegistrations: 40 },
    // Day 2 - Technical
    { title: 'Hackathon 2026', category: 'technical', day: 'Day 2', date: day2, participationType: 'team', minTeamSize: 2, maxTeamSize: 4, entryFee: 300, maxRegistrations: 30 },
    { title: 'Paper Presentation', category: 'presentation', day: 'Day 2', date: day2, participationType: 'solo', entryFee: 100, maxRegistrations: 60 },
    { title: 'Robo Race', category: 'robotics', day: 'Day 2', date: day2, participationType: 'team', minTeamSize: 2, maxTeamSize: 4, entryFee: 500, maxRegistrations: 20 },
    { title: 'Code Sprint', category: 'coding', day: 'Day 2', date: day2, participationType: 'solo', entryFee: 200, maxRegistrations: 80 },
    { title: 'UI/UX Design Challenge', category: 'design', day: 'Day 2', date: day2, participationType: 'solo', entryFee: 150, maxRegistrations: 40 },
    // Day 3 - Mixed
    { title: 'Tech Quiz', category: 'quiz', day: 'Day 3', date: day3, participationType: 'team', minTeamSize: 2, maxTeamSize: 3, entryFee: 100, maxRegistrations: 50 },
    { title: 'Gaming Tournament', category: 'gaming', day: 'Day 3', date: day3, participationType: 'solo', entryFee: 200, maxRegistrations: 64 },
    { title: 'Project Exhibition', category: 'exhibition', day: 'Day 3', date: day3, participationType: 'team', minTeamSize: 2, maxTeamSize: 5, entryFee: 0, maxRegistrations: 30 },
    { title: 'Photography Contest', category: 'other', day: 'Day 3', date: day3, participationType: 'solo', entryFee: 100, maxRegistrations: 50 },
    { title: 'Debate Competition', category: 'other', day: 'Day 3', date: day3, participationType: 'solo', entryFee: 100, maxRegistrations: 40 },
  ];

  const events = await Event.insertMany(
    eventDefs.map((e) => ({
      ...e,
      slug: generateSlug(e.title),
      status: 'published',
      featured: ['Hackathon 2026', 'Battle of Bands', 'Robo Race'].includes(e.title),
      registrationDeadline: deadline,
      venue: 'Main Auditorium, Shri Ram Group Campus',
      shortDescription: `Join us for ${e.title} at ${env.FEST_NAME}!`,
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
