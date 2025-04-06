const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crowdController = require('../controllers/crowdController');

// @route   POST api/crowds
// @desc    Report crowd level
// @access  Private
router.post('/', auth, crowdController.reportCrowdLevel);

// @route   GET api/crowds/:hawkerId
// @desc    Get current crowd level for a hawker center
// @access  Public
router.get('/:hawkerId', crowdController.getCurrentCrowdLevel);

module.exports = router;
