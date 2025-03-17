const mongoose = require('mongoose');

const QueueSchema = new mongoose.Schema({
  stall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'closed'],
    default: 'active'
  },
  currentNumber: {
    type: Number,
    default: 0
  },
  lastNumber: {
    type: Number,
    default: 0
  },
  averageWaitTime: {
    type: Number, // in minutes
    default: 10
  },
  active: {
    type: Boolean,
    default: true
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Queue', QueueSchema);