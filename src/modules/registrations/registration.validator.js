'use strict';

const { z } = require('zod');

const teamMemberSchema = z.object({
  name: z.string().min(1, 'Team member name is required').trim(),
  email: z.string().email().optional().or(z.literal('')).default(''),
  phone: z.string().trim().optional().default(''),
});

const registrationSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(150).trim(),
    email: z.string().email('Invalid email').toLowerCase().trim(),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .max(15)
      .regex(/^[0-9+\-\s]+$/, 'Invalid phone number')
      .trim(),
    instituteName: z.string().min(2, 'Institute name is required').max(200).trim(),
    department: z.string().trim().optional().default(''),
    yearOrSemester: z.string().trim().optional().default(''),
    city: z.string().trim().optional().default(''),
    gender: z
      .enum(['male', 'female', 'other', 'prefer_not_to_say', ''])
      .optional()
      .default(''),
    eventId: z.string().min(1, 'Event ID is required'),
    transactionId: z.string().min(1, 'Transaction ID is required').trim(),
    teamName: z.string().trim().optional().default(''),
    teamMembers: z.array(teamMemberSchema).optional().default([]),
  });

module.exports = { registrationSchema };
