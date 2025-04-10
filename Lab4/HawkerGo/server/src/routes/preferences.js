const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Preference = require('../models/Preference');

// @route   GET api/preferences
// @desc    Get user preferences
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    let preferences = await Preference.findOne({ user: req.user.id });
    
    // If no preferences exist, create default preferences
    if (!preferences) {
      preferences = new Preference({
        user: req.user.id,
        cuisines: [],
        dietaryRestrictions: [],
        spiceLevel: 'No Preference',
        priceRange: { min: 0, max: 50 },
        favoriteHawkers: [],
        favoriteStalls: []
      });
      await preferences.save();
    }

    res.json(preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/preferences
// @desc    Update user preferences
// @access  Private
router.put('/', auth, async (req, res) => {
  const { 
    cuisines, 
    dietaryRestrictions, 
    spiceLevel, 
    priceRange,
    favoriteHawkers,
    favoriteStalls
  } = req.body;

  try {
    let preferences = await Preference.findOne({ user: req.user.id });

    if (!preferences) {
      preferences = new Preference({
        user: req.user.id,
        cuisines,
        dietaryRestrictions,
        spiceLevel,
        priceRange,
        favoriteHawkers,
        favoriteStalls
      });
    } else {
      preferences.cuisines = cuisines || [];
      preferences.dietaryRestrictions = dietaryRestrictions || [];
      preferences.spiceLevel = spiceLevel || 'No Preference';
      preferences.priceRange = priceRange || { min: 0, max: 50 };
      preferences.favoriteHawkers = favoriteHawkers || [];
      preferences.favoriteStalls = favoriteStalls || [];
    }

    await preferences.save();
    res.json(preferences);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;