const { Client } = require('@googlemaps/google-maps-services-js');
const client = new Client({});

exports.getStallCoordinates = async (req, res) => {
  const { address } = req.body;

  try {
    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY,
      },
    });

    const location = response.data.results[0].geometry.location;
    res.json({ coordinates: location });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get coordinates' });
  }
};

const Hawker = require('../models/Hawker'); // add this only once

exports.getNearbyHawkers = async (req, res) => {
  const { latitude, longitude, radius = 2 } = req.body;

  try {
    const hawkers = await Hawker.find({});
    const nearby = hawkers.filter(hawker => {
      const [lng, lat] = hawker.location.coordinates;
      const dist = getDistanceFromLatLonInKm(lat, lng, latitude, longitude);
      return dist <= radius;
    });

    nearby.sort((a, b) => {
      const [lngA, latA] = a.location.coordinates;
      const [lngB, latB] = b.location.coordinates;

      const distA = getDistanceFromLatLonInKm(latA, lngA, latitude, longitude);
      const distB = getDistanceFromLatLonInKm(latB, lngB, latitude, longitude);

      return distA - distB;
    });

    res.json(nearby);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch nearby hawkers' });
  }
};

// Helper function
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}