import { calculateDistance, getCurrentLocation } from './locationService';

// Get personalized hawker center recommendations
export const getRecommendations = async (hawkerCenters, userPreferences, orderHistory = [], crowdData = {}) => {
  try {
    // Get current location
    const userLocation = await getCurrentLocation();
    
    // Calculate score for each hawker center
    const scoredHawkers = hawkerCenters.map(hawker => {
      let score = 0;
      
      // Distance score (closer is better)
      if (hawker.location && hawker.location.coordinates) {
        const distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          hawker.location.coordinates[1],
          hawker.location.coordinates[0]
        );
        
        // Closer hawkers get higher scores (max 30 points)
        score += Math.max(0, 30 - distance * 6); // -6 points per km
      }
      
      // Crowd level score (less crowded is better)
      if (crowdData[hawker._id]) {
        const crowdLevel = crowdData[hawker._id].level;
        
        switch (crowdLevel) {
          case 'Low':
            score += 25;
            break;
          case 'Medium':
            score += 15;
            break;
          case 'High':
            score += 5;
            break;
          default:
            score += 10; // Unknown crowd level
            break;
        }
      }
      
      // User preferences score
      if (userPreferences) {
        // Cuisine preferences
        if (userPreferences.cuisines && userPreferences.cuisines.length > 0) {
          const stallsWithMatchingCuisine = hawker.stalls.filter(stall => 
            userPreferences.cuisines.includes(stall.cuisine)
          );
          
          if (stallsWithMatchingCuisine.length > 0) {
            score += 20 * (stallsWithMatchingCuisine.length / hawker.stalls.length);
          }
        }
        
        // Dietary preferences
        if (userPreferences.dietaryRestrictions && userPreferences.dietaryRestrictions.length > 0) {
          const stallsMatchingDiet = hawker.stalls.filter(stall => {
            // Check if stall meets all dietary restrictions
            return userPreferences.dietaryRestrictions.every(restriction => {
              switch (restriction) {
                case 'Vegetarian':
                  return stall.isVegetarian;
                case 'Vegan':
                  return stall.isVegan;
                case 'Halal':
                  return stall.isHalal;
                default:
                  return true;
              }
            });
          });
          
          if (stallsMatchingDiet.length > 0) {
            score += 15 * (stallsMatchingDiet.length / hawker.stalls.length);
          }
        }
        
        // Price range
        if (userPreferences.priceRange) {
          const { min, max } = userPreferences.priceRange;
          const stallsInPriceRange = hawker.stalls.filter(stall => {
            const avgPrice = (stall.minPrice + stall.maxPrice) / 2;
            return avgPrice >= min && avgPrice <= max;
          });
          
          if (stallsInPriceRange.length > 0) {
            score += 10 * (stallsInPriceRange.length / hawker.stalls.length);
          }
        }
      }
      
      // Previous visit history score
      if (orderHistory.length > 0) {
        const visitsToHawker = orderHistory.filter(order => 
          order.stall.hawker._id === hawker._id
        );
        
        if (visitsToHawker.length > 0) {
          // Add points based on frequency, but not too many to avoid always recommending the same places
          score += Math.min(15, visitsToHawker.length * 3);
        }
      }
      
      return {
        ...hawker,
        score,
        distance: hawker.location && hawker.location.coordinates ? 
          calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            hawker.location.coordinates[1],
            hawker.location.coordinates[0]
          ) : null
      };
    });
    
    // Sort by score (highest first)
    return scoredHawkers.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    // If location fails, return unsorted list
    return hawkerCenters;
  }
};