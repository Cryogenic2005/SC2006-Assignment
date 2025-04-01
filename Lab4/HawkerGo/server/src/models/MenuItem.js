const mongoose = require('mongoose');

const MenuItemSchema = new mongoose.Schema({
  stall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  price: {
    type: Number,
    required: true,
  },
  isSpicy: {
    type: Boolean,
    default: false,
  },
  isSignature: {
    type: Boolean,
    default: false,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  category: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.models.MenuItem || mongoose.model('MenuItem', MenuItemSchema);