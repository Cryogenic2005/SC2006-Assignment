export const API_URL = 'https://hawkergo-api.example.com/api';
export const LTA_API_KEY = 'your_lta_api_key_here'; // Replace with actual LTA API key
export const MAPBOX_API_KEY = 'your_mapbox_api_key_here'; // Replace with actual Mapbox key

// Event types
export const EVENT_TYPES = {
  QUEUE_UPDATED: 'QUEUE_UPDATED',
  ORDER_STATUS_CHANGED: 'ORDER_STATUS_CHANGED',
  CROWD_LEVEL_UPDATED: 'CROWD_LEVEL_UPDATED'
};

// Crowd levels
export const CROWD_LEVELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
};

// Order statuses
export const ORDER_STATUS = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

// Queue statuses
export const QUEUE_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  CLOSED: 'closed'
};

// User types
export const USER_TYPES = {
  CUSTOMER: 'customer',
  STALL_OWNER: 'stallOwner',
  ADMIN: 'admin'
};

// Stall category types
export const STALL_CATEGORIES = [
  'Chinese', 'Malay', 'Indian', 'Western', 'Japanese',
  'Korean', 'Thai', 'Vietnamese', 'Vegetarian', 'Seafood', 'Dessert'
];

// Diet types
export const DIET_TYPES = {
  VEGETARIAN: 'Vegetarian',
  VEGAN: 'Vegan',
  HALAL: 'Halal',
  GLUTEN_FREE: 'Gluten-free'
};

// Spice levels
export const SPICE_LEVELS = [
  'Not Spicy', 'Mild', 'Medium', 'Spicy', 'Very Spicy'
];

// Default export all constants as a single object
export default {
  API_URL,
  LTA_API_KEY,
  MAPBOX_API_KEY,
  EVENT_TYPES,
  CROWD_LEVELS,
  ORDER_STATUS,
  QUEUE_STATUS,
  USER_TYPES,
  STALL_CATEGORIES,
  DIET_TYPES,
  SPICE_LEVELS
};
