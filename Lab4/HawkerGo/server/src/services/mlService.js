const axios = require('axios');
//const config = require('../config');

const ML_API_BASE_URL = process.env.ML_API_URL || 'http://localhost:5000';

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
      const response = await axios.get(`${ML_API_BASE_URL}/predict/${hawkerId}`);
      return response.data;
    } catch (error) {
      console.error('ML API error:', error.message);
      throw new Error('Failed to get crowd prediction');
    }
  }

  /**
   * Get predicted crowd levels for all hawker centers
   * @returns {Promise<Array>} - Array of prediction results
   */
  static async getAllPredictions() {
    try {
      const response = await axios.get(`${ML_API_BASE_URL}/predict/all`);
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
      const response = await axios.post(`${ML_API_BASE_URL}/update-mappings`, mappings);
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
      const response = await axios.get(`${ML_API_BASE_URL}/health`);
      return response.data.status === 'healthy';
    } catch (error) {
      console.error('ML API health check failed:', error.message);
      return false;
    }
  }
}

module.exports = MLService;
