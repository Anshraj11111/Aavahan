'use strict';

const { z } = require('zod');
const { EVENT_DAYS, EVENT_CATEGORIES } = require('../../constants/events');
const { EVENT_STATUS, PARTICIPATION_TYPE } = require('../../constants/statuses');

const createEventSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
  category: z.enum(Object.values(EVENT_CATEGORIES), { errorMap: () => ({ message: 'Invalid category' }) }),
  department: z.string().trim().optional().default(''),
  day: z.enum(Object.values(EVENT_DAYS), { errorMap: () => ({ message: 'Invalid day' }) }),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date' }),
  startTime: z.string().trim().optional().default(''),
  endTime: z.string().trim().optional().default(''),
  venue: z.string().trim().optional().default(''),
  shortDescription: z.string().trim().max(500).optional().default(''),
  fullDescription: z.string().trim().optional().default(''),
  rules: z.array(z.string().trim()).optional().default([]),
  eligibility: z.string().trim().optional().default(''),
  participationType: z.enum(Object.values(PARTICIPATION_TYPE), {
    errorMap: () => ({ message: 'participationType must be solo or team' }),
  }),
  minTeamSize: z.number().int().min(1).optional().default(1),
  maxTeamSize: z.number().int().min(1).optional().default(1),
  entryFee: z.number().min(0).optional().default(0),
  prizeDetails: z.string().trim().optional().default(''),
  coordinatorName: z.string().trim().optional().default(''),
  coordinatorPhone: z.string().trim().optional().default(''),
  coordinatorEmail: z.string().email().optional().or(z.literal('')).default(''),
  registrationDeadline: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid deadline date' })
    .optional()
    .nullable(),
  maxRegistrations: z.number().int().min(1).optional().nullable(),
  status: z.enum(Object.values(EVENT_STATUS)).optional().default(EVENT_STATUS.DRAFT),
  featured: z.boolean().optional().default(false),
  tags: z.array(z.string().trim().toLowerCase()).optional().default([]),
});

const updateEventSchema = createEventSchema.partial();

module.exports = { createEventSchema, updateEventSchema };
