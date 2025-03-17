const mongoose = require('mongoose');

const HawkerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    description: {
      type: String,
      trim: true,
    },
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    imageUrl: {
      type: String,
    },
    stalls: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Stall',
      },
    ],
    currentCrowdLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Low',
    },
    lastCrowdUpdate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for geospatial queries
HawkerSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Hawker', HawkerSchema);