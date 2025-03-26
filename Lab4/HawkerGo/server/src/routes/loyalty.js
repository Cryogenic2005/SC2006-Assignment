const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Loyalty = require('../models/Loyalty');
const Reward = require('../models/Reward');
const Stall = require('../models/Stall');
const User = require('../models/User');

// @route   GET api/loyalty
// @desc    Get user's loyalty points for all stalls
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const loyalty = await Loyalty.find({ user: req.user.id })
      .populate({
        path: 'stall',
        select: 'name cuisine',
        populate: {
          path: 'hawker',
          select: 'name'
        }
      });
    
    res.json(loyalty);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/stall/:stallId
// @desc    Get user's loyalty points for a specific stall
// @access  Private
router.get('/stall/:stallId', auth, async (req, res) => {
  try {
    const loyalty = await Loyalty.findOne({ 
      user: req.user.id,
      stall: req.params.stallId
    }).populate({
      path: 'stall',
      select: 'name cuisine',
      populate: {
        path: 'hawker',
        select: 'name'
      }
    });
    
    if (!loyalty) {
      return res.json({ 
        user: req.user.id,
        stall: req.params.stallId,
        points: 0,
        visits: 0,
        tier: 'Bronze',
        lastVisit: null
      });
    }
    
    res.json(loyalty);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/loyalty/stall/:stallId
// @desc    Add loyalty points (stall owner only)
// @access  Private
router.post(
  '/stall/:stallId',
  [
    auth,
    check('userId', 'User ID is required').not().isEmpty(),
    check('points', 'Points must be a positive number').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { userId, points } = req.body;
    
    try {
      // Check if stall exists
      const stall = await Stall.findById(req.params.stallId);
      
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }
      
      // Check if current user is the stall owner
      if (stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      
      // Check if customer exists
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }
      
      // Find or create loyalty record
      let loyalty = await Loyalty.findOne({ 
        user: userId,
        stall: req.params.stallId
      });
      
      if (loyalty) {
        // Update existing record
        loyalty.points += points;
        loyalty.visits += 1;
        loyalty.lastVisit = Date.now();
        
        // Update tier based on points
        if (loyalty.points >= 500) {
          loyalty.tier = 'Platinum';
        } else if (loyalty.points >= 250) {
          loyalty.tier = 'Gold';
        } else if (loyalty.points >= 100) {
          loyalty.tier = 'Silver';
        }
      } else {
        // Create new record
        loyalty = new Loyalty({
          user: userId,
          stall: req.params.stallId,
          points,
          visits: 1
        });
      }
      
      await loyalty.save();
      
      res.json(loyalty);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/loyalty/rewards
// @desc    Get all rewards available for user
// @access  Private
router.get('/rewards', auth, async (req, res) => {
  try {
    // Get all loyalty points for user
    const loyaltyPoints = await Loyalty.find({ user: req.user.id });
    
    // Get all rewards
    const rewards = await Reward.find().populate('stall', 'name hawker');
    
    // Filter and add availability flag
    const userRewards = rewards.map(reward => {
      const userLoyalty = loyaltyPoints.find(
        lp => lp.stall.toString() === reward.stall._id.toString()
      );
      
      const hasEnoughPoints = userLoyalty && userLoyalty.points >= reward.pointsRequired;
      
      return {
        ...reward._doc,
        available: hasEnoughPoints,
        userPoints: userLoyalty ? userLoyalty.points : 0
      };
    });
    
    res.json(userRewards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/rewards/:stallId
// @desc    Get rewards for a specific stall
// @access  Private
router.get('/rewards/:stallId', auth, async (req, res) => {
  try {
    // Get user loyalty for this stall
    const loyalty = await Loyalty.findOne({ 
      user: req.user.id,
      stall: req.params.stallId
    });
    
    // Get stall rewards
    const rewards = await Reward.find({ stall: req.params.stallId });
    
    // Add availability flag
    const userRewards = rewards.map(reward => {
      const hasEnoughPoints = loyalty && loyalty.points >= reward.pointsRequired;
      
      return {
        ...reward._doc,
        available: hasEnoughPoints,
        userPoints: loyalty ? loyalty.points : 0
      };
    });
    
    res.json(userRewards);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/loyalty/rewards/:rewardId/redeem
// @desc    Redeem a reward
// @access  Private
router.post('/rewards/:rewardId/redeem', auth, async (req, res) => {
  try {
    // Get reward details
    const reward = await Reward.findById(req.params.rewardId)
      .populate('stall', 'name');
    
    if (!reward) {
      return res.status(404).json({ msg: 'Reward not found' });
    }
    
    // Check user loyalty
    const loyalty = await Loyalty.findOne({ 
      user: req.user.id,
      stall: reward.stall._id
    });
    
    if (!loyalty) {
      return res.status(400).json({ 
        msg: 'You have no loyalty points for this stall' 
      });
    }
    
    // Check if enough points
    if (loyalty.points < reward.pointsRequired) {
      return res.status(400).json({ 
        msg: 'Not enough loyalty points to redeem this reward',
        required: reward.pointsRequired,
        available: loyalty.points
      });
    }
    
    // Deduct points
    loyalty.points -= reward.pointsRequired;
    await loyalty.save();
    
    // Create redemption record
    const redemption = new RewardRedemption({
      user: req.user.id,
      reward: reward._id,
      stall: reward.stall._id,
      pointsUsed: reward.pointsRequired,
      status: 'active',
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });
    
    await redemption.save();
    
    res.json({
      message: `Successfully redeemed: ${reward.name}`,
      redemption,
      updatedPoints: loyalty.points
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/redemptions
// @desc    Get user's reward redemptions
// @access  Private
router.get('/redemptions', auth, async (req, res) => {
  try {
    const redemptions = await RewardRedemption.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('reward', 'name description')
      .populate('stall', 'name');
    
    res.json(redemptions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/loyalty/rewards
// @desc    Create a reward (stall owner only)
// @access  Private
router.post(
  '/rewards',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('pointsRequired', 'Points required must be a positive number').isInt({ min: 1 }),
    check('stallId', 'Stall ID is required').not().isEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, pointsRequired, stallId } = req.body;
    
    try {
      // Check if stall exists
      const stall = await Stall.findById(stallId);
      
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }
      
      // Check if current user is the stall owner
      if (stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      
      // Create new reward
      const newReward = new Reward({
        name,
        description,
        pointsRequired,
        stall: stallId
      });
      
      const reward = await newReward.save();
      
      res.json(reward);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/loyalty/rewards/:id
// @desc    Update a reward (stall owner only)
// @access  Private
router.put(
  '/rewards/:id',
  [
    auth,
    check('name', 'Name is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('pointsRequired', 'Points required must be a positive number').isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { name, description, pointsRequired } = req.body;
    
    try {
      let reward = await Reward.findById(req.params.id).populate('stall', 'owner');
      
      if (!reward) {
        return res.status(404).json({ msg: 'Reward not found' });
      }
      
      // Check if current user is the stall owner
      if (reward.stall.owner.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'Not authorized' });
      }
      
      // Update reward
      reward = await Reward.findByIdAndUpdate(
        req.params.id,
        { 
          $set: { 
            name, 
            description, 
            pointsRequired 
          } 
        },
        { new: true }
      );
      
      res.json(reward);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   DELETE api/loyalty/rewards/:id
// @desc    Delete a reward (stall owner only)
// @access  Private
router.delete('/rewards/:id', auth, async (req, res) => {
  try {
    const reward = await Reward.findById(req.params.id)
      .populate('stall', 'owner');
    
    if (!reward) {
      return res.status(404).json({ msg: 'Reward not found' });
    }
    
    // Check if current user is the stall owner
    if (reward.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Check if reward has been redeemed by any user
    const redemptionCount = await RewardRedemption.countDocuments({ 
      reward: req.params.id,
      status: 'active'
    });
    
    if (redemptionCount > 0) {
      return res.status(400).json({ 
        msg: 'Cannot delete reward that has active redemptions' 
      });
    }
    
    await Reward.findByIdAndRemove(req.params.id);
    
    res.json({ msg: 'Reward removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/loyalty/redemptions/:id
// @desc    Mark redemption as used (stall owner only)
// @access  Private
router.put('/redemptions/:id/used', auth, async (req, res) => {
  try {
    const redemption = await RewardRedemption.findById(req.params.id)
      .populate('stall', 'owner');
    
    if (!redemption) {
      return res.status(404).json({ msg: 'Redemption not found' });
    }
    
    // Check if current user is the stall owner
    if (redemption.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Check if already used
    if (redemption.status === 'used') {
      return res.status(400).json({ msg: 'Redemption already used' });
    }
    
    // Check if expired
    if (redemption.status === 'expired') {
      return res.status(400).json({ msg: 'Redemption has expired' });
    }
    
    // Update status
    redemption.status = 'used';
    redemption.usedAt = Date.now();
    
    await redemption.save();
    
    res.json(redemption);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/redemptions/verify/:code
// @desc    Verify a redemption code (stall owner only)
// @access  Private
router.get('/redemptions/verify/:code', auth, async (req, res) => {
  try {
    const redemption = await RewardRedemption.findOne({ 
      redemptionCode: req.params.code 
    })
      .populate('reward', 'name description')
      .populate('stall', 'name owner')
      .populate('user', 'name email');
    
    if (!redemption) {
      return res.status(404).json({ msg: 'Invalid redemption code' });
    }
    
    // Check if current user is the stall owner
    if (redemption.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Check if already used
    if (redemption.status === 'used') {
      return res.status(400).json({ 
        msg: 'Redemption already used',
        redemption
      });
    }
    
    // Check if expired
    if (redemption.status === 'expired') {
      return res.status(400).json({ 
        msg: 'Redemption has expired',
        redemption
      });
    }
    
    res.json(redemption);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/tiers
// @desc    Get loyalty tier information
// @access  Public
router.get('/tiers', async (req, res) => {
  try {
    const tiers = [
      {
        name: 'Bronze',
        pointsRequired: 0,
        benefits: [
          'Basic loyalty points accumulation',
          'Access to loyalty rewards'
        ]
      },
      {
        name: 'Silver',
        pointsRequired: 100,
        benefits: [
          '10% bonus points on orders',
          'Early access to promotions',
          'All Bronze tier benefits'
        ]
      },
      {
        name: 'Gold',
        pointsRequired: 250,
        benefits: [
          '15% bonus points on orders',
          'Exclusive rewards',
          'Birthday rewards',
          'All Silver tier benefits'
        ]
      },
      {
        name: 'Platinum',
        pointsRequired: 500,
        benefits: [
          '20% bonus points on orders',
          'Premium exclusive rewards',
          'Priority queue on busy days',
          'All Gold tier benefits'
        ]
      }
    ];
    
    res.json(tiers);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/loyalty/stall/:stallId/tiers
// @desc    Get stall-specific tier statistics
// @access  Private (stall owner only)
router.get('/stall/:stallId/tiers', auth, async (req, res) => {
  try {
    // Check if stall exists and user is owner
    const stall = await Stall.findById(req.params.stallId);
    
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }
    
    if (stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Get all loyalty records for this stall
    const loyaltyRecords = await Loyalty.find({ stall: req.params.stallId });
    
    // Calculate tier counts
    const tierCounts = {
      Bronze: 0,
      Silver: 0,
      Gold: 0,
      Platinum: 0
    };
    
    let totalPoints = 0;
    let totalUsers = loyaltyRecords.length;
    
    loyaltyRecords.forEach(record => {
      tierCounts[record.tier]++;
      totalPoints += record.points;
    });
    
    // Get most frequent customers
    const topCustomers = await Loyalty.find({ stall: req.params.stallId })
      .sort({ visits: -1 })
      .limit(5)
      .populate('user', 'name');
    
    res.json({
      tierCounts,
      totalUsers,
      totalPoints,
      averagePoints: totalUsers ? Math.round(totalPoints / totalUsers) : 0,
      topCustomers: topCustomers.map(c => ({
        name: c.user.name,
        visits: c.visits,
        points: c.points,
        tier: c.tier
      }))
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;