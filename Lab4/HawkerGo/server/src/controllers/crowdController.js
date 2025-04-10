const Crowd = require('../models/Crowd');
const Hawker = require('../models/Hawker');
const MLService = require('../services/mlService');

// Get all crowd levels
exports.getAllCrowdLevels = async (req, res) => {
  try {
    // Get all hawker centers
    const hawkers = await Hawker.find();
    
    // Get the latest crowd report for each hawker
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const results = [];

    for (const hawker of hawkers) {
      // Find the most recent validated crowd report
      const crowdData = await Crowd.findOne({
        hawker: hawker._id,
        timestamp: { $gt: thirtyMinutesAgo }
      }).sort({ timestamp: -1 });

      if (crowdData) {
        results.push({
          hawker: hawker._id,
          level: crowdData.level,
          validated: crowdData.validated,
          timestamp: crowdData.timestamp,
          source: crowdData.source || 'user_report'
        });
      } else {
        // Try to get ML prediction for this hawker
        try {
          const mlPrediction = await MLService.getPrediction(hawker._id.toString());
          
          results.push({
            hawker: hawker._id,
            level: mlPrediction.crowd_level,
            validated: false,
            timestamp: Date.now(),
            source: 'ml_prediction'
          });
        } catch (mlError) {
          console.error(`ML prediction failed for hawker ${hawker._id}: ${mlError.message}`);
          
          // Generate random crowd level as fallback
          const levels = ['Low', 'Medium', 'High'];
          const randomLevel = levels[Math.floor(Math.random() * levels.length)];
          
          results.push({
            hawker: hawker._id,
            level: randomLevel,
            validated: false,
            timestamp: Date.now(),
            source: 'random_fallback',
            isMock: true
          });
        }
      }
    }

    return res.json(results);
  } catch (err) {
    console.error('Error getting all crowd levels:', err.message);
    res.status(500).send('Server Error');
  }
};

// Report crowd level
exports.reportCrowdLevel = async (req, res) => {
  try {
    const { hawkerId, level } = req.body;

    // Validate hawker exists
    const hawker = await Hawker.findById(hawkerId);
    if (!hawker) {
      return res.status(404).json({ msg: 'Hawker center not found' });
    }

    // Check if user has already reported in the last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const existingReport = await Crowd.findOne({
      hawker: hawkerId,
      reportedBy: req.user.id,
      timestamp: { $gt: thirtyMinutesAgo }
    });

    if (existingReport) {
      return res.status(400).json({
        msg: 'You have already submitted a crowd report recently'
      });
    }

    // Create new crowd report
    const newCrowdReport = new Crowd({
      hawker: hawkerId,
      level,
      reportedBy: req.user.id,
      source: 'user_report'
    });

    await newCrowdReport.save();

    // Update most recent validated crowd report
    const reports = await Crowd.find({
      hawker: hawkerId,
      timestamp: { $gt: thirtyMinutesAgo },
      source: 'user_report'
    });

    // Simple validation - if multiple reports exist with the same level
    if (reports.length >= 3) {
      // Count levels
      const levelCounts = {};
      reports.forEach(report => {
        if (!levelCounts[report.level]) {
          levelCounts[report.level] = 0;
        }
        levelCounts[report.level]++;
      });

      // Find most reported level
      let mostReportedLevel = '';
      let maxCount = 0;

      Object.keys(levelCounts).forEach(level => {
        if (levelCounts[level] > maxCount) {
          maxCount = levelCounts[level];
          mostReportedLevel = level;
        }
      });

      // If at least 3 reports agree, validate them
      if (maxCount >= 3) {
        await Crowd.updateMany(
          {
            hawker: hawkerId,
            level: mostReportedLevel,
            timestamp: { $gt: thirtyMinutesAgo }
          },
          { validated: true }
        );
      }
    }

    res.json({ msg: 'Crowd level reported successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get current crowd level for a hawker center
exports.getCurrentCrowdLevel = async (req, res) => {
  try {
    const { hawkerId } = req.params;

    // Find the most recent validated crowd report
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    const validatedReport = await Crowd.findOne({
      hawker: hawkerId,
      validated: true,
      timestamp: { $gt: thirtyMinutesAgo }
    }).sort({ timestamp: -1 });

    if (validatedReport) {
      return res.json({ 
        level: validatedReport.level,
        source: 'user_validated',
        timestamp: validatedReport.timestamp
      });
    }

    // If no validated report, get most recent report
    const recentReport = await Crowd.findOne({
      hawker: hawkerId,
      timestamp: { $gt: thirtyMinutesAgo }
    }).sort({ timestamp: -1 });

    // If there's a recent user report, return it
    if (recentReport) {
      return res.json({
        level: recentReport.level,
        validated: false,
        source: recentReport.source || 'user_report',
        timestamp: recentReport.timestamp,
        message: 'This crowd level has not been validated by multiple users'
      });
    }

    // If no recent user reports, try to get ML prediction
    try {
      const mlPrediction = await MLService.getPrediction(hawkerId);
      
      // Save the ML prediction to the database
      const newCrowdReport = new Crowd({
        hawker: hawkerId,
        level: mlPrediction.crowd_level,
        source: 'ml_prediction',
        confidence: mlPrediction.confidence
      });
      
      await newCrowdReport.save();
      
      return res.json({
        level: mlPrediction.crowd_level,
        validated: false,
        source: 'ml_prediction',
        confidence: mlPrediction.confidence,
        timestamp: new Date(),
        message: 'This crowd level is based on machine learning prediction'
      });
    } catch (mlError) {
      console.error('ML prediction failed:', mlError.message);
      
      // If ML prediction fails, return unknown status
      return res.json({
        level: 'Unknown',
        message: 'No recent crowd reports available'
      });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get ML prediction for a hawker center
exports.getMLPrediction = async (req, res) => {
  try {
    const { hawkerId } = req.params;
    
    const prediction = await MLService.getPrediction(hawkerId);
    res.json(prediction);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get ML predictions for all hawker centers
exports.getAllMLPredictions = async (req, res) => {
  try {
    const predictions = await MLService.getAllPredictions();
    res.json(predictions);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};