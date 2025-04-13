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

const Hawker = require('../models/Hawker'); // Make sure this model is correct

exports.getNearbyHawkers = async (req, res) => {
  const { latitude, longitude } = req.body;

  console.log('📍 Received coordinates from frontend:', latitude, longitude);

  try {
    const hawkers = await Hawker.find({});
    console.log('📦 Total hawkers in DB:', hawkers.length);

    const getDistance = (lat1, lon1, lat2, lon2) => {
      const toRad = angle => angle * (Math.PI / 180);
      const R = 6371; // Earth's radius in km

      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000; // Convert to meters
    };

    const nearbyHawkers = hawkers.filter(h => {
      const coords = h.location?.coordinates;
      if (!Array.isArray(coords) || coords.length < 2) {
        console.warn(`⚠️ Skipped ${h.name || h._id}: invalid lat/lon`, h.location);
        return false;
      }

      const [lon, lat] = coords;
      const distance = getDistance(latitude, longitude, lat, lon);
      console.log(`📏 ${h.name}: ${distance.toFixed(2)}m away`);

      return distance <= 10000; // Within 30 km radius
    });

    console.log(`✅ Nearby hawkers found: ${nearbyHawkers.length}`);
    res.json(nearbyHawkers);
  } catch (error) {
    console.error('❌ Error fetching nearby hawkers:', error);
    res.status(500).send('Server error');
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