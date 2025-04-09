const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Order = require('../models/Order');
const Queue = require('../models/Queue');
const Stall = require('../models/Stall');
const Loyalty = require('../models/Loyalty');
const User = require('../models/User');

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post(
  '/',
  [
    auth,
    check('stallId', 'Stall ID is required').not().isEmpty(),
    check('items', 'Items are required').isArray().notEmpty(),
    check('items.*.name', 'Item name is required').not().isEmpty(),
    check('items.*.quantity', 'Item quantity must be a positive number').isInt({ min: 1 }),
    check('items.*.price', 'Item price must be a positive number').isFloat({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { stallId, items, specialRequests } = req.body;

    try {
      // Validate stall exists
      const stall = await Stall.findById(stallId);
      if (!stall) {
        return res.status(404).json({ msg: 'Stall not found' });
      }

      // Calculate total amount
      let totalAmount = 0;
      items.forEach(item => {
        totalAmount += item.price * item.quantity;
      });

      // Get queue information
      const queue = await Queue.findOne({ stall: stallId, status: 'active' });
      if (!queue) {
        return res.status(400).json({ msg: 'Stall is not accepting orders at this time' });
      }

      // Increment queue
      queue.lastNumber += 1;
      await queue.save();

      // Create new order
      const newOrder = new Order({
        user: req.user.id,
        stall: stallId,
        items,
        totalAmount,
        specialRequests,
        queueNumber: queue.lastNumber,
        estimatedWaitTime: queue.averageWaitTime
      });

      const order = await newOrder.save();

      // Update user loyalty points
      const loyalty = await Loyalty.findOne({ user: req.user.id, stall: stallId });
      if (loyalty) {
        // Add points based on order amount (1 point per dollar)
        loyalty.points += Math.floor(totalAmount);
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

        await loyalty.save();
      } else {
        // Create new loyalty record
        const newLoyalty = new Loyalty({
          user: req.user.id,
          stall: stallId,
          points: Math.floor(totalAmount),
          visits: 1
        });
        await newLoyalty.save();
      }

      res.json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/orders
// @desc    Get all orders for a user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ created: -1 })
      .populate('stall', 'name imageUrl location')
      .populate('user', 'name');

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
// @route   GET api/orders/:id
// @desc    Get order by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('stall', 'name imageUrl location hawker owner') 
      .populate('user', 'name');

    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (
      order.user._id.toString() !== req.user.id &&
      order.stall.owner.toString() !== req.user.id
    ) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(order);
  } catch (err) {
    console.error(err.message);

    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Order not found' });
    }

    res.status(500).send('Server Error');
  }
});


// @route   GET api/orders/stall/:stallId
// @desc    Get all orders for a stall (stall owner only)
// @access  Private
router.get('/stall/:stallId', auth, async (req, res) => {
  try {
    const stall = await Stall.findOne({ _id: req.params.stallId, owner: req.user.id });
    if (!stall) return res.status(401).json({ msg: 'Not authorized' });

    const orders = await Order.find({
      stall: req.params.stallId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    })
      .sort({ created: 1 })
      .populate('user', 'name');

    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/orders/:id/status
// @desc    Update order status (stall owner only)
// @access  Private
router.put(
  '/:id/status',
  [
    auth,
    check('status', 'Status is required').isIn(['pending', 'preparing', 'ready', 'completed', 'cancelled'])
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { status } = req.body;

    try {
      let order = await Order.findById(req.params.id).populate('stall', 'owner');
      if (!order) return res.status(404).json({ msg: 'Order not found' });

      if (order.stall.owner.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });

      const prevStatus = order.status;
      order.status = status;
      await order.save();

      // Advance queue only if status is completed or cancelled
      if ((status === 'completed' || status === 'cancelled') && prevStatus !== status) {
        const queue = await Queue.findOne({ stall: order.stall._id });
        if (queue && order.queueNumber >= queue.currentNumber) {
          const nextOrder = await Order.findOne({
            stall: order.stall._id,
            queueNumber: { $gt: queue.currentNumber },
            status: { $in: ['pending', 'preparing', 'ready'] }
          }).sort({ queueNumber: 1 });

          queue.currentNumber = nextOrder ? nextOrder.queueNumber : queue.currentNumber + 1;
          await queue.save();
        }
      }

      res.json(order);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/orders/:id/cancel
// @desc    Cancel order (customer only)
// @access  Private
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ msg: 'Order not found' });
    if (order.user.toString() !== req.user.id) return res.status(401).json({ msg: 'Not authorized' });
    if (order.status !== 'pending') return res.status(400).json({ msg: 'Cannot cancel order that is already being processed' });

    order.status = 'cancelled';
    await order.save();

    // Advance queue if applicable
    const queue = await Queue.findOne({ stall: order.stall });
    if (queue && order.queueNumber === queue.currentNumber) {
      const nextOrder = await Order.findOne({
        stall: order.stall,
        queueNumber: { $gt: queue.currentNumber },
        status: { $in: ['pending', 'preparing', 'ready'] }
      }).sort({ queueNumber: 1 });

      queue.currentNumber = nextOrder ? nextOrder.queueNumber : queue.currentNumber + 1;
      await queue.save();
    }

    res.json({ msg: 'Order cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/orders/stats/:stallId
// @desc    Get order statistics for a stall (stall owner only)
// @access  Private
router.get('/stats/:stallId', auth, async (req, res) => {
  try {
    const { stallId } = req.params;

    // Verify stall belongs to authenticated stall owner
    const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
    if (!stall) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get total orders
    const totalOrders = await Order.countDocuments({ stall: stallId });

    // Get total revenue
    const orders = await Order.find({ stall: stallId });
    const totalRevenue = orders.reduce((acc, order) => acc + order.totalAmount, 0);

    // Get orders by status
    const statusCounts = {
      pending: await Order.countDocuments({ stall: stallId, status: 'pending' }),
      preparing: await Order.countDocuments({ stall: stallId, status: 'preparing' }),
      ready: await Order.countDocuments({ stall: stallId, status: 'ready' }),
      completed: await Order.countDocuments({ stall: stallId, status: 'completed' }),
      cancelled: await Order.countDocuments({ stall: stallId, status: 'cancelled' })
    };

    // Get orders by date (last 7 days)
    const dateLabels = [];
    const orderCountsByDate = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const startOfDay = new Date(date.setHours(0, 0, 0, 0));
      const endOfDay = new Date(date.setHours(23, 59, 59, 999));
      
      const count = await Order.countDocuments({
        stall: stallId,
        created: { $gte: startOfDay, $lte: endOfDay }
      });
      
      dateLabels.push(startOfDay.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      orderCountsByDate.push(count);
    }

    // Get popular items
    const popularItems = [];
    const itemCounts = {};
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemName = item.name;
        if (!itemCounts[itemName]) {
          itemCounts[itemName] = 0;
        }
        itemCounts[itemName] += item.quantity;
      });
    });
    
    // Sort by popularity
    const sortedItems = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    sortedItems.forEach(([itemName, count]) => {
      popularItems.push({ name: itemName, count });
    });

    res.json({
      totalOrders,
      totalRevenue,
      statusCounts,
      orderTrend: {
        labels: dateLabels,
        data: orderCountsByDate
      },
      popularItems
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;