const { getRecommendations } = require('../services/recommendationService');
const { getCurrentLocation } = require('../services/locationService');

// Mock dependencies
jest.mock('../services/locationService');

describe('Recommendation Service', () => {
  // Mock data
  const mockHawkers = [/* hawker data */];
  const mockPreferences = {/* preference data */};
  const mockOrderHistory = [/* order history */];
  const mockCrowdData = {/* crowd data */};

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should handle location retrieval failure (TC-WB-01)', async () => {
    // Mock location service to fail
    getCurrentLocation.mockRejectedValue(new Error('Location unavailable'));
    
    const result = await getRecommendations(mockHawkers, mockPreferences, mockOrderHistory, mockCrowdData);
    
    // Should return unsorted list on failure
    expect(result).toEqual(mockHawkers);
  });

  test('Should generate basic recommendations without preferences (TC-WB-02)', async () => {
    // Mock successful location
    getCurrentLocation.mockResolvedValue({latitude: 1.3521, longitude: 103.8198});
    
    const result = await getRecommendations(mockHawkers, null, [], mockCrowdData);
    
    // Verify results are sorted
    expect(result.length).toEqual(mockHawkers.length);
    expect(result[0].score).toBeGreaterThanOrEqual(result[1].score);
  });

  // Additional tests...
});