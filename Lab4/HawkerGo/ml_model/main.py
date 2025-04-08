"""
HawkerGo - Main Integration Script

This script ties together all components:
1. Data collection from Google Places API and LTA DataMall
2. Database integration with MongoDB
3. ML model training and prediction
4. API service for frontend access

Usage:
    python hawkergo.py [command]

Commands:
    collect-data    Collect hawker center data and store in MongoDB
    train-model     Train the ML model using real data from APIs
    start-api       Start the API service
    init-all        Initialize everything (collect data, train model, start API)
"""

import os
import sys
import subprocess
import time
from dotenv import load_dotenv

def check_environment():
    """Check if all required environment variables are set."""
    required_vars = [
        "GOOGLE_PLACES_API_KEY",
        "LTA_DATAMALL_API_KEY",
        "MONGO_URI"
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("ERROR: The following environment variables are not set:")
        for var in missing_vars:
            print(f"  - {var}")
        print("\nPlease set these variables in a .env file or in your environment.")
        sys.exit(1)
    
    print("✅ Environment check passed.")

def collect_data():
    """Run the data collection script."""
    print("Starting data collection process...")
    try:
        from data_collector import main
        main()
        print("✅ Data collection completed successfully.")
    except Exception as e:
        print(f"❌ Error during data collection: {e}")
        sys.exit(1)

def train_model():
    """Train the ML model."""
    print("Starting model training process...")
    try:
        from model import train_and_save_model
        train_and_save_model()
        print("✅ Model training completed successfully.")
    except Exception as e:
        print(f"❌ Error during model training: {e}")
        sys.exit(1)

def start_api():
    """Start the API service."""
    print("Starting API service...")
    try:
        subprocess.run(["python", "api_service.py"], check=True)
    except KeyboardInterrupt:
        print("\nAPI service stopped.")
    except Exception as e:
        print(f"❌ Error running API service: {e}")
        sys.exit(1)

def init_all():
    """Initialize everything."""
    collect_data()
    train_model()
    start_api()

def show_help():
    """Show help message."""
    print(__doc__)

def main():
    """Main entry point."""
    load_dotenv()
    check_environment()
    
    if len(sys.argv) < 2:
        show_help()
        sys.exit(1)
    
    command = sys.argv[1]
    
    if command == "collect-data":
        collect_data()
    elif command == "train-model":
        train_model()
    elif command == "start-api":
        start_api()
    elif command == "init-all":
        init_all()
    else:
        print(f"Unknown command: {command}")
        show_help()
        sys.exit(1)

if __name__ == "__main__":
    main()