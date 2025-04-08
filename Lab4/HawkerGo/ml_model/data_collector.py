import os
import csv
import json
from dotenv import load_dotenv
from pymongo import MongoClient
from geopy.geocoders import Nominatim
from geopy.distance import geodesic

# Import your existing modules
from hawker_finder import HawkerInfoFinder, HawkerInfo
from lta_datamall import LTADataMallClient, LTADataMallEndpoints

def init_mongodb_connection():
    """Initialize MongoDB connection"""
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    client = MongoClient(mongo_uri)
    db = client["hawkergo"]
    return db

def collect_hawker_centers(api_key, amount=100):
    """Collect hawker center data using GooglePlacesAPI"""
    finder = HawkerInfoFinder(api_key)
    all_hawkers = []
    next_page_token = None

    print("Collecting hawker center data...")
    while len(all_hawkers) < amount:
        try:
            hawkers, next_page_token = finder.findHawkerCenters(
                amount=min(20, amount - len(all_hawkers)),
                page_token=next_page_token
            )
            all_hawkers.extend(hawkers)
            if not next_page_token:
                break
        except Exception as e:
            print(f"Error while collecting hawker centers: {e}")
            # If we at least found some hawkers, return them instead of failing completely
            if all_hawkers:
                print(f"Returning {len(all_hawkers)} hawker centers found before error")
                break
            else:
                raise

    print(f"Found {len(all_hawkers)} hawker centers")
    return all_hawkers

def get_postal_code(latitude, longitude, geolocator):
    """Get postal code from latitude and longitude"""
    try:
        location = geolocator.reverse((latitude, longitude), exactly_one=True)
        address = location.raw.get('address', {})
        return address.get('postcode')
    except Exception as e:
        print(f"Error getting postal code: {e}")
        return None

def collect_nearby_bus_stops(lta_client, hawker_info, finder, radius=500):
    """Collect nearby bus stops using HawkerInfoFinder and validate with LTA API"""
    # Get bus stops from Google Places API
    google_bus_stops = finder.findNearbyBusStops(hawker_info, radius=radius)
    
    # Get all bus stops from LTA DataMall for validation and enrichment
    try:
        lta_bus_stops_data = lta_client.fetch(LTADataMallEndpoints.BUS_STOPS, amount=-1)
        lta_bus_stops = lta_bus_stops_data.get('value', [])
    except Exception as e:
        print(f"Error fetching LTA bus stops: {e}")
        lta_bus_stops = []
    
    # Extract bus stop codes from Google bus stop names using regex
    import re
    valid_bus_stops = []
    
    for bus_stop in google_bus_stops:
        try:
            bus_stop_name = bus_stop["displayName"]
            # Look for 5-digit bus stop codes in the name
            code_match = re.search(r'\b(\d{5})\b', bus_stop_name)
            bus_stop_code = code_match.group(1) if code_match else None
            
            # Calculate distance from hawker center
            distance = geodesic(
                (hawker_info.latitude, hawker_info.longitude),
                (bus_stop["latitude"], bus_stop["longitude"])
            ).meters
            
            # Find matching LTA bus stop data to enrich our information
            lta_match = None
            if bus_stop_code:
                # Direct code match
                lta_match = next((bs for bs in lta_bus_stops if bs.get('BusStopCode') == bus_stop_code), None)
            
            if not lta_match:
                # Try location-based matching if no code match found
                for lta_stop in lta_bus_stops:
                    try:
                        lta_lat = float(lta_stop.get('Latitude', 0))
                        lta_lng = float(lta_stop.get('Longitude', 0))
                        
                        # If coordinates are within 50m, consider it a match
                        if geodesic(
                            (lta_lat, lta_lng),
                            (bus_stop["latitude"], bus_stop["longitude"])
                        ).meters < 50:
                            lta_match = lta_stop
                            bus_stop_code = lta_stop.get('BusStopCode')
                            break
                    except (ValueError, TypeError):
                        continue
            
            # Create enhanced bus stop record with combined data
            enhanced_bus_stop = {
                "id": bus_stop["id"],
                "displayName": bus_stop["displayName"],
                "latitude": bus_stop["latitude"],
                "longitude": bus_stop["longitude"],
                "distance": distance,
                "bus_stop_code": bus_stop_code
            }
            
            # Add additional LTA data if available
            if lta_match:
                enhanced_bus_stop.update({
                    "bus_stop_code": lta_match.get('BusStopCode'),
                    "road_name": lta_match.get('RoadName'),
                    "description": lta_match.get('Description'),
                    "is_verified": True
                })
            else:
                enhanced_bus_stop["is_verified"] = False
            
            valid_bus_stops.append(enhanced_bus_stop)
            
        except Exception as e:
            print(f"Error processing bus stop {bus_stop.get('displayName', 'unknown')}: {e}")
    
    # Sort by distance
    valid_bus_stops.sort(key=lambda x: x.get('distance', float('inf')))
    
    return valid_bus_stops

