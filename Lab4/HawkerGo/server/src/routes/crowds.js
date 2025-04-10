const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const crowdController = require('../controllers/crowdController');

// @route   GET api/crowd
// @desc    Get all crowd levels
// @access  Public
router.get('/', crowdController.getAllCrowdLevels);

// @route   POST api/crowd
// @desc    Report crowd level
// @access  Private
router.post('/', auth, crowdController.reportCrowdLevel);

// @route   GET api/crowd/:hawkerId
// @desc    Get current crowd level for a hawker center
// @access  Public
router.get('/:hawkerId', crowdController.getCurrentCrowdLevel);

// @route   GET api/crowd/ml/:hawkerId
// @desc    Get ML prediction for a hawker center
// @access  Public
router.get('/ml/:hawkerId', crowdController.getMLPrediction);

// @route   GET api/crowd/ml/all
// @desc    Get ML predictions for all hawker centers
// @access  Public
router.get('/ml/all', crowdController.getAllMLPredictions);

module.exports = router;
