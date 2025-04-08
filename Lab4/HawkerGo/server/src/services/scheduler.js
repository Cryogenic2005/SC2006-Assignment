const cron = require('node-cron');
const Crowd = require('../models/Crowd');
const Hawker = require('../models/Hawker');
const MLService = require('./mlService');

/**
 * Service to handle scheduled tasks
 */
class SchedulerService {
  /**
   * Start all scheduled tasks
   */
  static startTasks() {
    // Update ML predictions every hour
    cron.schedule('0 * * * *', async () => {
      try {
        console.log('Running scheduled task: Update ML predictions');
        await SchedulerService.updateMLPredictions();
      } catch (error) {
        console.error('Scheduled task failed:', error);
      }
    });
  }

  /**
   * Update ML predictions for all hawker centers
   */
  static async updateMLPredictions() {
    try {
      // Get all hawker centers
      const hawkers = await Hawker.find({});
      
      // Get predictions for all hawkers
      const predictions = await MLService.getAllPredictions();
      
      // Map predictions by hawker ID
      const predictionMap = {};
      predictions.forEach(pred => {
        predictionMap[pred.hawker_id] = pred;
      });
      
      // Create crowd reports for each hawker
      for (const hawker of hawkers) {
        const hawkerId = hawker._id.toString();
        const prediction = predictionMap[hawkerId];
        
        if (prediction) {
          // Create new crowd report with ML prediction
          const newCrowdReport = new Crowd({
            hawker: hawkerId,
            level: prediction.crowd_level,
            source: 'ml_prediction',
            confidence: prediction.confidence
          });
          
          await newCrowdReport.save();
          console.log(`Updated prediction for ${hawker.name}: ${prediction.crowd_level}`);
        }
      }
      
      console.log('ML predictions updated successfully');
    } catch (error) {
      console.error('Failed to update ML predictions:', error);
      throw error;
    }
  }
}

module.exports = SchedulerService;