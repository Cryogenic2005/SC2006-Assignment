// models/Loyalty.js
const mongoose = require('mongoose');

const LoyaltySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  stall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true
  },
  points: {
    type: Number,
    default: 0
  },
  visits: {
    type: Number,
    default: 0
  },
  tier: {
    type: String,
    enum: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    default: 'Bronze'
  },
  lastVisit: {
    type: Date,
    default: Date.now
  }
});

// Compound index for quick lookups
LoyaltySchema.index({ user: 1, stall: 1 }, { unique: true });

module.exports = mongoose.model('Loyalty', LoyaltySchema);