import { Geolocation } from '@nativescript/geolocation';
import { Observable } from '@nativescript/core';

export class LocationService extends Observable {
    private static instance: LocationService;
    private _currentLocation: LocationData | null = null;
    private watchId: number;

    private constructor() {
        super();
        this.startLocationUpdates();
    }

    static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    get currentLocation(): LocationData | null {
        return this._currentLocation;
    }

    async requestPermissions(): Promise<boolean> {
        try {
            const hasPermission = await Geolocation.hasPermission();
            if (!hasPermission) {
                return await Geolocation.requestPermission();
            }
            return true;
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            return false;
        }
    }

    async getCurrentLocation(): Promise<LocationData> {
        try {
            const location = await Geolocation.getCurrentLocation({
                desiredAccuracy: 3,
                maximumAge: 5000,
                timeout: 10000
            });

            this._currentLocation = {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: new Date()
            };

            this.notifyPropertyChange('currentLocation', this._currentLocation);
            return this._currentLocation;
        } catch (error) {
            console.error('Error getting current location:', error);
            throw error;
        }
    }

    calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    formatDistance(distance: number): string {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        }
        return `${distance.toFixed(1)}km`;
    }

    private startLocationUpdates() {
        this.watchId = Geolocation.watchLocation(
            (location) => {
                this._currentLocation = {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timestamp: new Date()
                };
                this.notifyPropertyChange('currentLocation', this._currentLocation);
            },
            (error) => {
                console.error('Error watching location:', error);
            },
            {
                desiredAccuracy: 3,
                updateDistance: 10,
                minimumUpdateTime: 1000 * 60 // Update every minute
            }
        );
    }

    stopLocationUpdates() {
        if (this.watchId) {
            Geolocation.clearWatch(this.watchId);
        }
    }

    private toRad(degrees: number): number {
        return degrees * Math.PI / 180;
    }
}

export interface LocationData {
    latitude: number;
    longitude: number;
    timestamp: Date;
}