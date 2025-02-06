import { Observable } from '@nativescript/core';

export class ProfileViewModel extends Observable {
    private _userData: any;

    constructor() {
        super();
        this.loadUserData();
    }

    get profileImage(): string {
        return this._userData.profileImage;
    }

    get userName(): string {
        return this._userData.name;
    }

    get userEmail(): string {
        return this._userData.email;
    }

    get favoriteCuisine(): string {
        return this._userData.preferences.favoriteCuisine;
    }

    get dietaryRestrictions(): string {
        return this._userData.preferences.dietaryRestrictions;
    }

    get priceRange(): string {
        return this._userData.preferences.priceRange;
    }

    get totalVisits(): number {
        return this._userData.statistics.totalVisits;
    }

    get reviewsGiven(): number {
        return this._userData.statistics.reviewsGiven;
    }

    get loyaltyPoints(): number {
        return this._userData.statistics.loyaltyPoints;
    }

    private loadUserData() {
        // Mock data - will be replaced with real API calls
        this._userData = {
            profileImage: "https://i.pravatar.cc/300",
            name: "John Doe",
            email: "john.doe@example.com",
            preferences: {
                favoriteCuisine: "Chinese",
                dietaryRestrictions: "None",
                priceRange: "$5-$10"
            },
            statistics: {
                totalVisits: 42,
                reviewsGiven: 15,
                loyaltyPoints: 350
            }
        };
        
        this.notifyPropertyChange('profileImage', this._userData.profileImage);
        this.notifyPropertyChange('userName', this._userData.name);
        this.notifyPropertyChange('userEmail', this._userData.email);
        this.notifyPropertyChange('favoriteCuisine', this._userData.preferences.favoriteCuisine);
        this.notifyPropertyChange('dietaryRestrictions', this._userData.preferences.dietaryRestrictions);
        this.notifyPropertyChange('priceRange', this._userData.preferences.priceRange);
        this.notifyPropertyChange('totalVisits', this._userData.statistics.totalVisits);
        this.notifyPropertyChange('reviewsGiven', this._userData.statistics.reviewsGiven);
        this.notifyPropertyChange('loyaltyPoints', this._userData.statistics.loyaltyPoints);
    }

    onEditPreferences() {
        // To be implemented
        console.log("Edit preferences tapped");
    }

    onSignOut() {
        // To be implemented
        console.log("Sign out tapped");
    }
}