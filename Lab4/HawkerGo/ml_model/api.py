import os
import time
import random
import hashlib
from datetime import datetime

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient
from geopy.distance import geodesic

from model import HawkerCrowdPredictor

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize MongoDB connection
mongo_uri = os.getenv("MONGO_DB", "mongodb://localhost:27017/")
mongo_client = MongoClient(mongo_uri)
db = mongo_client["hawkergo"]

# Initialize HawkerCrowdPredictor
lta_api_key = os.getenv("LTA_DATAMALL_API_KEY")
model_path = "hawker_crowd_model.pkl"
try:
    predictor = HawkerCrowdPredictor(
        lta_api_key=lta_api_key,
        mongo_uri=mongo_uri,
        model_path=model_path
    )
    if not os.path.exists(model_path):
        print(f"Warning: Model file {model_path} not found. Running train_and_save_model...")
        from model import train_and_save_model
        train_and_save_model()
except Exception as e:
    print(f"Error initializing predictor: {e}")
    predictor = None

@app.route('/api/hawkers', methods=['GET'])
def get_hawkers():
    """Get all hawker centers or filter by postal code."""
    postal_code = request.args.get('postal_code')

    if postal_code:
        # Filter hawkers by postal code prefix (first 2 digits)
        postal_prefix = postal_code[:2] if len(postal_code) >= 2 else postal_code
        query = {"postal_code": {"$regex": f"^{postal_prefix}"}}
        hawkers = list(db["hawker_centers"].find(query, {"_id": 0}))
    else:
        # Get all hawkers
        hawkers = list(db["hawker_centers"].find({}, {"_id": 0}))

    return jsonify(hawkers)

@app.route('/api/hawkers/nearby', methods=['GET'])
def get_nearby_hawkers():
    """Get hawker centers near a given location."""
    try:
        latitude = float(request.args.get('latitude'))
        longitude = float(request.args.get('longitude'))
        radius = float(request.args.get('radius', 2000))  # Default 2km radius
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid location parameters"}), 400

    # Get all hawkers
    hawkers = list(db["hawker_centers"].find({}, {"_id": 0}))

    # Calculate distance and filter by radius
    nearby_hawkers = []
    for hawker in hawkers:
        hawker_lat = hawker.get('latitude')
        hawker_lng = hawker.get('longitude')

        if hawker_lat is not None and hawker_lng is not None:
            distance = geodesic(
                (latitude, longitude),
                (hawker_lat, hawker_lng)
            ).meters

            if distance <= radius:
                hawker['distance'] = round(distance)
                nearby_hawkers.append(hawker)

    # Sort by distance
    nearby_hawkers.sort(key=lambda x: x.get('distance', float('inf')))

    return jsonify(nearby_hawkers)

