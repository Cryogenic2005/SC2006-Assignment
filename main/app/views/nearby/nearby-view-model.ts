import { Observable } from '@nativescript/core';
import { ApiService } from '../../services/api.service';
import { LocationService, LocationData } from '../../services/location.service';

export class NearbyViewModel extends Observable {
    private locationService: LocationService;
    private _currentLocation: LocationData | null = null;
    private _nearbyHawkers: Array<any> = [];
    private updateInterval: number;

    constructor() {
        super();
        this.locationService = LocationService.getInstance();
        this.setupLocationBinding();
        this.initializeLocation();
        this.startPeriodicUpdates();
    }

    get currentLocation(): string {
        return this._currentLocation 
            ? `${this._currentLocation.latitude.toFixed(4)}, ${this._currentLocation.longitude.toFixed(4)}`
            : "Fetching location...";
    }

    get nearbyHawkers(): Array<any> {
        return this._nearbyHawkers;
    }

    private setupLocationBinding() {
        this.locationService.on(Observable.propertyChangeEvent, (propertyChangeData: any) => {
            if (propertyChangeData.propertyName === 'currentLocation') {
                this._currentLocation = propertyChangeData.value;
                this.notifyPropertyChange('currentLocation', this.currentLocation);
                this.updateNearbyHawkers();
            }
        });
    }

    private async initializeLocation() {
        try {
            const hasPermission = await this.locationService.requestPermissions();
            if (hasPermission) {
                this._currentLocation = await this.locationService.getCurrentLocation();
                this.notifyPropertyChange('currentLocation', this.currentLocation);
                await this.updateNearbyHawkers();
            }
        } catch (error) {
            console.error('Error initializing location:', error);
        }
    }

    private async updateNearbyHawkers() {
        if (!this._currentLocation) return;

        try {
            const hawkers = await ApiService.getNearbyHawkers(
                this._currentLocation.latitude,
                this._currentLocation.longitude
            );

            this._nearbyHawkers = hawkers.map(hawker => ({
                ...hawker,
                distance: this.locationService.formatDistance(
                    this.locationService.calculateDistance(
                        this._currentLocation!.latitude,
                        this._currentLocation!.longitude,
                        hawker.latitude,
                        hawker.longitude
                    )
                ),
                onGetDirections: () => this.getDirections(hawker.latitude, hawker.longitude)
            }));

            this.notifyPropertyChange('nearbyHawkers', this._nearbyHawkers);
        } catch (error) {
            console.error('Error updating nearby hawkers:', error);
        }
    }

    private startPeriodicUpdates() {
        this.updateInterval = setInterval(() => {
            this.updateNearbyHawkers();
        }, 5 * 60 * 1000); // Update every 5 minutes
    }

    getDirections(latitude: number, longitude: number) {
        const coordinates = `${latitude},${longitude}`;
        Utils.openUrl(`https://www.google.com/maps/dir/?api=1&destination=${coordinates}`);
    }

    onUnloaded() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
    }
}