'use strict';

const eventService = require('./event.service');
const asyncHandler = require('../../utils/asyncHandler');
const { successResponse, paginatedResponse } = require('../../utils/response');

const createEvent = asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.admin, req);
  return successResponse(res, { event }, 'Event created successfully', 201);
});

const getEvents = asyncHandler(async (req, res) => {
  const { events, pagination } = await eventService.getEvents(req.query);
  return paginatedResponse(res, events, pagination, 'Events fetched');
});

const getEventById = asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  return successResponse(res, { event }, 'Event fetched');
});

const updateEvent = asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body, req.admin, req);
  return successResponse(res, { event }, 'Event updated successfully');
});

const deleteEvent = asyncHandler(async (req, res) => {
  await eventService.deleteEvent(req.params.id, req.admin, req);
  return successResponse(res, null, 'Event deleted successfully');
});

const uploadEventImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    const err = new Error('No image file provided');
    err.statusCode = 400;
    throw err;
  }
  const imageType = req.query.type === 'banner' ? 'banner' : 'poster';
  const event = await eventService.uploadEventImage(req.params.id, req.file.buffer, imageType, req.admin);
  return successResponse(res, { event }, 'Image uploaded successfully');
});

module.exports = { createEvent, getEvents, getEventById, updateEvent, deleteEvent, uploadEventImage };