@app.route('/api/hawkers/<hawker_id>/crowd', methods=['GET'])
def get_hawker_crowd(hawker_id):
    """Get crowd level prediction for a hawker center."""
    if predictor is None:
        return jsonify({"error": "Predictor not initialized"}), 500
        
    try:
        level, confidence = predictor.predict_crowd(hawker_id)
        return jsonify({
            "hawker_id": hawker_id,
            "crowd_level": level,
            "confidence": confidence,
            "timestamp": time.time()
        })
    except Exception as e:
        print(f"Error predicting crowd for hawker {hawker_id}: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/hawkers/batch-crowd', methods=['POST'])
def get_batch_crowd():
    """Get crowd level predictions for multiple hawker centers."""
    if predictor is None:
        return jsonify({"error": "Predictor not initialized"}), 500
        
    data = request.get_json()

    if not data or not isinstance(data, dict) or 'hawker_ids' not in data:
        return jsonify({"error": "Invalid request. Expected 'hawker_ids' array."}), 400

    hawker_ids = data.get('hawker_ids', [])
    results = []

    for hawker_id in hawker_ids:
        try:
            # Get hawker name if available
            hawker = db["hawker_centers"].find_one({"id": hawker_id})
            hawker_name = hawker.get("displayName", "Unknown") if hawker else "Unknown"
            
            level, confidence = predictor.predict_crowd(hawker_id)
            results.append({
                "hawker_id": hawker_id,
                "hawker_name": hawker_name,
                "crowd_level": level,
                "confidence": confidence
            })
        except Exception as e:
            print(f"Error predicting for hawker {hawker_id}: {str(e)}")
            results.append({
                "hawker_id": hawker_id,
                "hawker_name": "Unknown",
                "error": str(e)
            })

    return jsonify({
        "results": results,
        "timestamp": time.time()
    })

@app.route('/api/postal-codes', methods=['GET'])
def get_postal_codes():
    """Get all unique postal codes with hawker centers."""
    postal_codes = db["hawker_centers"].distinct("postal_code")

    # Filter out None values
    postal_codes = [code for code in postal_codes if code is not None]

    return jsonify(postal_codes)

# ADDED ROUTES TO MATCH ML_SERVICE.JS

@app.route('/predict/<hawker_id>', methods=['GET'])
def predict_crowd(hawker_id):
    """Get crowd level prediction for a hawker center (endpoint for mlService.js)."""
    if predictor is None:
        # Use consistent mock prediction strategy
        # Import everything upfront before any operations
        import random
        import hashlib
        import time as time_module

        # Create hash-based seed for consistent randomness
        hash_obj = hashlib.md5(hawker_id.encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        random.seed(hash_int)

        # Levels and their probabilities
        levels = ['Low', 'Medium', 'High']
        level_weights = [0.4, 0.4, 0.2]  # More low and medium, less high

        # Get current time for context-aware prediction
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()
        is_weekend = weekday >= 5

        # Adjust prediction based on time of day
        if is_weekend and (11 <= hour <= 14 or 17 <= hour <= 20):
            # Weekend lunch/dinner - more likely to be high
            level_weights = [0.1, 0.3, 0.6]
        elif not is_weekend and (11 <= hour <= 14):
            # Weekday lunch - medium to high
            level_weights = [0.2, 0.5, 0.3]
        elif 17 <= hour <= 20:
            # Dinner time - more medium
            level_weights = [0.2, 0.6, 0.2]

        # Choose level based on weighted random selection
        level = random.choices(levels, weights=level_weights)[0]

        # Generate consistent confidence based on hawker ID
        confidence = 0.5 + (hash_int % 50) / 100.0  # 0.5 to 1.0

        return jsonify({
            "hawker_id": hawker_id,
            "crowd_level": level,
            "confidence": confidence,
            "timestamp": time_module.time(),
            "source": "mock_prediction"
        })

    try:
        level, confidence = predictor.predict_crowd(hawker_id)
        return jsonify({
            "hawker_id": hawker_id,
            "crowd_level": level,
            "confidence": confidence,
            "timestamp": time.time()
        })
    except Exception as e:
        print(f"Error predicting crowd for hawker {hawker_id}: {e}")

        # Fallback to consistent mock prediction
        # Reusing the mock prediction logic from above
        import random
        import hashlib
        import time as time_module

        # Create hash-based seed for consistent randomness
        hash_obj = hashlib.md5(hawker_id.encode())
        hash_int = int(hash_obj.hexdigest(), 16)
        random.seed(hash_int)

        # Levels and their probabilities
        levels = ['Low', 'Medium', 'High']
        level_weights = [0.4, 0.4, 0.2]  # More low and medium, less high

        # Get current time for context-aware prediction
        now = datetime.now()
        hour = now.hour
        weekday = now.weekday()
        is_weekend = weekday >= 5

        # Adjust prediction based on time of day
        if is_weekend and (11 <= hour <= 14 or 17 <= hour <= 20):
            # Weekend lunch/dinner - more likely to be high
            level_weights = [0.1, 0.3, 0.6]
        elif not is_weekend and (11 <= hour <= 14):
            # Weekday lunch - medium to high
            level_weights = [0.2, 0.5, 0.3]
        elif 17 <= hour <= 20:
            # Dinner time - more medium
            level_weights = [0.2, 0.6, 0.2]

        # Choose level based on weighted random selection
        level = random.choices(levels, weights=level_weights)[0]

        # Generate consistent confidence based on hawker ID
        confidence = 0.5 + (hash_int % 50) / 100.0  # 0.5 to 1.0

        return jsonify({
            "hawker_id": hawker_id,
            "crowd_level": level,
            "confidence": confidence,
            "timestamp": time_module.time(),
            "source": "error_fallback"
        })

@app.route('/predict/all', methods=['GET'])
def predict_all_crowds():
    """Get crowd level predictions for all hawker centers."""
    try:
        # Get all hawker centers
        hawkers = list(db["hawker_centers"].find())
        if not hawkers:
            # If no hawkers found, return a mock empty response
            return jsonify([])

        results = []

        for hawker in hawkers:
            # Use either '_id' or 'id' field based on what's available
            hawker_id = str(hawker.get("_id", hawker.get("id", "")))
            if not hawker_id:
                continue

            try:
                if predictor is not None:
                    level, confidence = predictor.predict_crowd(hawker_id)
                    results.append({
                        "hawker_id": hawker_id,
                        "hawker_name": hawker.get("displayName", "Unknown"),
                        "crowd_level": level,
                        "confidence": confidence
                    })
                else:
                    # Mock prediction if predictor isn't available
                    import random
                    levels = ['Low', 'Medium', 'High']
                    random_level = levels[random.randint(0, 2)]
                    random_confidence = 0.5 + (random.random() * 0.4)
                    
                    results.append({
                        "hawker_id": hawker_id,
                        "hawker_name": hawker.get("displayName", "Unknown"),
                        "crowd_level": random_level,
                        "confidence": random_confidence,
                        "source": "mock_prediction"
                    })
            except Exception as e:
                print(f"Error predicting for hawker {hawker_id}: {str(e)}")
                
                # Generate mock data instead of error
                import random
                levels = ['Low', 'Medium', 'High']
                random_level = levels[random.randint(0, 2)]
                random_confidence = 0.5 + (random.random() * 0.4)
                
                results.append({
                    "hawker_id": hawker_id,
                    "hawker_name": hawker.get("displayName", "Unknown"),
                    "crowd_level": random_level,
                    "confidence": random_confidence,
                    "source": "error_fallback"
                })

        return jsonify(results)
    except Exception as e:
        print(f"Error predicting for all hawkers: {e}")
        # Return empty array instead of error
        return jsonify([])

@app.route('/update-mappings', methods=['POST'])
def update_mappings():
    """Update hawker center mappings."""
    try:
        mappings = request.get_json()
        # Here you could implement storing the mappings in MongoDB
        # For now, we'll just acknowledge receipt
        return jsonify({
            "status": "success",
            "message": "Mappings received",
            "count": len(mappings) if isinstance(mappings, list) else "unknown"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """API health check endpoint."""
    return jsonify({
        "status": "healthy",
        "timestamp": time.time()
    })

if __name__ == '__main__':
    # Start the Flask server
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting ML API server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
