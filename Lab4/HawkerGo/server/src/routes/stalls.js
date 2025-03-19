const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const stallController = require('../controllers/stallController');

// @route   GET api/stalls
// @desc    Get all stalls
// @access  Public
router.get('/', stallController.getAllStalls);

// @route   GET api/stalls/:id
// @desc    Get stall by ID
// @access  Public
router.get('/:id', stallController.getStallById);

// @route   GET api/stalls/hawker/:hawkerId
// @desc    Get stalls by hawker center
// @access  Public
router.get('/hawker/:hawkerId', stallController.getStallsByHawker);

// @route   GET api/stalls/:stallId/menu
// @desc    Get menu items for a stall
// @access  Public
router.get('/:stallId/menu', stallController.getStallMenu);

// @route   POST api/stalls
// @desc    Create a stall (stall owner only)
// @access  Private
router.post('/', auth, stallController.createStall);

// @route   PUT api/stalls/:id
// @desc    Update stall (stall owner only)
// @access  Private
router.put('/:id', auth, stallController.updateStall);

// @route   POST api/stalls/:stallId/menu
// @desc    Add menu item to stall (stall owner only)
// @access  Private
router.post('/:stallId/menu', auth, stallController.addMenuItem);

// @route   PUT api/stalls/:stallId/menu/:itemId
// @desc    Update menu item (stall owner only)
// @access  Private
router.put('/:stallId/menu/:itemId', auth, stallController.updateMenuItem);

// @route   DELETE api/stalls/:stallId/menu/:itemId
// @desc    Delete menu item (stall owner only)
// @access  Private
router.delete('/:stallId/menu/:itemId', auth, stallController.deleteMenuItem);

module.exports = router;