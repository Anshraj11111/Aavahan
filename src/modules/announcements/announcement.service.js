'use strict';

const Announcement = require('./announcement.model');
const createAuditLog = require('../../utils/auditLog');
const { cacheDel } = require('../../services/cache');
const { CACHE_KEYS } = require('../../constants/events');

async function listAnnouncements({ query = {} } = {}) {
  const { active, page = 1, limit = 20 } = query;
  const filter = {};
  if (active !== undefined) filter.active = active === 'true' || active === true;
  const skip = (Number(page) - 1) * Number(limit);
  const [announcements, total] = await Promise.all([
    Announcement.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Announcement.countDocuments(filter),
  ]);
  return { announcements, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
}

async function createAnnouncement({ body, admin, req }) {
  const { title, message, type, startDate, endDate } = body;
  const announcement = await Announcement.create({ title, message, type, startDate, endDate, active: true, createdBy: admin._id });
  await cacheDel(CACHE_KEYS.ANNOUNCEMENTS);
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'CREATE_ANNOUNCEMENT', targetModel: 'Announcement', targetId: announcement._id.toString(), changes: { after: { title } }, req });
  return announcement;
}

async function updateAnnouncement({ id, body, admin, req }) {
  const announcement = await Announcement.findById(id);
  if (!announcement) { const err = new Error('Announcement not found'); err.statusCode = 404; throw err; }
  const before = { title: announcement.title, active: announcement.active };
  Object.assign(announcement, body);
  await announcement.save();
  await cacheDel(CACHE_KEYS.ANNOUNCEMENTS);
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'UPDATE_ANNOUNCEMENT', targetModel: 'Announcement', targetId: id, changes: { before, after: body }, req });
  return announcement;
}

async function deleteAnnouncement({ id, admin, req }) {
  const announcement = await Announcement.findByIdAndDelete(id);
  if (!announcement) { const err = new Error('Announcement not found'); err.statusCode = 404; throw err; }
  await cacheDel(CACHE_KEYS.ANNOUNCEMENTS);
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'DELETE_ANNOUNCEMENT', targetModel: 'Announcement', targetId: id, changes: {}, req });
}

module.exports = { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement };
