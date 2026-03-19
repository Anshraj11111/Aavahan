'use strict';

const mongoose = require('mongoose');
const { COORDINATOR_DAYS } = require('../../constants/events');

const coordinatorSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 100 },
    role: { type: String, trim: true, default: '' },
    department: { type: String, trim: true, default: '' },
    day: {
      type: String,
      enum: Object.values(COORDINATOR_DAYS),
      default: COORDINATOR_DAYS.ALL,
    },
    phone: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    assignedEvents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Event' }],
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

coordinatorSchema.index({ day: 1 });
coordinatorSchema.index({ department: 1 });
coordinatorSchema.index({ active: 1 });
coordinatorSchema.index({ assignedEvents: 1 });

const Coordinator = mongoose.model('Coordinator', coordinatorSchema);
module.exports = Coordinator;
