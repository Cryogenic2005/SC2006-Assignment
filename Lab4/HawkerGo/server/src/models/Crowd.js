// models/Crowd.js
const mongoose = require('mongoose');

const CrowdSchema = new mongoose.Schema({
  hawker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hawker',
    required: true
  },
  level: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    required: true
  },
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  validated: {
    type: Boolean,
    default: false
  },
  validationCount: {
    type: Number,
    default: 0
  }
});

// Index to ensure we can efficiently query for recent crowd levels
CrowdSchema.index({ hawker: 1, timestamp: -1 });

module.exports = mongoose.model('Crowd', CrowdSchema);