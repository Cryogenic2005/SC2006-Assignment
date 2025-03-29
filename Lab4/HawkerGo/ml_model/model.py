import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import pickle
import os
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

class HawkerCrowdPredictor:
    """Predicts crowd levels at hawker centers using LTA DataMall API data.
    
    This model uses carpark availability data and bus service information
    as proxy indicators for crowd levels at hawker centers.
    """
    
    def __init__(self, api_key, model_path=None):
        """Initialize the predictor with API credentials and optional pre-trained model.
        
        Args:
            api_key (str): LTA DataMall API key
            model_path (str, optional): Path to saved model file
        """
        self.api_key = api_key
        self.base_url = "https://datamall2.mytransport.sg/ltaodataservice"
        self.headers = {
            'AccountKey': self.api_key,
            'accept': 'application/json'
        }
        self.model = None
        self.scaler = None
        
        # Load model if provided
        if model_path and os.path.exists(model_path):
            with open(model_path, 'rb') as f:
                saved_data = pickle.load(f)
                self.model = saved_data['model']
                self.scaler = saved_data['scaler']
                self.hawker_center_mapping = saved_data.get('hawker_center_mapping', {})
                self.carpark_mapping = saved_data.get('carpark_mapping', {})
                self.bus_stop_mapping = saved_data.get('bus_stop_mapping', {})
        else:
            # Initialize mappings for hawker centers to nearby carparks and bus stops
            # These would ideally be loaded from a database or configuration file
            self.hawker_center_mapping = {}
            self.carpark_mapping = {}
            self.bus_stop_mapping = {}
            
    def _get_carpark_data(self, carpark_ids=None):
        """Fetch carpark availability data from LTA DataMall.
        
        Args:
            carpark_ids (list, optional): List of carpark IDs to filter by
            
        Returns:
            pandas.DataFrame: Carpark availability data
        """
        endpoint = f"{self.base_url}/CarParkAvailabilityv2"
        carpark_data = []
        
        # DataMall API has a limit of 500 records per request
        skip = 0
        while True:
            params = {'$skip': skip}
            response = requests.get(endpoint, headers=self.headers, params=params)
            
            if response.status_code != 200:
                print(f"Error fetching carpark data: {response.status_code}")
                break
                
            data = response.json().get('value', [])
            if not data:
                break
                
            carpark_data.extend(data)
            skip += 500
            
            # Stop if we've fetched all available data
            if len(data) < 500:
                break
        
        df = pd.DataFrame(carpark_data)
        
        # Filter by carpark IDs if provided
        if carpark_ids:
            df = df[df['CarParkID'].isin(carpark_ids)]
            
        # Convert data types
        if not df.empty:
            df['AvailableLots'] = pd.to_numeric(df['AvailableLots'], errors='coerce')
            df['Location'] = df['Location'].fillna('')
            
            # Split location into latitude and longitude
            df[['Latitude', 'Longitude']] = df['Location'].str.extract(r'([\d\.]+)\s*([\d\.]+)', expand=True)
            df['Latitude'] = pd.to_numeric(df['Latitude'], errors='coerce')
            df['Longitude'] = pd.to_numeric(df['Longitude'], errors='coerce')
            
        return df
    
    def _get_bus_services(self, bus_stop_codes=None):
        """Fetch bus service data from LTA DataMall.
        
        Args:
            bus_stop_codes (list, optional): List of bus stop codes to filter by
            
        Returns:
            pandas.DataFrame: Bus service data
        """
        endpoint = f"{self.base_url}/BusServices"
        bus_data = []
        
        skip = 0
        while True:
            params = {'$skip': skip}
            response = requests.get(endpoint, headers=self.headers, params=params)
            
            if response.status_code != 200:
                print(f"Error fetching bus service data: {response.status_code}")
                break
                
            data = response.json().get('value', [])
            if not data:
                break
                
            bus_data.extend(data)
            skip += 500
            
            if len(data) < 500:
                break
        
        return pd.DataFrame(bus_data)
    
    def _get_bus_stops(self, bus_stop_codes=None):
        """Fetch bus stop data from LTA DataMall.
        
        Args:
            bus_stop_codes (list, optional): List of bus stop codes to filter by
            
        Returns:
            pandas.DataFrame: Bus stop data
        """
        endpoint = f"{self.base_url}/BusStops"
        bus_stop_data = []
        
        skip = 0
        while True:
            params = {'$skip': skip}
            response = requests.get(endpoint, headers=self.headers, params=params)
            
            if response.status_code != 200:
                print(f"Error fetching bus stop data: {response.status_code}")
                break
                
            data = response.json().get('value', [])
            if not data:
                break
                
            bus_stop_data.extend(data)
            skip += 500
            
            if len(data) < 500:
                break
        
        df = pd.DataFrame(bus_stop_data)
        
        # Filter by bus stop codes if provided
        if bus_stop_codes:
            df = df[df['BusStopCode'].isin(bus_stop_codes)]
            
        return df
    
    def extract_features(self, hawker_center_id):
        """Extract features for prediction from API data.
        
        Args:
            hawker_center_id (str): ID of the hawker center to predict crowd for
            
        Returns:
            numpy.ndarray: Feature vector for prediction
        """
        features = []
        
        # Get relevant carparks and bus stops for this hawker center
        relevant_carparks = self.hawker_center_mapping.get(hawker_center_id, {}).get('carparks', [])
        relevant_bus_stops = self.hawker_center_mapping.get(hawker_center_id, {}).get('bus_stops', [])
        
        # Get current time
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()  # 0-6, Monday is 0
        is_weekend = 1 if weekday >= 5 else 0
        is_peak_hours = 1 if (7 <= hour <= 9) or (12 <= hour <= 13) or (18 <= hour <= 20) else 0
        
        # Get carpark data
        carpark_df = self._get_carpark_data(relevant_carparks)
        
        # Calculate carpark features
        if not carpark_df.empty:
            # Average available lots across all relevant carparks
            avg_available_lots = carpark_df['AvailableLots'].mean()
            
            # Calculate occupancy rate (would need total capacity for accurate measure)
            # For now, use a placeholder assuming 100 total spaces per carpark
            avg_occupancy_rate = 1 - (avg_available_lots / 100)
            
            # Number of full carparks
            num_full_carparks = sum(carpark_df['AvailableLots'] < 10)
        else:
            avg_available_lots = 50  # Default value
            avg_occupancy_rate = 0.5  # Default value
            num_full_carparks = 0
            
        # Get bus stop data
        bus_stops_df = self._get_bus_stops(relevant_bus_stops)
        bus_services_df = self._get_bus_services()
        
        # Calculate bus service features
        if not bus_stops_df.empty and not bus_services_df.empty:
            # Count unique bus services serving this hawker center
            num_bus_services = len(bus_services_df)
            
            # Use frequency metrics as proxy for potential passenger volume
            if is_peak_hours:
                if is_weekend:
                    # Weekend peak hours might not be properly represented in the data
                    # Using weekday metrics as approximation
                    bus_frequency = self._calculate_avg_frequency(bus_services_df, 'AM_Peak_Freq')
                else:
                    # Weekday peak hours
                    if 7 <= hour <= 9:
                        bus_frequency = self._calculate_avg_frequency(bus_services_df, 'AM_Peak_Freq')
                    else:  # evening peak
                        bus_frequency = self._calculate_avg_frequency(bus_services_df, 'PM_Peak_Freq')
            else:
                # Off-peak hours
                if 5 <= hour < 17:
                    bus_frequency = self._calculate_avg_frequency(bus_services_df, 'AM_Offpeak_Freq')
                else:
                    bus_frequency = self._calculate_avg_frequency(bus_services_df, 'PM_Offpeak_Freq')
        else:
            num_bus_services = 5  # Default value
            bus_frequency = 15  # Default value (minutes between buses)
        
        # Compile feature vector
        features = [
            hour,
            is_weekend,
            is_peak_hours,
            avg_available_lots,
            avg_occupancy_rate,
            num_full_carparks,
            num_bus_services,
            bus_frequency,
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
    
    def _calculate_avg_frequency(self, bus_df, freq_col):
        """Calculate average bus frequency from the frequency range.
        
        Args:
            bus_df (pandas.DataFrame): Bus service data
            freq_col (str): Column name for frequency data
            
        Returns:
            float: Average frequency in minutes
        """
        # Convert frequency ranges (e.g., "10-15") to average values
        def extract_avg_frequency(freq_range):
            try:
                if pd.isna(freq_range) or not freq_range:
                    return 15  # Default value
                
                parts = freq_range.split('-')
                if len(parts) == 2:
                    return (float(parts[0]) + float(parts[1])) / 2
                else:
                    return float(parts[0])
            except:
                return 15  # Default value
        
        frequencies = bus_df[freq_col].apply(extract_avg_frequency)
        return frequencies.mean() if not frequencies.empty else 15
    
    def train_model(self, training_data):
        """Train the prediction model with labeled data.
        
        Args:
            training_data (pandas.DataFrame): DataFrame with features and crowd levels
                Expected columns:
                - hawker_center_id
                - timestamp
                - carpark_available_lots
                - carpark_occupancy_rate
                - num_full_carparks
                - num_bus_services
                - bus_frequency
                - crowd_level (target): 'Low', 'Medium', 'High'
                
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
                    'scaler': self.scaler,
                    'hawker_center_mapping': self.hawker_center_mapping,
                    'carpark_mapping': self.carpark_mapping,
                    'bus_stop_mapping': self.bus_stop_mapping
                }, f)
            return True
        except Exception as e:
            print(f"Error saving model: {e}")
            return False
            
    def generate_synthetic_training_data(self, hawker_centers, num_samples=1000):
        """Generate synthetic data for training when real labeled data is unavailable.
        
        Args:
            hawker_centers (list): List of hawker center IDs
            num_samples (int): Number of synthetic samples to generate
            
        Returns:
            pandas.DataFrame: Synthetic training data
        """
        # Create a DataFrame for synthetic data
        data = []
        
        # Generate timestamps spanning different days and times
        start_date = datetime.now() - timedelta(days=30)
        end_date = datetime.now()
        
        # Generate random timestamps
        timestamps = [start_date + timedelta(
            days=np.random.randint(0, 30),
            hours=np.random.randint(0, 24),
            minutes=np.random.randint(0, 60)
        ) for _ in range(num_samples)]
        
        for i in range(num_samples):
            timestamp = timestamps[i]
            hawker_center_id = np.random.choice(hawker_centers)
            
            # Time-based features
            hour = timestamp.hour
            weekday = timestamp.weekday()
            is_weekend = 1 if weekday >= 5 else 0
            is_peak_hours = 1 if (7 <= hour <= 9) or (12 <= hour <= 13) or (18 <= hour <= 20) else 0
            
            # Generate more realistic data based on time patterns
            # Carpark features
            if is_peak_hours:
                # Busier during peak hours
                available_lots = np.random.randint(5, 30)
                occupancy_rate = np.random.uniform(0.7, 0.95)
                num_full_carparks = np.random.randint(0, 3)
            elif is_weekend:
                # Weekends are generally busy
                available_lots = np.random.randint(10, 40)
                occupancy_rate = np.random.uniform(0.6, 0.9)
                num_full_carparks = np.random.randint(0, 2)
            else:
                # Off-peak times
                available_lots = np.random.randint(30, 80)
                occupancy_rate = np.random.uniform(0.2, 0.6)
                num_full_carparks = 0
            
            # Bus service features
            num_bus_services = np.random.randint(5, 15)
            
            if is_peak_hours:
                # Buses come more frequently during peak hours
                bus_frequency = np.random.uniform(5, 10)
            else:
                bus_frequency = np.random.uniform(10, 20)
            
            # Determine crowd level based on features
            # This is a simplistic model; in reality, would need domain knowledge
            crowd_score = (
                (0.3 * (1 - available_lots/100)) +  # Higher occupancy = higher score
                (0.3 * occupancy_rate) +
                (0.1 * num_full_carparks) +
                (0.1 * (1 - bus_frequency/20)) +  # Lower frequency = higher score
                (0.2 * is_peak_hours) +
                (0.1 * is_weekend)
            )
            
            if crowd_score > 0.7:
                crowd_level = 'High'
            elif crowd_score > 0.4:
                crowd_level = 'Medium'
            else:
                crowd_level = 'Low'
            
            # Add some randomness to crowd levels for more realistic data
            if np.random.random() < 0.1:  # 10% chance of unexpected crowd level
                crowd_level = np.random.choice(['Low', 'Medium', 'High'])
            
            data.append({
                'hawker_center_id': hawker_center_id,
                'timestamp': timestamp,
                'hour': hour,
                'weekday': weekday,
                'is_weekend': is_weekend,
                'is_peak_hours': is_peak_hours,
                'carpark_available_lots': available_lots,
                'carpark_occupancy_rate': occupancy_rate,
                'num_full_carparks': num_full_carparks,
                'num_bus_services': num_bus_services,
                'bus_frequency': bus_frequency,
                'crowd_level': crowd_level
            })
        
        return pd.DataFrame(data)
        
    def update_mappings(self, hawker_centers_data):
        """Update the mappings between hawker centers, carparks, and bus stops.
        
        Args:
            hawker_centers_data (dict): Dictionary of hawker center data with mappings
            
        Returns:
            self: The updated model instance
        """
        self.hawker_center_mapping = hawker_centers_data
        return self