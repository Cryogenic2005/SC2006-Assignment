const mongoose = require('mongoose');

const RewardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true,
  },
  rewardType: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  redeemed: {
    type: Boolean,
    default: false,
  },
  expiryDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.Reward || mongoose.model('Reward', RewardSchema);
