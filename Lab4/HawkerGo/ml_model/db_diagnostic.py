from pymongo import MongoClient
from dotenv import load_dotenv
import os
import pprint

# Load environment variables
load_dotenv()

# Get MongoDB URI
mongo_uri = os.getenv("MONGO_DB", "mongodb://localhost:27017/")

try:
    # Connect to MongoDB
    client = MongoClient(mongo_uri)
    
    # Select the database
    db = client["hawkergo"]
    
    # Select the hawker_centers collection
    collection = db["hawker_centers"]
    
    # Print total number of documents
    total_docs = collection.count_documents({})
    print(f"Total documents in hawker_centers collection: {total_docs}")
    
    # Print sample documents with their ID fields
    print("\nSample documents:")
    sample_docs = collection.find({}, {'_id': 1, 'id': 1, 'displayName': 1}).limit(10)
    for doc in sample_docs:
        print("\nDocument:")
        pprint.pprint({
            "_id": str(doc.get('_id')),
            "id": doc.get('id'),
            "displayName": doc.get('displayName')
        })
    
    # Specific ID search
    problematic_id = "67eb5b1339be5295141f78e8"
    print(f"\nSearching for document with ID: {problematic_id}")
    
    # Try different search strategies
    strategies = [
        {"name": "Direct id match", "query": {"id": problematic_id}},
        {"name": "Partial id match", "query": {"id": {"$regex": problematic_id}}},
        {"name": "ObjectId", "query": {"_id": problematic_id}},
        {"name": "Regex DisplayName", "query": {"displayName": {"$regex": problematic_id, "$options": "i"}}}
    ]
    
    for strategy in strategies:
        print(f"\nTrying {strategy['name']}:")
        result = collection.find_one(strategy['query'])
        if result:
            print("Found document:")
            pprint.pprint(result)
        else:
            print("No document found.")

except Exception as e:
    print(f"Error: {e}")
