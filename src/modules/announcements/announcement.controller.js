'use strict';

const asyncHandler = require('../../utils/asyncHandler');
const { successResponse } = require('../../utils/response');
const { listAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } = require('./announcement.service');

const list = asyncHandler(async (req, res) => {
  const data = await listAnnouncements({ query: req.query });
  successResponse(res, data, 'Announcements fetched');
});

const create = asyncHandler(async (req, res) => {
  const announcement = await createAnnouncement({ body: req.body, admin: req.admin, req });
  successResponse(res, { announcement }, 'Announcement created', 201);
});

const update = asyncHandler(async (req, res) => {
  const announcement = await updateAnnouncement({ id: req.params.id, body: req.body, admin: req.admin, req });
  successResponse(res, { announcement }, 'Announcement updated');
});

const remove = asyncHandler(async (req, res) => {
  await deleteAnnouncement({ id: req.params.id, admin: req.admin, req });
  successResponse(res, null, 'Announcement deleted');
});

module.exports = { list, create, update, remove };
