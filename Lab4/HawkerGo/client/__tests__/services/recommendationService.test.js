import { getRecommendations } from '../../app/services/recommendationService';
import * as locationService from '../../app/services/locationService';

jest.mock('../../app/services/locationService');

describe('getRecommendations', () => {
  const mockLocation = { latitude: 1.3, longitude: 103.8 };

  const sampleHawkers = [
    {
      _id: 'hawker1',
      name: 'Hawker A',
      location: { coordinates: [103.801, 1.301] },
      stalls: [
        { cuisine: 'Chinese', isVegetarian: true, isHalal: true, isVegan: false, minPrice: 3, maxPrice: 5 },
        { cuisine: 'Malay', isVegetarian: false, isHalal: true, isVegan: false, minPrice: 4, maxPrice: 6 },
      ]
    },
    {
      _id: 'hawker2',
      name: 'Hawker B',
      location: { coordinates: [103.802, 1.302] },
      stalls: [
        { cuisine: 'Indian', isVegetarian: true, isHalal: false, isVegan: true, minPrice: 2, maxPrice: 4 }
      ]
    }
  ];

  const userPreferences = {
    cuisines: ['Chinese'],
    dietaryRestrictions: ['Vegetarian'],
    priceRange: { min: 3, max: 5 }
  };

  const orderHistory = [
    {
      stall: {
        hawker: { _id: 'hawker1' }
      }
    },
    {
      stall: {
        hawker: { _id: 'hawker1' }
      }
    }
  ];

  const crowdData = {
    hawker1: { level: 'Low' },
    hawker2: { level: 'High' }
  };

  beforeEach(() => {
    locationService.getCurrentLocation.mockResolvedValue(mockLocation);
    locationService.calculateDistance = jest.requireActual('../../app/services/locationService').calculateDistance;
  });

  it('returns sorted recommendations by score', async () => {
    const results = await getRecommendations(sampleHawkers, userPreferences, orderHistory, crowdData);

    expect(results).toHaveLength(2);
    expect(results[0]._id).toBe('hawker1'); // More matches
    expect(results[1]._id).toBe('hawker2');
    expect(results[0].score).toBeGreaterThan(results[1].score);
  });

  it('handles missing location gracefully and returns unsorted hawkers', async () => {
    locationService.getCurrentLocation.mockRejectedValue(new Error('Location error'));

    const results = await getRecommendations(sampleHawkers, userPreferences, orderHistory, crowdData);
    expect(results).toEqual(sampleHawkers); // unsorted fallback
  });

  it('awards score based on preferences, crowd, and visits', async () => {
    const results = await getRecommendations(sampleHawkers, userPreferences, orderHistory, crowdData);
    const hawkerA = results.find(h => h._id === 'hawker1');

    expect(hawkerA.score).toBeGreaterThan(0);
    expect(hawkerA.distance).not.toBeNull();
  });
});