def collect_nearby_carparks(lta_client, hawker_info, radius=500):
    """Find nearby carparks using LTA DataMall API"""
    try:
        # Fetch all carparks
        carpark_data = lta_client.fetch(
            LTADataMallEndpoints.CARPARK_AVAILABILITY,
            amount=-1  # Get all available carparks
        )
        
        nearby_carparks = []
        
        # Filter carparks by distance
        for carpark in carpark_data.get('value', []):
            # Skip if no location
            if not carpark.get('Location'):
                continue
                
            try:
                # Extract coordinates
                coords = carpark['Location'].split()
                if len(coords) != 2:
                    continue
                
                cp_lat = float(coords[0])
                cp_lon = float(coords[1])
                
                # Calculate distance
                distance = geodesic(
                    (hawker_info.latitude, hawker_info.longitude),
                    (cp_lat, cp_lon)
                ).meters
                
                # If carpark is within radius, add to list
                if distance <= radius:
                    nearby_carparks.append({
                        "CarParkID": carpark.get('CarParkID'),
                        "Development": carpark.get('Development'),
                        "LotType": carpark.get('LotType'),
                        "Agency": carpark.get('Agency'),
                        "latitude": cp_lat,
                        "longitude": cp_lon,
                        "distance": distance
                    })
            except Exception as e:
                print(f"Error processing carpark {carpark.get('CarParkID')}: {e}")
        
        return nearby_carparks
    except Exception as e:
        print(f"Error fetching carparks: {e}")
        return []

def store_hawker_data(db, hawker_centers_data):
    """Store hawker centers data in MongoDB"""
    collection = db["hawker_centers"]
    
    # Clear existing data if needed
    # collection.delete_many({})
    
    result = collection.insert_many(hawker_centers_data)
    print(f"Inserted {len(result.inserted_ids)} hawker centers into MongoDB")

def main():
    # Load environment variables
    load_dotenv()
    
    # Initialize Google Places API client
    google_api_key = os.getenv("GOOGLE_PLACES_API_KEY")
    
    # Initialize LTA DataMall client
    lta_api_key = os.getenv("LTA_DATAMALL_API_KEY")
    lta_client = LTADataMallClient(lta_api_key)
    
    # Initialize MongoDB connection
    db = init_mongodb_connection()
    
    # Initialize geocoder for reverse geocoding
    geolocator = Nominatim(user_agent="hawkergo-data-collector")
    
    # Initialize HawkerInfoFinder
    finder = HawkerInfoFinder(google_api_key)
    
    # Collect hawker centers
    hawker_centers = collect_hawker_centers(google_api_key, amount=50)
    
    # Process each hawker center
    hawker_centers_data = []
    for hawker in hawker_centers:
        print(f"Processing {hawker.displayName}...")
        
        # Get postal code
        postal_code = get_postal_code(hawker.latitude, hawker.longitude, geolocator)
        
        # Get nearby bus stops
        bus_stops = collect_nearby_bus_stops(lta_client, hawker, finder)
        
        # Get nearby carparks
        carparks = collect_nearby_carparks(lta_client, hawker)
        
        # Create hawker center data object
        hawker_data = {
            "id": hawker.id,
            "displayName": hawker.displayName,
            "latitude": hawker.latitude,
            "longitude": hawker.longitude,
            "postal_code": postal_code,
            "bus_stops": bus_stops,
            "carparks": carparks
        }
        
        hawker_centers_data.append(hawker_data)
    
    # Store hawker centers data in MongoDB
    store_hawker_data(db, hawker_centers_data)
    
    # Export data to JSON file for backup
    with open('hawker_centers_data.json', 'w') as f:
        json.dump(hawker_centers_data, f, indent=2)
    
    print("Data collection completed.")

if __name__ == "__main__":
    main()
