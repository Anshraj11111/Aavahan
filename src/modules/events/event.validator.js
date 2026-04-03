'use strict';

const { z } = require('zod');
const { EVENT_DAYS, EVENT_CATEGORIES } = require('../../constants/events');
const { EVENT_STATUS, PARTICIPATION_TYPE } = require('../../constants/statuses');

const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200).trim().optional().default(''),
  category: z.enum(Object.values(EVENT_CATEGORIES), { errorMap: () => ({ message: 'Invalid category' }) }).optional().default('technical'),
  department: z.string().trim().optional().default(''),
  day: z.enum(Object.values(EVENT_DAYS), { errorMap: () => ({ message: 'Invalid day' }) }).optional().default('Day 1'),
  date: z.string().optional().nullable().or(z.literal('')).default(''),
  startTime: z.string().trim().optional().default(''),
  endTime: z.string().trim().optional().default(''),
  venue: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().max(500).optional().default(''),
  fullDescription: z.string().trim().optional().default(''),
  rules: z.array(z.string().trim()).optional().default([]),
  eligibility: z.string().trim().optional().default(''),
  participationType: z.enum(Object.values(PARTICIPATION_TYPE), {
    errorMap: () => ({ message: 'participationType must be solo or team' }),
  }).optional().default('solo'),
  minTeamSize: z.union([z.number().int().min(1), z.string()]).optional().default(1),
  maxTeamSize: z.union([z.number().int().min(1), z.string()]).optional().default(1),
  entryFee: z.union([z.number().min(0), z.string()]).optional().default(0),
  prizeDetails: z.string().trim().optional().default(''),
  coordinators: z.array(z.object({
    name: z.string().trim().optional().default(''),
    phone: z.string().trim().optional().default(''),
    email: z.union([z.string().email(), z.literal('')]).optional().default('')
  })).optional().default([]),
  coordinatorName: z.string().trim().optional().default(''),
  coordinatorPhone: z.string().trim().optional().default(''),
  coordinatorEmail: z.union([z.string().email(), z.literal('')]).optional().default(''),
  registrationDeadline: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(''))
    .default(''),
  maxRegistrations: z.union([
    z.number().int().min(1),
    z.string(),
    z.null()
  ]).optional().nullable().default(null),
  status: z.enum(Object.values(EVENT_STATUS)).optional().default(EVENT_STATUS.DRAFT),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().toLowerCase()).optional().default([]),
  posterImage: z.string().trim().optional().default(''),
  bannerImage: z.string().trim().optional().default(''),
});

const updateEventSchema = createEventSchema.partial();

module.exports = { createEventSchema, updateEventSchema };
