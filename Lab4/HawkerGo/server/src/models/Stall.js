const mongoose = require('mongoose');

const StallSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    hawker: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hawker',
      required: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    categories: [
      {
        type: String,
        trim: true,
      },
    ],
    menuItems: [
      {
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
        imageUrl: {
          type: String,
        },
        isAvailable: {
          type: Boolean,
          default: true,
        },
        isVegan: {
          type: Boolean,
          default: false,
        },
        isHalal: {
          type: Boolean,
          default: false,
        },
        allergies: [String],
        spiceLevel: {
          type: Number, // 0-5
          default: 0,
        },
      },
    ],
    operatingHours: {
      monday: { open: String, close: String },
      tuesday: { open: String, close: String },
      wednesday: { open: String, close: String },
      thursday: { open: String, close: String },
      friday: { open: String, close: String },
      saturday: { open: String, close: String },
      sunday: { open: String, close: String },
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      }
    ],
    stallNumber: {
      type: String,
    },
    imageUrl: {
      type: String,
    },
    isOpen: {
      type: Boolean,
      default: true,
    },
    minPrice: {
      type: Number,
      default: 0,
    },
    maxPrice: {
      type: Number,
      default: 0,
    },
    cuisine: {
      type: String,
      trim: true,
    },
    isHalal: {
      type: Boolean,
      default: false,
    },
    isVegetarian: {
      type: Boolean,
      default: false,
    },
    isVegan: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Stall', StallSchema);