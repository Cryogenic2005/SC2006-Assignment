const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

// Route to get coordinates from an address (geocoding)
router.post('/geocode', locationController.getStallCoordinates);

// Route to get nearby hawkers based on user's location
router.post('/nearby-hawkers', locationController.getNearbyHawkers);

module.exports = router;