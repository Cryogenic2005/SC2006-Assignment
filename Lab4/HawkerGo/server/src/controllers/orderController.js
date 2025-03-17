const Order = require('../models/Order');
const Queue = require('../models/Queue');
const Stall = require('../models/Stall');
const Loyalty = require('../models/Loyalty');
const mongoose = require('mongoose');

// Create a new order
exports.createOrder = async (req, res) => {
  try {
    const { stallId, items, specialRequests } = req.body;
    
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
};

// Get all orders for a user
exports.getUserOrders = async (req, res) => {
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
};

// Get all orders for a stall
exports.getStallOrders = async (req, res) => {
  try {
    const { stallId } = req.params;
    
    // Verify stall belongs to authenticated stall owner
    const stall = await Stall.findOne({ _id: stallId, owner: req.user.id });
    if (!stall) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    const orders = await Order.find({ 
      stall: stallId,
      status: { $ne: 'completed' }
    })
      .sort({ created: 1 })
      .populate('user', 'name');
      
    res.json(orders);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    
    let order = await Order.findById(orderId)
      .populate('stall', 'owner');
      
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Verify stall belongs to authenticated stall owner
    if (order.stall.owner.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Update queue if order is completed
    if (status === 'completed' || status === 'cancelled') {
      const queue = await Queue.findOne({ stall: order.stall._id, status: 'active' });
      if (queue && status === 'completed') {
        queue.currentNumber = order.queueNumber;
        await queue.save();
      }
    }
    
    // Update order status
    order.status = status;
    await order.save();
    
    res.json(order);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    let order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    // Verify user owns the order
    if (order.user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    
    // Only allow cancellation if order is pending
    if (order.status !== 'pending') {
      return res.status(400).json({ msg: 'Cannot cancel order that is already being prepared' });
    }
    
    order.status = 'cancelled';
    await order.save();
    
    res.json({ msg: 'Order cancelled successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};