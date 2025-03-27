const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Hawker = require('../models/Hawker');
const Stall = require('../models/Stall');

// @route   GET api/hawkers
// @desc    Get all hawker centers
// @access  Public
router.get('/', async (req, res) => {
  try {
    const hawkers = await Hawker.find().sort({ name: 1 });
    
    // Add stall count to each hawker
    const hawkersWithStallCount = await Promise.all(
      hawkers.map(async (hawker) => {
        const stallCount = await Stall.countDocuments({ hawker: hawker._id });
        return {
          ...hawker._doc,
          stallCount
        };
      })
    );
    
    res.json(hawkersWithStallCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/hawkers/:id
// @desc    Get hawker center by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const hawker = await Hawker.findById(req.params.id);
    
    if (!hawker) {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    // Get stalls count
    const stallCount = await Stall.countDocuments({ hawker: hawker._id });
    
    res.json({
      ...hawker._doc,
      stallCount
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   POST api/hawkers
// @desc    Create a hawker center (admin only)
// @access  Private/Admin
router.post(
  '/',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('address', 'Address is required').not().isEmpty(),
    check('location.coordinates', 'Location coordinates are required').isArray()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      address,
      description,
      location,
      operatingHours,
      imageUrl,
      features
    } = req.body;

    try {
      // Check if hawker center already exists
      let hawker = await Hawker.findOne({ name });

      if (hawker) {
        return res.status(400).json({ msg: 'Hawker center already exists' });
      }

      hawker = new Hawker({
        name,
        address,
        description,
        location,
        operatingHours,
        imageUrl,
        features
      });

      await hawker.save();

      res.json(hawker);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/hawkers/:id
// @desc    Update hawker center (admin only)
// @access  Private/Admin
router.put(
  '/:id',
  [
    auth,
    check('name', 'Name is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const {
      name,
      address,
      description,
      location,
      operatingHours,
      imageUrl,
      features
    } = req.body;

    // Build hawker object
    const hawkerFields = {};
    if (name) hawkerFields.name = name;
    if (address) hawkerFields.address = address;
    if (description) hawkerFields.description = description;
    if (location) hawkerFields.location = location;
    if (operatingHours) hawkerFields.operatingHours = operatingHours;
    if (imageUrl) hawkerFields.imageUrl = imageUrl;
    if (features) hawkerFields.features = features;

    try {
      let hawker = await Hawker.findById(req.params.id);

      if (!hawker) {
        return res.status(404).json({ msg: 'Hawker center not found' });
      }

      // Update
      hawker = await Hawker.findByIdAndUpdate(
        req.params.id,
        { $set: hawkerFields },
        { new: true }
      );

      res.json(hawker);
    } catch (err) {
      console.error(err.message);
      
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Hawker center not found' });
      }
      
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/hawkers/:id/stalls
// @desc    Get all stalls in a hawker center
// @access  Public
router.get('/:id/stalls', async (req, res) => {
  try {
    const hawker = await Hawker.findById(req.params.id);
    
    if (!hawker) {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    const stalls = await Stall.find({ hawker: req.params.id })
      .sort({ name: 1 });
    
    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   GET api/hawkers/nearby
// @desc    Get hawker centers near user location
// @access  Public
router.get('/nearby/:lat/:lng/:radius?', async (req, res) => {
  try {
    const { lat, lng } = req.params;
    const radius = req.params.radius || 5; // Default 5km radius
    
    const hawkers = await Hawker.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      }
    }).limit(10);
    
    // Add stall count to each hawker
    const hawkersWithStallCount = await Promise.all(
      hawkers.map(async (hawker) => {
        const stallCount = await Stall.countDocuments({ hawker: hawker._id });
        
        // Calculate distance
        const hawkerLat = hawker.location.coordinates[1];
        const hawkerLng = hawker.location.coordinates[0];
        const distance = calculateDistance(lat, lng, hawkerLat, hawkerLng);
        
        return {
          ...hawker._doc,
          stallCount,
          distance: parseFloat(distance.toFixed(1))
        };
      })
    );
    
    res.json(hawkersWithStallCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Helper function to calculate distance between coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// @route   GET api/hawkers/search/:query
// @desc    Search hawker centers by name or address
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const hawkers = await Hawker.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { address: { $regex: searchQuery, $options: 'i' } },
        { 'features.value': { $regex: searchQuery, $options: 'i' } }
      ]
    }).sort({ name: 1 });
    
    // Add stall count to each hawker
    const hawkersWithStallCount = await Promise.all(
      hawkers.map(async (hawker) => {
        const stallCount = await Stall.countDocuments({ hawker: hawker._id });
        return {
          ...hawker._doc,
          stallCount
        };
      })
    );
    
    res.json(hawkersWithStallCount);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/hawkers/:id
// @desc    Delete a hawker center (admin only)
// @access  Private/Admin
router.delete('/:id', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.userType !== 'admin') {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    const hawker = await Hawker.findById(req.params.id);
    
    if (!hawker) {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    // Check if hawker has any stalls
    const stallCount = await Stall.countDocuments({ hawker: req.params.id });
    
    if (stallCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete hawker center with existing stalls' 
      });
    }
    
    await Hawker.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Hawker center removed' });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

module.exports = router;