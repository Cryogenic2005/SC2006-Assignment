import { Observable } from '@nativescript/core';
import { ApiService } from '../../services/api.service';
import { RecommendationService } from '../../services/recommendation.service';
import { LocationService } from '../../services/location.service';

export class DiscoverViewModel extends Observable {
    private locationService: LocationService;
    private _hawkerCenters: Array<any>;
    private _recommendations: Array<any>;
    private readonly userId = 'current-user-id'; // Replace with actual user ID from auth

    constructor() {
        super();
        this.locationService = LocationService.getInstance();
        this.loadHawkerCenters();
        this.loadRecommendations();
    }

    get hawkerCenters(): Array<any> {
        return this._hawkerCenters;
    }

    get recommendations(): Array<any> {
        return this._recommendations;
    }

    async loadHawkerCenters() {
        try {
            const location = await this.locationService.getCurrentLocation();
            this._hawkerCenters = await ApiService.getHawkerCenters();
            
            // Add distance to each hawker center
            this._hawkerCenters = this._hawkerCenters.map(hawker => ({
                ...hawker,
                distance: this.locationService.formatDistance(
                    this.locationService.calculateDistance(
                        location.latitude,
                        location.longitude,
                        hawker.latitude,
                        hawker.longitude
                    )
                )
            }));

            this.notifyPropertyChange('hawkerCenters', this._hawkerCenters);
        } catch (error) {
            console.error('Error loading hawker centers:', error);
            // Fallback to mock data
            this._hawkerCenters = [
                {
                    name: "Maxwell Food Centre",
                    address: "1 Kadayanallur St, Singapore 069184",
                    crowdLevel: "Moderate",
                    distance: "0.5 km",
                    rating: "4.5",
                    cuisineType: "Chinese"
                },
                {
                    name: "Amoy Street Food Centre",
                    address: "7 Maxwell Road, Singapore 069111",
                    crowdLevel: "Low",
                    distance: "0.8 km",
                    rating: "4.3",
                    cuisineType: "Mixed"
                }
            ];
            this.notifyPropertyChange('hawkerCenters', this._hawkerCenters);
        }
    }

    async loadRecommendations() {
        try {
            const location = await this.locationService.getCurrentLocation();
            this._recommendations = await RecommendationService.getPersonalizedRecommendations(
                this.userId,
                location.latitude,
                location.longitude
            );
            this.notifyPropertyChange('recommendations', this._recommendations);
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this._recommendations = [];
            this.notifyPropertyChange('recommendations', this._recommendations);
        }
    }
}