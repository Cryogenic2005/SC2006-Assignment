const mongoose = require('mongoose');

const PreferenceSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cuisines: [{
    type: String
  }],
  dietaryRestrictions: [{
    type: String,
    enum: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free', 'Nut-free', 'Dairy-free', 'None']
  }],
  spiceLevel: {
    type: String,
    enum: ['Mild', 'Medium', 'Spicy', 'Very Spicy', 'No Preference'],
    default: 'No Preference'
  },
  priceRange: {
    min: {
      type: Number,
      default: 0
    },
    max: {
      type: Number,
      default: 50
    }
  },
  favoriteHawkers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hawker'
  }],
  favoriteStalls: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stall'
  }]
});

module.exports = mongoose.model('Preference', PreferenceSchema);