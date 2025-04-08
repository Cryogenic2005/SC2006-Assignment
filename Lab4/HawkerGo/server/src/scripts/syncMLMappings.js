const mongoose = require('mongoose');
const Hawker = require('../models/Hawker');
const MLService = require('../services/mlService');
require('dotenv').config();

/**
 * Script to synchronize hawker center data with ML model mappings
 */
async function syncMLMappings() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Fetch all hawker centers
    const hawkers = await Hawker.find({});
    console.log(`Found ${hawkers.length} hawker centers`);

    // Create mappings for ML model
    const mappings = {};
    hawkers.forEach(hawker => {
      // Map MongoDB _id to a consistent format for ML model
      // You would need to adjust this to match your actual data structure
      mappings[hawker._id.toString()] = {
        name: hawker.name,
        carparks: hawker.carparks || [],
        bus_stops: hawker.busStops || []
      };
    });

    // Update ML model mappings
    await MLService.updateMappings(mappings);
    console.log('Updated ML model mappings successfully');

    mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error syncing ML mappings:', error);
    process.exit(1);
  }
}

syncMLMappings();