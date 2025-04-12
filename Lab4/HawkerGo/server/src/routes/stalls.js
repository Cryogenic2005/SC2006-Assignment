const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Stall = require('../models/Stall');
const MenuItem = require('../models/MenuItem');
const Hawker = require('../models/Hawker');
const User = require('../models/User');

// @route   GET api/stalls
// @desc    Get all stalls
// @access  Public
router.get('/', async (req, res) => {
  try {
    const stalls = await Stall.find()
      .populate('hawker', 'name location')
      .populate('owner', 'name email');

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/:id
// @desc    Get stall by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.id)
      .populate('hawker', 'name location operatingHours')
      .populate('owner', 'name email');

    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    res.json(stall);
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Stall not found' });
    }
    
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/hawker/:hawkerId
// @desc    Get stalls by hawker center
// @access  Public
router.get('/hawker/:hawkerId', async (req, res) => {
  try {
    const stalls = await Stall.find({ hawker: req.params.hawkerId })
      .populate('hawker', 'name location')
      .sort({ name: 1 });

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/:stallId/menu
// @desc    Get menu items for a stall
// @access  Public
router.get('/:stallId/menu', async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ 
      stall: req.params.stallId,
      isAvailable: true
    }).sort({ category: 1, name: 1 });

    res.json(menuItems);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/stalls
// @desc    Create a stall (stall owner only)
// @access  Private
router.post(
  '/',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('hawkerId', 'Hawker center ID is required').not().isEmpty(),
    check('cuisine', 'Cuisine is required').not().isEmpty(),
    check('operatingHours', 'Operating hours are required').not().isEmpty(),
    check('minPrice', 'Minimum price is required').isFloat({ min: 0 }),
    check('maxPrice', 'Maximum price is required').isFloat({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is a stall owner
      const user = await User.findById(req.user.id);
      if (user.userType !== 'stallOwner') {
        return res.status(401).json({ msg: 'Not authorized as a stall owner' });
      }

      const {
        name,
        hawkerId,
        description,
        cuisine,
        isHalal,
        isVegetarian,
        isVegan,
        categories,
        operatingHours,
        minPrice,
        maxPrice,
        unitNumber,
        imageUrl
      } = req.body;

      // Check if hawker center exists
      const hawker = await Hawker.findById(hawkerId);
      if (!hawker) {
        return res.status(404).json({ msg: 'Hawker center not found' });
      }

      // Create new stall
      const newStall = new Stall({
        name,
        hawker: hawkerId,
        owner: req.user.id,
        description,
        cuisine,
        isHalal,
        isVegetarian,
        isVegan,
        categories,
        operatingHours,
        minPrice,
        maxPrice,
        unitNumber,
        imageUrl
      });

      const stall = await newStall.save();
      // Add the stall to the hawker's list of stalls
      hawker.stalls.push(stall._id);
      await hawker.save();
      // Update user with stall information
      user.stallId = stall._id;
      await user.save();

      res.json(stall);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/stalls/:stallId
// @desc    Delete a stall (stall owner only)
// @access  Private
router.delete('/:stallId', auth, async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.stallId);
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    // Check if current user is the owner
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Remove from hawker's stall list
    await Hawker.findByIdAndUpdate(stall.hawker, {
      $pull: { stalls: stall._id },
    });

    // Clear stall reference from user
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { stallId: 1 },
    });

    // Delete associated menu items
    await MenuItem.deleteMany({ stall: stall._id });

    // Delete the stall
    await stall.deleteOne();

    res.json({ msg: 'Stall successfully removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/stalls/:id
// @desc    Update stall (stall owner only)
// @access  Private
router.put(
  '/:id',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('cuisine', 'Cuisine is required').not().isEmpty(),
    check('operatingHours', 'Operating hours are required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let stall = await Stall.findById(req.params.id);
      
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }

      // Make sure user owns the stall
      if (stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const {
        name,
        description,
        cuisine,
        isHalal,
        isVegetarian,
        isVegan,
        operatingHours,
        minPrice,
        maxPrice,
        unitNumber,
        imageUrl
      } = req.body;

      // Build stall object
      const stallFields = {};
      if (name) stallFields.name = name;
      if (description) stallFields.description = description;
      if (cuisine) stallFields.cuisine = cuisine;
      if (isHalal !== undefined) stallFields.isHalal = isHalal;
      if (isVegetarian !== undefined) stallFields.isVegetarian = isVegetarian;
      if (isVegan !== undefined) stallFields.isVegan = isVegan;
      if (operatingHours) stallFields.operatingHours = operatingHours;
      if (minPrice) stallFields.minPrice = minPrice;
      if (maxPrice) stallFields.maxPrice = maxPrice;
      if (unitNumber) stallFields.unitNumber = unitNumber;
      if (imageUrl) stallFields.imageUrl = imageUrl;

      // Update stall
      stall = await Stall.findByIdAndUpdate(
        req.params.id,
        { $set: stallFields },
        { new: true }
      );

      res.json(stall);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   POST api/stalls/:stallId/menu
// @desc    Add menu item to stall (stall owner only)
// @access  Private
router.post(
  '/:stallId/menu',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price must be a positive number').isFloat({ min: 0 }),
    check('category', 'Category is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const stall = await Stall.findById(req.params.stallId);
      
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }

      // Make sure user owns the stall
      if (stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const {
        name,
        description,
        price,
        isSpicy,
        isSignature,
        isAvailable,
        category,
        imageUrl
      } = req.body;

      // Create new menu item
      const newMenuItem = new MenuItem({
        stall: req.params.stallId,
        name,
        description,
        price,
        isSpicy: isSpicy || false,
        isSignature: isSignature || false,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        category,
        imageUrl
      });

      const menuItem = await newMenuItem.save();

      res.json(menuItem);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/stalls/:stallId/menu/:itemId
// @desc    Update menu item (stall owner only)
// @access  Private
router.put(
  '/:stallId/menu/:itemId',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('price', 'Price must be a positive number').isFloat({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      let menuItem = await MenuItem.findById(req.params.itemId);
      
      if (!menuItem) {
        return res.status(404).json({ msg: 'Menu item not found' });
      }

      // Verify item belongs to the specified stall
      if (menuItem.stall.toString() !== req.params.stallId) {
        return res.status(400).json({ msg: 'Menu item does not belong to this stall' });
      }

      // Verify stall belongs to the user
      const stall = await Stall.findById(req.params.stallId);
      if (!stall || stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const {
        name,
        description,
        price,
        isSpicy,
        isSignature,
        isAvailable,
        category,
        imageUrl
      } = req.body;

      // Build menu item object
      const menuItemFields = {};
      if (name) menuItemFields.name = name;
      if (description !== undefined) menuItemFields.description = description;
      if (price) menuItemFields.price = price;
      if (isSpicy !== undefined) menuItemFields.isSpicy = isSpicy;
      if (isSignature !== undefined) menuItemFields.isSignature = isSignature;
      if (isAvailable !== undefined) menuItemFields.isAvailable = isAvailable;
      if (category) menuItemFields.category = category;
      if (imageUrl) menuItemFields.imageUrl = imageUrl;

      // Update menu item
      menuItem = await MenuItem.findByIdAndUpdate(
        req.params.itemId,
        { $set: menuItemFields },
        { new: true }
      );

      res.json(menuItem);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/stalls/:stallId/menu/:itemId
// @desc    Delete menu item (stall owner only)
// @access  Private
router.delete('/:stallId/menu/:itemId', auth, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.itemId);
    
    if (!menuItem) {
      return res.status(404).json({ msg: 'Menu item not found' });
    }

    // Verify item belongs to the specified stall
    if (menuItem.stall.toString() !== req.params.stallId) {
      return res.status(400).json({ msg: 'Menu item does not belong to this stall' });
    }

    // Verify stall belongs to the user
    const stall = await Stall.findById(req.params.stallId);
    if (!stall || stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    await MenuItem.findByIdAndRemove(req.params.itemId);

    res.json({ msg: 'Menu item removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/cuisine/:cuisineType
// @desc    Get stalls by cuisine type
// @access  Public
router.get('/cuisine/:cuisineType', async (req, res) => {
  try {
    const stalls = await Stall.find({ 
      cuisine: { $regex: req.params.cuisineType, $options: 'i' }
    })
      .populate('hawker', 'name location')
      .sort({ name: 1 });

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/dietary/:type
// @desc    Get stalls by dietary preference
// @access  Public
router.get('/dietary/:type', async (req, res) => {
  try {
    const dietaryField = req.params.type.toLowerCase();
    let query = {};

    if (dietaryField === 'halal') {
      query = { isHalal: true };
    } else if (dietaryField === 'vegetarian') {
      query = { isVegetarian: true };
    } else if (dietaryField === 'vegan') {
      query = { isVegan: true };
    } else {
      return res.status(400).json({ msg: 'Invalid dietary preference' });
    }

    const stalls = await Stall.find(query)
      .populate('hawker', 'name location')
      .sort({ name: 1 });

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/search/:query
// @desc    Search stalls by name, cuisine, or description
// @access  Public
router.get('/search/:query', async (req, res) => {
  try {
    const searchQuery = req.params.query;
    const stalls = await Stall.find({
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { cuisine: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    })
      .populate('hawker', 'name location')
      .sort({ name: 1 });

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/owner
// @desc    Get stalls owned by the authenticated user
// @access  Private
router.get('/owner/me', auth, async (req, res) => {
  try {
    const stalls = await Stall.find({ owner: req.user.id })
      .populate('hawker', 'name location')
      .sort({ name: 1 });

    res.json(stalls);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/stalls/:stallId/availability
// @desc    Update stall availability (stall owner only)
// @access  Private
router.put('/:stallId/availability', auth, async (req, res) => {
  try {
    const { isOpen } = req.body;

    if (isOpen === undefined) {
      return res.status(400).json({ msg: 'isOpen field is required' });
    }

    const stall = await Stall.findById(req.params.stallId);
    
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    // Make sure user owns the stall
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    stall.isOpen = isOpen;
    await stall.save();

    res.json(stall);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/stalls/:stallId/rating
// @desc    Rate a stall
// @access  Private
router.post(
  '/:stallId/rating',
  [
    auth,
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comment', 'Comment is required').optional().isString()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { rating, comment } = req.body;

      const stall = await Stall.findById(req.params.stallId);
      
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }

      // Check if user has already rated this stall
      const existingRatingIndex = stall.ratings.findIndex(
        r => r.user.toString() === req.user.id
      );

      if (existingRatingIndex !== -1) {
        // Update existing rating
        stall.ratings[existingRatingIndex].rating = rating;
        stall.ratings[existingRatingIndex].comment = comment;
        stall.ratings[existingRatingIndex].date = Date.now();
      } else {
        // Add new rating
        stall.ratings.push({
          user: req.user.id,
          rating,
          comment,
          date: Date.now()
        });
      }

      // Recalculate average rating
      const totalRating = stall.ratings.reduce((acc, item) => acc + item.rating, 0);
      stall.averageRating = totalRating / stall.ratings.length;

      await stall.save();

      res.json({
        ratings: stall.ratings,
        averageRating: stall.averageRating
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/stalls/:stallId/ratings
// @desc    Get stall ratings
// @access  Public
router.get('/:stallId/ratings', async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.stallId)
      .select('ratings averageRating')
      .populate('ratings.user', 'name');
    
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    res.json({
      ratings: stall.ratings,
      averageRating: stall.averageRating
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/stalls/:stallId/analytics
// @desc    Get analytics summary for a stall
// @access  Private
router.get('/:stallId/analytics', auth, async (req, res) => {
  try {
    const stall = await Stall.findById(req.params.stallId);
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    // Ensure the stall belongs to the current user
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Simulated visit count from reviews
    const totalVisits = stall.reviews.length || 0;

    // Optional: Add logic if order data is available for real revenue
    const totalRevenue = stall.orders ? stall.orders.reduce((acc, o) => acc + o.totalPrice, 0) : 0;

    // Fetch menu item count
    const menuItemCount = await MenuItem.countDocuments({ stall: stall._id });

    // Calculate number of operating days with valid times
    const operatingDays = Object.entries(stall.operatingHours || {}).filter(
      ([_, time]) => time.open && time.close
    ).length;

    res.json({
      stallName: stall.name,
      totalVisits,
      totalRevenue,
      rating: stall.averageRating || 0,
      reviewCount: stall.reviews.length || 0,
      menuItemCount,
      operatingDays,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;