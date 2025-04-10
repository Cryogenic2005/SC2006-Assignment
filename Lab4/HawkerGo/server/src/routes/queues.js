const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../middleware/auth');

const Queue = require('../models/Queue');
const Stall = require('../models/Stall');
const Order = require('../models/Order');

// @route   GET api/queues/stall/:stallId
// @desc    Get queue status for a stall
// @access  Public
// routes/api/queues.js
router.get('/stall/:stallId', async (req, res) => {
  try {
    const { stallId } = req.params;

    if (!stallId) {
      return res.status(400).json({ msg: 'Stall ID is required' });
    }

    const stall = await Stall.findById(stallId);
    if (!stall) {
      return res.status(404).json({ msg: 'Stall not found' });
    }

    let queue = await Queue.findOne({ stall: stallId });

    // Auto-create queue if it doesn't exist
    if (!queue) {
      queue = new Queue({
        stall: stallId,
        status: 'active',
        currentNumber: 0,
        lastNumber: 0,
        averageWaitTime: 10
      });
      await queue.save();
    }

    // Count pending orders
    const pendingOrders = await Order.countDocuments({
      stall: stallId,
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    const response = {
      _id: queue._id,
      stall: queue.stall,
      status: queue.status,
      currentNumber: queue.currentNumber,
      lastNumber: queue.lastNumber,
      averageWaitTime: queue.averageWaitTime,
      estimatedWaitTime: pendingOrders * queue.averageWaitTime,
      pendingOrders
    };

    res.json(response);

  } catch (err) {
    console.error('[GET /queues/stall/:stallId] Server Error:', err.message);
    res.status(500).json({ msg: 'Server error when fetching queue data' });
  }
});


// @route   PUT api/queues/stall/:stallId
// @desc    Update queue settings (stall owner only)
// @access  Private
router.put(
  '/stall/:stallId',
  [
    auth,
    check('status', 'Status is required').isIn(['active', 'paused', 'closed']),
    check('averageWaitTime', 'Average wait time must be a positive number').optional().isInt({ min: 1 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { stallId } = req.params;
      const { status, averageWaitTime } = req.body;

      // Verify stall belongs to authenticated stall owner
      const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
      if (!stall) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      let queue = await Queue.findOne({ stall: stallId });
      if (!queue) {
        // Create queue if it doesn't exist
        queue = new Queue({
          stall: stallId,
          status,
          averageWaitTime: averageWaitTime || 10
        });
      } else {
        // Update existing queue
        if (status) queue.status = status;
        if (averageWaitTime) queue.averageWaitTime = averageWaitTime;
        queue.updated = Date.now();
      }

      await queue.save();
      res.json(queue);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   PUT api/queues/stall/:stallId/reset
// @desc    Reset queue (stall owner only)
// @access  Private
router.put('/stall/:stallId/reset', auth, async (req, res) => {
  try {
    const { stallId } = req.params;

    // Verify stall belongs to authenticated stall owner
    const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
    if (!stall) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    let queue = await Queue.findOne({ stall: stallId });
    if (!queue) {
      return res.status(404).json({ msg: 'Queue not found' });
    }

    queue.currentNumber = 0;
    queue.lastNumber = 0;
    queue.updated = Date.now();

    await queue.save();
    res.json({ msg: 'Queue reset successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/queues/stall/:stallId/current
// @desc    Update current queue number (stall owner only)
// @access  Private
router.put(
  '/stall/:stallId/current',
  [
    auth,
    check('currentNumber', 'Current number is required').isInt({ min: 0 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { stallId } = req.params;
      const { currentNumber } = req.body;

      // Verify stall belongs to authenticated stall owner
      const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
      if (!stall) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      let queue = await Queue.findOne({ stall: stallId });
      if (!queue) {
        return res.status(404).json({ msg: 'Queue not found' });
      }

      // Make sure current number doesn't exceed last number
      if (currentNumber > queue.lastNumber) {
        return res.status(400).json({ msg: 'Current number cannot exceed last number' });
      }

      queue.currentNumber = currentNumber;
      queue.updated = Date.now();

      await queue.save();
      res.json(queue);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route   GET api/queues/stall/:stallId/history
// @desc    Get queue history (stall owner only)
// @access  Private
router.get('/stall/:stallId/history', auth, async (req, res) => {
  try {
    const { stallId } = req.params;

    // Verify stall belongs to authenticated stall owner
    const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
    if (!stall) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get order counts by hour for the past week
    const ordersByHour = {};
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const orders = await Order.find({
      stall: stallId,
      created: { $gte: oneWeekAgo }
    });

    orders.forEach(order => {
      const hour = order.created.getHours();
      const day = order.created.getDay(); // 0 = Sunday, 6 = Saturday
      
      const key = `${day}-${hour}`;
      
      if (!ordersByHour[key]) {
        ordersByHour[key] = 0;
      }
      ordersByHour[key]++;
    });

    // Format response as hourly data for each day of week
    const queueHistory = {
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: Array.from({ length: 24 }, (_, i) => i),
      data: []
    };

    for (let day = 0; day < 7; day++) {
      const dayData = {
        day: queueHistory.days[day],
        hourly: []
      };
      
      for (let hour = 0; hour < 24; hour++) {
        const key = `${day}-${hour}`;
        dayData.hourly.push(ordersByHour[key] || 0);
      }
      
      queueHistory.data.push(dayData);
    }

    res.json(queueHistory);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/queues/user/position/:orderId
// @desc    Get user's position in queue
// @access  Private
router.get('/user/position/:orderId', auth, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order and verify it belongs to user
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }

    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    // Get queue info
    const queue = await Queue.findOne({ stall: order.stall });
    if (!queue) {
      return res.status(404).json({ msg: 'Queue not found' });
    }

    // Calculate position
    let position = 0;
    if (order.queueNumber > queue.currentNumber) {
      position = order.queueNumber - queue.currentNumber;
    }

    // Calculate estimated wait time
    const estimatedWaitTime = position * queue.averageWaitTime;

    res.json({
      queueNumber: order.queueNumber,
      currentNumber: queue.currentNumber,
      position,
      estimatedWaitTime,
      status: order.status
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;