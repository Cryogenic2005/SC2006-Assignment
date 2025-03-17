// controllers/queueController.js
const Queue = require('../models/Queue');
const Stall = require('../models/Stall');
const Order = require('../models/Order');

// Get queue status for a stall
exports.getQueueStatus = async (req, res) => {
  try {
    const { stallId } = req.params;
    
    const queue = await Queue.findOne({ stall: stallId });
    if (!queue) {
      return res.status(404).json({ msg: 'Queue not found for this stall' });
    }
    
    // Calculate estimated wait time based on pending orders
    const pendingOrders = await Order.countDocuments({
      stall: stallId,
      status: { $in: ['pending', 'preparing'] }
    });
    
    const queueStatus = {
      status: queue.status,
      currentNumber: queue.currentNumber,
      lastNumber: queue.lastNumber,
      averageWaitTime: queue.averageWaitTime,
      estimatedWaitTime: pendingOrders * queue.averageWaitTime,
      pendingOrders
    };
    
    res.json(queueStatus);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update queue settings (stall owner only)
exports.updateQueueSettings = async (req, res) => {
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
        averageWaitTime
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
};

// Reset queue (stall owner only)
exports.resetQueue = async (req, res) => {
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
};