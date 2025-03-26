const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const auth = require('../middleware/auth');

const User = require('../models/User');
const Loyalty = require('../models/Loyalty');
const Order = require('../models/Order');

// @route   POST api/users
// @desc    Register user
// @access  Public
router.post(
  '/',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('userType', 'User type is required').isIn(['customer', 'stallOwner'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, userType } = req.body;

    try {
      // Check if user exists
      let user = await User.findOne({ email });

      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      user = new User({
        name,
        email,
        password,
        userType
      });

      // Encrypt password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      await user.save();

      // Return jsonwebtoken
      const payload = {
        user: {
          id: user.id,
          userType: user.userType
        }
      };

      jwt.sign(
        payload,
        config.get('jwtSecret'),
        { expiresIn: config.get('expiresIn') },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/users
// @desc    Get current user profile
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users
// @desc    Update user profile
// @access  Private
router.put('/', auth, async (req, res) => {
  const { name, email } = req.body;

  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;

  try {
    let user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    
    // Update
    user = await User.findByIdAndUpdate(
      req.user.id, 
      { $set: userFields },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/password
// @desc    Update password
// @access  Private
router.put(
  '/password',
  [
    auth,
    check('currentPassword', 'Current password is required').exists(),
    check('newPassword', 'Please enter a new password with 6 or more characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const user = await User.findById(req.user.id);

      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      // Check current password
      const isMatch = await bcrypt.compare(currentPassword, user.password);

      if (!isMatch) {
        return res.status(400).json({ msg: 'Current password is incorrect' });
      }

      // Update password
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);

      await user.save();

      res.json({ msg: 'Password updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/users/stats
// @desc    Get user stats (orders, spent, points, etc.)
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get total orders
    const totalOrders = await Order.countDocuments({ user: req.user.id });

    // Get total spent
    const orders = await Order.find({ user: req.user.id });
    const totalSpent = orders.reduce((total, order) => total + order.totalAmount, 0);

    // Get favorite hawker
    let favoriteHawker = '';
    if (orders.length > 0) {
      const hawkerCounts = {};
      
      for (const order of orders) {
        const populatedOrder = await Order.findById(order._id)
          .populate({
            path: 'stall',
            populate: { path: 'hawker', select: 'name' }
          });
        
        const hawkerName = populatedOrder.stall.hawker.name;
        hawkerCounts[hawkerName] = (hawkerCounts[hawkerName] || 0) + 1;
      }
      
      // Find hawker with most visits
      let maxCount = 0;
      
      for (const [hawker, count] of Object.entries(hawkerCounts)) {
        if (count > maxCount) {
          maxCount = count;
          favoriteHawker = hawker;
        }
      }
    }

    // Get total loyalty points
    const loyaltyRecords = await Loyalty.find({ user: req.user.id });
    const totalPoints = loyaltyRecords.reduce((total, record) => total + record.points, 0);

    res.json({
      totalOrders,
      totalSpent,
      favoriteHawker,
      totalPoints
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;