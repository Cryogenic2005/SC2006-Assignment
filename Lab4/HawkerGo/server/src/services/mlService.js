const axios = require('axios');
//const config = require('../config');

// Default to localhost:5000 for development
const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:5000';

console.log(`ML Service initialized with base URL: ${ML_API_BASE_URL}`);

/**
 * Service to interact with the ML API
 */
class MLService {
  /**
   * Get predicted crowd level for a specific hawker center
   * @param {string} hawkerId - ID of the hawker center
   * @returns {Promise<Object>} - Prediction result
   */
  static async getPrediction(hawkerId) {
    try {
      const response = await axios.get(`${ML_API_BASE_URL}/predict/${hawkerId}`, {
        timeout: 3000 // 3 second timeout to fail faster
      });
      return response.data;
    } catch (error) {
      console.error('ML API error:', error.message);
      // Instead of throwing error, return a random prediction
      return this.generateRandomPrediction(hawkerId);
    }
  }

  /**
   * Get predicted crowd levels for all hawker centers
   * @returns {Promise<Array>} - Array of prediction results
   */
  static async getAllPredictions() {
    try {
      const response = await axios.get(`${ML_API_BASE_URL}/predict/all`, {
        timeout: 3000 // 3 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('ML API error:', error.message);
      throw new Error('Failed to get crowd predictions');
    }
  }

  /**
   * Update hawker center mappings in the ML model
   * @param {Object} mappings - Hawker center to carpark/bus stop mappings
   * @returns {Promise<Object>} - Update result
   */
  static async updateMappings(mappings) {
    try {
      const response = await axios.post(`${ML_API_BASE_URL}/update-mappings`, mappings, {
        timeout: 3000
      });
      return response.data;
    } catch (error) {
      console.error('ML API error:', error.message);
      throw new Error('Failed to update mappings');
    }
  }

  /**
   * Check health of ML API
   * @returns {Promise<boolean>} - Whether ML API is healthy
   */
  static async checkHealth() {
    try {
      const response = await axios.get(`${ML_API_BASE_URL}/health`, {
        timeout: 2000 // Shorter timeout for health check
      });
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('ML API health check failed:', error.message);
      return false;
    }
  }

  /**
   * Generate a random prediction (fallback when ML API fails)
   * @param {string} hawkerId - ID of the hawker center
   * @returns {Object} - Random prediction
   */
  static generateRandomPrediction(hawkerId) {
    const levels = ['Low', 'Medium', 'High'];
    const randomLevel = levels[Math.floor(Math.random() * levels.length)];
    const confidence = Math.random() * 0.3 + 0.5; // Random number between 0.5 and 0.8
    
    return {
      hawker_id: hawkerId,
      crowd_level: randomLevel,
      confidence: confidence,
      timestamp: Date.now(),
      isMock: true
    };
  }
}

module.exports = MLService;
