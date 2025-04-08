from flask import Flask, request, jsonify
import os
from dotenv import load_dotenv
from model import HawkerCrowdPredictor

# Load environment variables
load_dotenv()

# Get LTA API key from environment
LTA_API_KEY = os.getenv('LTA_API_KEY')

# Initialize Flask app
app = Flask(__name__)

# Initialize model
model_path = "hawker_crowd_model.pkl"
predictor = None

def init_model():
    global predictor
    predictor = HawkerCrowdPredictor(LTA_API_KEY, model_path)
    
    # If model doesn't exist, we'll train a new one
    if not os.path.exists(model_path):
        print("Training new model...")
        
        # Define hawker centers with their mappings to carparks and bus stops
        hawker_centers_data = {
            "HC001": {  # Old Airport Road Food Centre
                "name": "Old Airport Road Food Centre",
                "carparks": ["CP001", "CP002"],
                "bus_stops": ["83059", "83051"]
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
        
        # Generate synthetic training data
        print("Generating synthetic training data...")
        hawker_centers = list(hawker_centers_data.keys())
        training_data = predictor.generate_synthetic_training_data(hawker_centers, num_samples=2000)
        
        # Train the model
        print("Training model...")
        predictor.train_model(training_data)
        
        # Save the model
        print("Saving model...")
        predictor.save_model(model_path)

# Initialize model at startup
init_model()

@app.route('/predict/<hawker_id>', methods=['GET'])
def predict_crowd(hawker_id):
    """
    Predict crowd level for a specific hawker center
    """
    try:
        level, confidence = predictor.predict_crowd(hawker_id)
        return jsonify({
            'hawker_id': hawker_id,
            'hawker_name': predictor.hawker_center_mapping.get(hawker_id, {}).get('name', hawker_id),
            'crowd_level': level,
            'confidence': float(confidence),
            'source': 'ml_prediction'
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict/all', methods=['GET'])
def predict_all_crowds():
    """
    Predict crowd levels for all hawker centers
    """
    try:
        results = []
        
        for hc_id in predictor.hawker_center_mapping.keys():
            level, confidence = predictor.predict_crowd(hc_id)
            hc_name = predictor.hawker_center_mapping[hc_id].get('name', hc_id)
            
            results.append({
                'hawker_id': hc_id,
                'hawker_name': hc_name,
                'crowd_level': level,
                'confidence': float(confidence),
                'source': 'ml_prediction'
            })
            
        return jsonify(results)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/update-mappings', methods=['POST'])
def update_mappings():
    """
    Update the hawker center to carpark/bus stop mappings
    """
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        predictor.update_mappings(data)
        predictor.save_model(model_path)
        
        return jsonify({'message': 'Mappings updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({'status': 'healthy', 'model_loaded': predictor is not None})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)