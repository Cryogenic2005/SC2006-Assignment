from hawker_crowd_predictor import HawkerCrowdPredictor
import pandas as pd
import os
from datetime import datetime

def main():
    # Replace with your LTA DataMall API key
    API_KEY = "your_api_key_here"
    
    # Initialize the model
    model_path = "hawker_crowd_model.pkl"
    predictor = HawkerCrowdPredictor(API_KEY, model_path)
    
    # If model doesn't exist, we'll train a new one
    if not os.path.exists(model_path):
        print("Training new model...")
        
        # Define hawker centers with their mappings to carparks and bus stops
        # This information would typically come from a database or configuration file
        hawker_centers_data = {
            "HC001": {  # Old Airport Road Food Centre
                "name": "Old Airport Road Food Centre",
                "carparks": ["CP001", "CP002"],  # Nearby carpark IDs
                "bus_stops": ["83059", "83051"]  # Nearby bus stop codes
            },
            "HC002": {  # Maxwell Food Centre
                "name": "Maxwell Food Centre",
                "carparks": ["CP003", "CP004"],
                "bus_stops": ["03223", "03239"]
            },
            "HC003": {  # Tekka Centre
                "name": "Tekka Centre",
                "carparks": ["CP005"],
                "bus_stops": ["08057", "08069"]
            }
        }
        
        # Update the mappings in the model
        predictor.update_mappings(hawker_centers_data)
        
        # Generate synthetic training data (since we don't have real labeled data)
        print("Generating synthetic training data...")
        hawker_centers = list(hawker_centers_data.keys())
        training_data = predictor.generate_synthetic_training_data(hawker_centers, num_samples=2000)
        
        # Train the model
        print("Training model...")
        predictor.train_model(training_data)
        
        # Save the model
        print("Saving model...")
        predictor.save_model(model_path)
    
    # Predict crowd level for a specific hawker center
    hawker_center_id = "HC001"  # Old Airport Road Food Centre
    print(f"\nPredicting crowd level for {hawker_center_id}...")
    
    level, confidence = predictor.predict_crowd(hawker_center_id)
    
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"Current time: {current_time}")
    print(f"Predicted crowd level: {level} (confidence: {confidence:.2f})")
    
    # Get crowd levels for all hawker centers
    print("\nPredicting crowd levels for all hawker centers...")
    results = []
    
    for hc_id in predictor.hawker_center_mapping.keys():
        level, confidence = predictor.predict_crowd(hc_id)
        hc_name = predictor.hawker_center_mapping[hc_id].get('name', hc_id)
        
        results.append({
            'hawker_center_id': hc_id,
            'name': hc_name,
            'crowd_level': level,
            'confidence': confidence
        })
    
    # Display results in a table
    results_df = pd.DataFrame(results)
    print(results_df)

if __name__ == "__main__":
    main()