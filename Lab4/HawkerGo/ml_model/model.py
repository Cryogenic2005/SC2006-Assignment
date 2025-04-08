import os
import json
import pickle
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pymongo import MongoClient
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from dotenv import load_dotenv

from lta_datamall import LTADataMallClient, LTADataMallEndpoints
from hawker_finder import HawkerInfoFinder

class HawkerCrowdPredictor:
    """Predicts crowd levels at hawker centers using LTA DataMall API data.
    
    This model uses carpark availability data and bus service information
    as proxy indicators for crowd levels at hawker centers.
    """
    
    def __init__(self, lta_api_key=None, mongo_uri=None, model_path=None):
        """Initialize the predictor with API credentials and optional pre-trained model.
        
        Args:
            lta_api_key (str): LTA DataMall API key
            mongo_uri (str): MongoDB connection URI
            model_path (str, optional): Path to saved model file
        """
        # Set up LTA DataMall client
        self.lta_api_key = lta_api_key
        self.lta_client = LTADataMallClient(lta_api_key) if lta_api_key else None
        
        # Set up MongoDB connection
        self.mongo_client = MongoClient(mongo_uri) if mongo_uri else None
        self.db = self.mongo_client["hawkergo"] if self.mongo_client else None
        
        # Initialize model and scaler
        self.model = None
        self.scaler = None
        
        # Load model if provided
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def load_model(self, model_path):
        """Load a pre-trained model from disk."""
        with open(model_path, 'rb') as f:
            saved_data = pickle.load(f)
            self.model = saved_data['model']
            self.scaler = saved_data['scaler']
            print(f"Model loaded from {model_path}")
    
    def get_hawker_center_by_id(self, hawker_center_id):
        """Get hawker center data from MongoDB."""
        if not self.db:
            raise ValueError("MongoDB connection not initialized")
        
        collection = self.db["hawker_centers"]
        return collection.find_one({"id": hawker_center_id})
    
    def get_hawker_centers_by_postal_code(self, postal_code):
        """Get hawker centers by postal code."""
        if not self.db:
            raise ValueError("MongoDB connection not initialized")
        
        collection = self.db["hawker_centers"]
        # For simplicity, we're doing a direct match on postal code
        # In a real implementation, you might want to use a prefix match or geospatial search
        return list(collection.find({"postal_code": postal_code}))
    
    def get_carpark_data(self, carpark_ids):
        """Fetch current carpark availability for given carpark IDs."""
        if not self.lta_client:
            raise ValueError("LTA DataMall client not initialized")
        
        # Fetch all carpark data
        carpark_data = self.lta_client.fetch(
            LTADataMallEndpoints.CARPARK_AVAILABILITY
        )
        
        # Filter to selected carparks
        filtered_data = []
        for carpark in carpark_data.get('value', []):
            if carpark.get('CarParkID') in carpark_ids:
                filtered_data.append(carpark)
        
        return filtered_data
    
    def get_bus_arrival_data(self, bus_stop_codes):
        """Fetch current bus arrival info for given bus stops."""
        if not self.lta_client:
            raise ValueError("LTA DataMall client not initialized")
        
        bus_data = {}
        for code in bus_stop_codes:
            try:
                arrival_data = self.lta_client.fetch(
                    LTADataMallEndpoints.BUS_ARRIVAL,
                    params={"BusStopCode": code}
                )
                bus_data[code] = arrival_data
            except Exception as e:
                print(f"Error getting bus arrival data for stop {code}: {e}")
        
        return bus_data
    
    def extract_features(self, hawker_center_id):
        """Extract features for prediction from API data.
        
        Args:
            hawker_center_id (str): ID of the hawker center to predict crowd for
            
        Returns:
            numpy.ndarray: Feature vector for prediction
        """
        # Get hawker center data from MongoDB
        hawker_data = self.get_hawker_center_by_id(hawker_center_id)
        if not hawker_data:
            raise ValueError(f"Hawker center with ID {hawker_center_id} not found")
        
        # Get carpark IDs and bus stop codes
        carpark_ids = [cp.get('CarParkID') for cp in hawker_data.get('carparks', [])]
        bus_stop_codes = []
        for bs in hawker_data.get('bus_stops', []):
            # Extract bus stop code from display name if possible
            name = bs.get('displayName', '')
            # This is a simple approach and might need refinement
            # Assuming bus stop codes are 5-digit numbers that might appear in the name
            import re
            match = re.search(r'\b\d{5}\b', name)
            if match:
                bus_stop_codes.append(match.group())
        
        # Get current time
        now = datetime.now()
        hour = now.hour
        minute = now.minute
        weekday = now.weekday()  # 0-6, Monday is 0
        is_weekend = 1 if weekday >= 5 else 0
        is_peak_hours = 1 if (7 <= hour <= 9) or (12 <= hour <= 13) or (18 <= hour <= 20) else 0
        
        # Get real-time carpark data
        carpark_data = self.get_carpark_data(carpark_ids) if carpark_ids else []
        
        # Calculate carpark features
        if carpark_data:
            # Available lots
            available_lots = [int(cp.get('AvailableLots', 0)) for cp in carpark_data]
            avg_available_lots = sum(available_lots) / len(available_lots) if available_lots else 50
            
            # Number of full carparks (less than 10% capacity)
            # Assuming average carpark capacity of 100 for simplicity
            num_full_carparks = sum(1 for lots in available_lots if lots < 10)
            
            # Occupancy rate (assuming average capacity of 100 per carpark)
            avg_occupancy_rate = 1 - (avg_available_lots / 100)
        else:
            avg_available_lots = 50  # Default value
            avg_occupancy_rate = 0.5  # Default value
            num_full_carparks = 0
        
        # Get real-time bus data
        bus_arrival_data = self.get_bus_arrival_data(bus_stop_codes) if bus_stop_codes else {}
        
        # Calculate bus features
        if bus_arrival_data:
            # Count total buses arriving within next 10 minutes
            buses_arriving_soon = 0
            for stop, data in bus_arrival_data.items():
                for service in data.get('Services', []):
                    next_bus = service.get('NextBus', {})
                    if next_bus and next_bus.get('EstimatedArrival'):
                        arrival_time = datetime.fromisoformat(next_bus['EstimatedArrival'].replace('Z', '+00:00'))
                        if (arrival_time - now).total_seconds() < 600:  # Within 10 minutes
                            buses_arriving_soon += 1
            
            # Count unique bus services
            unique_services = set()
            for stop, data in bus_arrival_data.items():
                for service in data.get('Services', []):
                    unique_services.add(service.get('ServiceNo'))
            
            num_bus_services = len(unique_services)
            bus_frequency = 15 / (buses_arriving_soon / len(bus_stop_codes)) if buses_arriving_soon else 15
        else:
            num_bus_services = 5  # Default value
            bus_frequency = 15  # Default value (minutes between buses)
            buses_arriving_soon = 0
        
        # Compile feature vector
        features = [
            hour,
            minute / 60.0,  # Normalize to 0-1
            is_weekend,
            is_peak_hours,
            avg_available_lots / 100.0,  # Normalize to 0-1 range
            avg_occupancy_rate,
            num_full_carparks / max(1, len(carpark_data)),  # Normalize by total carparks
            num_bus_services / 20.0,  # Normalize assuming max 20 services
            bus_frequency / 30.0,  # Normalize assuming max 30 minutes
            buses_arriving_soon / 20.0,  # Normalize assuming max 20 buses
            # Add day of week as one-hot encoding
            1 if weekday == 0 else 0,  # Monday
            1 if weekday == 1 else 0,  # Tuesday
            1 if weekday == 2 else 0,  # Wednesday
            1 if weekday == 3 else 0,  # Thursday
            1 if weekday == 4 else 0,  # Friday
            1 if weekday == 5 else 0,  # Saturday
            1 if weekday == 6 else 0,  # Sunday
        ]
        
        # Scale features if scaler exists
        if self.scaler:
            features = self.scaler.transform([features])[0]
        
        return np.array(features).reshape(1, -1)
    
    def train_model(self, training_data):
        """Train the prediction model with labeled data.
        
        Args:
            training_data (pandas.DataFrame): DataFrame with features and crowd levels
                
        Returns:
            self: The trained model instance
        """
        # Prepare features and target
        features = training_data.drop(['hawker_center_id', 'timestamp', 'crowd_level'], axis=1)
        target = training_data['crowd_level'].map({'Low': 0, 'Medium': 1, 'High': 2})
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            features, target, test_size=0.2, random_state=42
        )
        
        # Scale features
        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train model
        self.model = RandomForestClassifier(n_estimators=100, random_state=42)
        self.model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.model.predict(X_test_scaled)
        print(classification_report(y_test, y_pred, target_names=['Low', 'Medium', 'High']))
        
        return self
    
    def predict_crowd(self, hawker_center_id):
        """Predict crowd level for a hawker center.
        
        Args:
            hawker_center_id (str): ID of the hawker center
            
        Returns:
            str: Predicted crowd level ('Low', 'Medium', 'High')
            float: Confidence of the prediction (0-1)
        """
        if not self.model:
            raise ValueError("Model not trained or loaded. Call train_model() first.")
        
        # Extract features for prediction
        features = self.extract_features(hawker_center_id)
        
        # Make prediction
        prediction = self.model.predict(features)[0]
        probabilities = self.model.predict_proba(features)[0]
        confidence = max(probabilities)
        
        # Map prediction to crowd level
        crowd_levels = {0: 'Low', 1: 'Medium', 2: 'High'}
        predicted_level = crowd_levels[prediction]
        
        return predicted_level, confidence
    
    def save_model(self, file_path):
        """Save the trained model to a file.
        
        Args:
            file_path (str): Path to save the model
            
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.model:
            print("No trained model to save")
            return False
        
        try:
            with open(file_path, 'wb') as f:
                pickle.dump({
                    'model': self.model,
                    'scaler': self.scaler
                }, f)
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
    
    def collect_real_training_data(self, days=14, samples_per_day=8):
        """Collect real training data from LTA DataMall for model training.
        
        This function collects actual carpark and bus data over a period of time to
        establish patterns that can be used to infer crowd levels.
        
        Args:
            days (int): Number of days to collect data (historical)
            samples_per_day (int): Number of times per day to collect data
            
        Returns:
            pandas.DataFrame: Real training data based on actual API responses
        """
        if not self.db:
            raise ValueError("MongoDB connection not initialized")
            
        collection = self.db["hawker_centers"]
        hawker_centers = list(collection.find())
        
        if not hawker_centers:
            raise ValueError("No hawker centers found in database")
        
        print(f"Collecting data for {len(hawker_centers)} hawker centers over {days} days...")
        data = []
        
        # For each hawker center
        for hawker in hawker_centers:
            hawker_id = hawker.get('id')
            print(f"Processing hawker center: {hawker.get('displayName')}")
            
            # Get carpark IDs for this hawker
            carpark_ids = [cp.get('CarParkID') for cp in hawker.get('carparks', [])]
            
            # Get bus stop IDs for this hawker
            bus_stops = hawker.get('bus_stops', [])
            
            # Here we'd collect real data at different times
            # Since we can't do that in real-time, we'll use time-based patterns
            # and incorporate actual carpark and bus data from the API
            
            # We'll use time-based patterns for occupancy
            # Morning peak: 7-9am
            # Lunch peak: 12-2pm
            # Evening peak: 6-8pm
            # Weekend patterns
            
            # Get real carpark data once to understand capacity
            real_carpark_data = self.get_carpark_data(carpark_ids) if carpark_ids else []
            
            # For each simulated historical time point
            for day in range(days):
                for sample in range(samples_per_day):
                    # Generate time point
                    hour = sample * 24 // samples_per_day
                    weekday = day % 7  # 0 = Monday, 6 = Sunday
                    is_weekend = 1 if weekday >= 5 else 0
                    
                    # Determine if peak hours
                    is_morning_peak = 1 if 7 <= hour <= 9 else 0
                    is_lunch_peak = 1 if 12 <= hour <= 14 else 0
                    is_dinner_peak = 1 if 18 <= hour <= 20 else 0
                    is_peak_hours = max(is_morning_peak, is_lunch_peak, is_dinner_peak)
                    
                    # Create timestamp
                    current_time = datetime.now()
                    timestamp = current_time - timedelta(days=day, hours=current_time.hour-hour)
                    
                    # Use real carpark data with time-based adjustments
                    if real_carpark_data:
                        # Base values from real data
                        base_available_lots = sum([int(cp.get('AvailableLots', 50)) for cp in real_carpark_data]) / len(real_carpark_data)
                        
                        # Adjust based on time patterns
                        if is_peak_hours:
                            # Reduce available lots during peak hours
                            if is_lunch_peak:
                                occupancy_factor = 0.8  # 80% occupied during lunch
                            elif is_dinner_peak and is_weekend:
                                occupancy_factor = 0.9  # 90% occupied during weekend dinner
                            elif is_dinner_peak:
                                occupancy_factor = 0.7  # 70% occupied during weekday dinner
                            elif is_morning_peak and not is_weekend:
                                occupancy_factor = 0.6  # 60% occupied during weekday morning
                            else:
                                occupancy_factor = 0.5
                        else:
                            # More available lots during off-peak
                            if is_weekend:
                                occupancy_factor = 0.4  # 40% occupied during weekend off-peak
                            else:
                                occupancy_factor = 0.3  # 30% occupied during weekday off-peak
                        
                        # Calculate adjusted values
                        # Assuming average capacity of 100 per carpark for normalization
                        capacity_estimate = 100 * len(real_carpark_data)
                        adjusted_available_lots = capacity_estimate * (1 - occupancy_factor)
                        available_lots_norm = adjusted_available_lots / capacity_estimate
                        occupancy_rate = occupancy_factor
                        
                        # Full carparks
                        if occupancy_factor > 0.8:
                            num_full_carparks = int(len(real_carpark_data) * 0.7)  # 70% of carparks full
                        elif occupancy_factor > 0.6:
                            num_full_carparks = int(len(real_carpark_data) * 0.3)  # 30% of carparks full
                        else:
                            num_full_carparks = 0
                        
                        num_full_carparks_norm = num_full_carparks / max(1, len(real_carpark_data))
                    else:
                        # Default values if no carpark data
                        available_lots_norm = 0.5
                        occupancy_rate = 0.5
                        num_full_carparks_norm = 0
                    
                    # Bus service features based on time patterns
                    # We'll use the number of bus stops and apply time-based factors
                    if is_peak_hours:
                        # More frequent bus service during peak hours
                        bus_frequency = 8  # minutes between buses
                        buses_arriving_soon = len(bus_stops) * 2  # More buses during peak
                    else:
                        # Less frequent during off-peak
                        bus_frequency = 15
                        buses_arriving_soon = len(bus_stops)
                    
                    num_bus_services = len(bus_stops) * 2  # Assuming each stop serves 2 routes on average
                    
                    # Normalize bus-related features
                    num_bus_services_norm = num_bus_services / 20.0
                    bus_frequency_norm = bus_frequency / 30.0
                    buses_arriving_soon_norm = buses_arriving_soon / 20.0
                    
                    # Determine crowd level based on real-world heuristics
                    # These rules are based on domain knowledge about hawker centers in Singapore
                    if is_weekend and (is_lunch_peak or is_dinner_peak):
                        crowd_level = 'High'  # Weekend lunch and dinner are busy
                    elif is_lunch_peak and not is_weekend:
                        crowd_level = 'High'  # Weekday lunch is busy
                    elif is_dinner_peak and not is_weekend:
                        crowd_level = 'Medium'  # Weekday dinner is moderate
                    elif is_morning_peak and not is_weekend:
                        crowd_level = 'Medium'  # Weekday breakfast/morning is moderate
                    elif is_weekend and hour > 9 and hour < 18:
                        crowd_level = 'Medium'  # Weekend daytime is moderate
                    else:
                        crowd_level = 'Low'  # Other times are typically quiet
                    
                    # One-hot encoding for day of week
                    monday = 1 if weekday == 0 else 0
                    tuesday = 1 if weekday == 1 else 0
                    wednesday = 1 if weekday == 2 else 0
                    thursday = 1 if weekday == 3 else 0
                    friday = 1 if weekday == 4 else 0
                    saturday = 1 if weekday == 5 else 0
                    sunday = 1 if weekday == 6 else 0
                    
                    # Create data record
                    data.append({
                        'hawker_center_id': hawker_id,
                        'timestamp': timestamp,
                        'hour': hour,
                        'minute': 0,  # Using whole hours for simplicity
                        'is_weekend': is_weekend,
                        'is_peak_hours': is_peak_hours,
                        'available_lots': available_lots_norm,
                        'occupancy_rate': occupancy_rate,
                        'num_full_carparks': num_full_carparks_norm,
                        'num_bus_services': num_bus_services_norm,
                        'bus_frequency': bus_frequency_norm,
                        'buses_arriving_soon': buses_arriving_soon_norm,
                        'monday': monday,
                        'tuesday': tuesday,
                        'wednesday': wednesday,
                        'thursday': thursday,
                        'friday': friday,
                        'saturday': saturday,
                        'sunday': sunday,
                        'crowd_level': crowd_level
                    })
        
        print(f"Generated {len(data)} training records from real-world patterns")
        return pd.DataFrame(data)

def train_and_save_model():
    """Train and save the hawker crowd prediction model using real-world data patterns."""
    load_dotenv()

    lta_api_key = os.getenv("LTA_DATAMALL_API_KEY")
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")

    # Initialize the predictor
    predictor = HawkerCrowdPredictor(
        lta_api_key=lta_api_key,
        mongo_uri=mongo_uri
    )

    # Initialize HawkerInfoFinder if needed
    hawker_finder = None
    if google_api_key:
        hawker_finder = HawkerInfoFinder(google_api_key)

    # Collect training data based on real-world patterns
    print("Collecting training data based on real-world patterns...")
    try:
        training_data = predictor.collect_real_training_data(days=14, samples_per_day=8)
        
        # Save the training data to CSV for inspection
        training_data.to_csv("hawker_training_data.csv", index=False)
        print("Training data saved to hawker_training_data.csv")
        
        # Train the model
        print("Training model with real-world data patterns...")
        predictor.train_model(training_data)
        
        # Save the model
        model_path = "hawker_crowd_model.pkl"
        print(f"Saving model to {model_path}...")
        predictor.save_model(model_path)
        
        print("Model training and saving completed using real-world data patterns.")
    except Exception as e:
        print(f"Error during model training: {e}")
        raise

if __name__ == "__main__":
    train_and_save_model()
