const Crowd = require('../models/Crowd');
const Hawker = require('../models/Hawker');

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
      reportedBy: req.user.id
    });
    
    await newCrowdReport.save();
    
    // Update most recent validated crowd report
    const reports = await Crowd.find({
      hawker: hawkerId,
      timestamp: { $gt: thirtyMinutesAgo }
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
      return res.json({ level: validatedReport.level });
    }
    
    // If no validated report, get most recent report
    const recentReport = await Crowd.findOne({
      hawker: hawkerId,
      timestamp: { $gt: thirtyMinutesAgo }
    }).sort({ timestamp: -1 });
    
    if (recentReport) {
      return res.json({ 
        level: recentReport.level, 
        validated: false,
        message: 'This crowd level has not been validated by multiple users'
      });
    }
    
    res.json({ 
      level: 'Unknown', 
      message: 'No recent crowd reports available'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};