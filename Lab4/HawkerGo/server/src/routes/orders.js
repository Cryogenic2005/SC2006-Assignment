const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post('/', auth, orderController.createOrder);

// @route   GET api/orders/user
// @desc    Get all orders for logged in user
// @access  Private
router.get('/user', auth, orderController.getUserOrders);

// @route   GET api/orders/stall/:stallId
// @desc    Get all orders for a stall (stall owner only)
// @access  Private
router.get('/stall/:stallId', auth, orderController.getStallOrders);

// @route   PUT api/orders/:orderId/status
// @desc    Update order status (stall owner only)
// @access  Private
router.put('/:orderId/status', auth, orderController.updateOrderStatus);

// @route   PUT api/orders/:orderId/cancel
// @desc    Cancel an order (customer only)
// @access  Private
router.put('/:orderId/cancel', auth, orderController.cancelOrder);

module.exports = router;