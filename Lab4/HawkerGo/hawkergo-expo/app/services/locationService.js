import * as Location from 'expo-location';
import axios from 'axios';
import { LTA_API_KEY } from '../constants/constants';

// Check location permissions
export const checkLocationPermission = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking location permission:', error);
    return false;
  }
};

// Get current location
export const getCurrentLocation = async () => {
  try {
    const hasPermission = await checkLocationPermission();
    
    if (!hasPermission) {
      throw new Error('Location permission not granted');
    }
    
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced
    });
    
    return {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    };
  } catch (error) {
    console.error('Error getting current location:', error);
    throw error;
  }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
};

const deg2rad = (deg) => {
  return deg * (Math.PI / 180);
};

// Get nearby bus stops using LTA DataMall API
export const getNearbyBusStops = async (latitude, longitude, radius = 0.5) => {
  try {
    const config = {
      headers: {
        'AccountKey': LTA_API_KEY
      }
    };
    
    const res = await axios.get('http://datamall2.mytransport.sg/ltaodataservice/BusStops', config);
    
    const busStops = res.data.value;
    
    // Filter bus stops by proximity
    const nearbyBusStops = busStops.filter(stop => {
      const distance = calculateDistance(
        latitude,
        longitude,
        stop.Latitude,
        stop.Longitude
      );
      
      return distance <= radius;
    });
    
    // Sort by proximity
    nearbyBusStops.sort((a, b) => {
      const distA = calculateDistance(
        latitude,
        longitude,
        a.Latitude,
        a.Longitude
      );
      
      const distB = calculateDistance(
        latitude,
        longitude,
        b.Latitude,
        b.Longitude
      );
      
      return distA - distB;
    });
    
    return nearbyBusStops;
  } catch (error) {
    console.error('Error getting nearby bus stops:', error);
    throw error;
  }
};

// Get bus arrivals for a specific bus stop
export const getBusArrivals = async (busStopCode) => {
  try {
    const config = {
      headers: {
        'AccountKey': LTA_API_KEY
      }
    };
    
    const res = await axios.get(
      `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${busStopCode}`,
      config
    );
    
    return res.data.Services;
  } catch (error) {
    console.error('Error getting bus arrivals:', error);
    throw error;
  }
};

// Calculate route to hawker center
export const calculateRoute = async (startLat, startLng, endLat, endLng) => {
  try {
    // Note: In a real implementation, you would use a routing API like Google Maps or Mapbox
    // For simplicity, we'll just calculate the direct distance here
    
    const distance = calculateDistance(startLat, startLng, endLat, endLng);
    
    // Mock route data
    const routes = [
      {
        mode: 'walking',
        distance: distance,
        duration: distance * 12, // Approx. 12 minutes per km walking
        instructions: 'Walk directly to the destination',
        polyline: [] // Would contain route coordinates in real implementation
      }
    ];
    
    // Add public transport option if distance is more than 1km
    if (distance > 1) {
      routes.push({
        mode: 'public_transport',
        distance: distance,
        duration: distance * 3 + 5, // Approx. 3 minutes per km + 5 min waiting
        instructions: 'Take public transport to the destination',
        steps: [
          { type: 'walk', duration: 5, instruction: 'Walk to nearest bus stop' },
          { type: 'bus', duration: distance * 3, instruction: 'Take bus to destination' }
        ]
      });
    }
    
    return routes;
  } catch (error) {
    console.error('Error calculating route:', error);
    throw error;
  }
};