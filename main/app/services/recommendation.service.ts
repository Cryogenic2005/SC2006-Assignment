import { ApiService } from './api.service';

interface UserPreferences {
    favoriteCuisine: string;
    dietaryRestrictions: string[];
    priceRange: string;
    previousVisits: string[];
}

export class RecommendationService {
    private static readonly DISTANCE_WEIGHT = 0.3;
    private static readonly RATING_WEIGHT = 0.25;
    private static readonly CUISINE_MATCH_WEIGHT = 0.25;
    private static readonly CROWD_LEVEL_WEIGHT = 0.2;

    static async getPersonalizedRecommendations(
        userId: string,
        latitude: number,
        longitude: number
    ): Promise<any[]> {
        try {
            // Get user preferences and nearby hawkers in parallel
            const [userProfile, nearbyHawkers] = await Promise.all([
                ApiService.getUserProfile(userId),
                ApiService.getNearbyHawkers(latitude, longitude)
            ]);

            const userPreferences: UserPreferences = {
                favoriteCuisine: userProfile.preferences.favoriteCuisine,
                dietaryRestrictions: userProfile.preferences.dietaryRestrictions,
                priceRange: userProfile.preferences.priceRange,
                previousVisits: userProfile.statistics.previousVisits || []
            };

            // Calculate scores for each hawker center
            const scoredHawkers = nearbyHawkers.map(hawker => ({
                ...hawker,
                score: this.calculateScore(hawker, userPreferences)
            }));

            // Sort by score and return top recommendations
            return scoredHawkers
                .sort((a, b) => b.score - a.score)
                .slice(0, 5);
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    private static calculateScore(hawker: any, preferences: UserPreferences): number {
        const distanceScore = this.calculateDistanceScore(hawker.distance);
        const ratingScore = this.calculateRatingScore(hawker.rating);
        const cuisineScore = this.calculateCuisineScore(hawker.cuisineType, preferences.favoriteCuisine);
        const crowdScore = this.calculateCrowdScore(hawker.crowdLevel);

        return (
            distanceScore * this.DISTANCE_WEIGHT +
            ratingScore * this.RATING_WEIGHT +
            cuisineScore * this.CUISINE_MATCH_WEIGHT +
            crowdScore * this.CROWD_LEVEL_WEIGHT
        );
    }

    private static calculateDistanceScore(distance: string): number {
        const distanceNum = parseFloat(distance.replace(' km', ''));
        return Math.max(0, 1 - distanceNum / 5); // Normalize distance (0-5km)
    }

    private static calculateRatingScore(rating: string): number {
        return parseFloat(rating) / 5; // Normalize rating (0-5)
    }

    private static calculateCuisineScore(hawkerCuisine: string, preferredCuisine: string): number {
        return hawkerCuisine === preferredCuisine ? 1 : 0.5;
    }

    private static calculateCrowdScore(crowdLevel: string): number {
        const crowdScores = {
            'Low': 1,
            'Moderate': 0.6,
            'High': 0.3
        };
        return crowdScores[crowdLevel] || 0.5;
    }
}