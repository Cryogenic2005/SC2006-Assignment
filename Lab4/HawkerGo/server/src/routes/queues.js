const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const queueController = require('../controllers/queueController');

// @route   GET api/queues/stall/:stallId
// @desc    Get queue status for a stall
// @access  Public
router.get('/stall/:stallId', queueController.getQueueStatus);

// @route   PUT api/queues/stall/:stallId
// @desc    Update queue settings (stall owner only)
// @access  Private
router.put('/stall/:stallId', auth, queueController.updateQueueSettings);

// @route   PUT api/queues/stall/:stallId/reset
// @desc    Reset queue (stall owner only)
// @access  Private
router.put('/stall/:stallId/reset', auth, queueController.resetQueue);

module.exports = router;