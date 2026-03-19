'use strict';

const Coordinator = require('./coordinator.model');
const createAuditLog = require('../../utils/auditLog');

async function listCoordinators({ query = {} } = {}) {
  const { day, active, page = 1, limit = 50 } = query;
  const filter = {};
  if (day) filter.day = day;
  if (active !== undefined) filter.active = active === 'true' || active === true;
  const skip = (Number(page) - 1) * Number(limit);
  const [coordinators, total] = await Promise.all([
    Coordinator.find(filter).populate('assignedEvents', 'title day').sort({ name: 1 }).skip(skip).limit(Number(limit)).lean(),
    Coordinator.countDocuments(filter),
  ]);
  return { coordinators, pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) } };
}

async function createCoordinator({ body, admin, req }) {
  const coordinator = await Coordinator.create({ ...body, active: true });
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'CREATE_COORDINATOR', targetModel: 'Coordinator', targetId: coordinator._id.toString(), changes: { after: body }, req });
  return coordinator;
}

async function updateCoordinator({ id, body, admin, req }) {
  const coordinator = await Coordinator.findById(id);
  if (!coordinator) { const err = new Error('Coordinator not found'); err.statusCode = 404; throw err; }
  const before = { name: coordinator.name, role: coordinator.role };
  Object.assign(coordinator, body);
  await coordinator.save();
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'UPDATE_COORDINATOR', targetModel: 'Coordinator', targetId: id, changes: { before, after: body }, req });
  return coordinator;
}

async function assignEvents({ id, eventIds, admin, req }) {
  const coordinator = await Coordinator.findByIdAndUpdate(id, { assignedEvents: eventIds }, { new: true }).lean();
  if (!coordinator) { const err = new Error('Coordinator not found'); err.statusCode = 404; throw err; }
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'ASSIGN_EVENTS_COORDINATOR', targetModel: 'Coordinator', targetId: id, changes: { after: { eventIds } }, req });
  return coordinator;
}

async function deactivateCoordinator({ id, admin, req }) {
  const coordinator = await Coordinator.findByIdAndUpdate(id, { active: false }, { new: true }).lean();
  if (!coordinator) { const err = new Error('Coordinator not found'); err.statusCode = 404; throw err; }
  await createAuditLog({ adminId: admin._id, adminEmail: admin.email, action: 'DEACTIVATE_COORDINATOR', targetModel: 'Coordinator', targetId: id, changes: { after: { active: false } }, req });
  return coordinator;
}

module.exports = { listCoordinators, createCoordinator, updateCoordinator, assignEvents, deactivateCoordinator };
