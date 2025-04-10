import pymongo
from dotenv import load_dotenv
import os
from bson.objectid import ObjectId

# Load environment variables
load_dotenv()

# Get MongoDB URI
mongo_uri = os.getenv("MONGO_DB", "mongodb://localhost:27017/")

# Connect to MongoDB
client = pymongo.MongoClient(mongo_uri)

# Select the database
db = client["hawkergo"]

# Select the hawker_centers collection
collection = db["hawker_centers"]

# Print total number of documents
print(f"Total hawker centers: {collection.count_documents({})}")

# Fetch and print a few sample documents to inspect their structure
print("\nSample documents:")
samples = list(collection.find({}, {'_id': 1, 'id': 1, 'displayName': 1}).limit(5))
for doc in samples:
    print(doc)

# Try to find the specific hawker ID you're having trouble with
problematic_id = "67eb5b1339be5295141f78e8"
print(f"\nSearching for hawker center with ID: {problematic_id}")

# Try different search strategies
print("\nSearch by 'id' field:")
print(collection.find_one({"id": problematic_id}))

print("\nSearch by '_id' field (as string):")
print(collection.find_one({"_id": problematic_id}))

print("\nSearch by '_id' field (as ObjectId):")
try:
    print(collection.find_one({"_id": ObjectId(problematic_id)}))
except Exception as e:
    print(f"ObjectId conversion error: {e}")

print("\nPartial regex search:")
print(collection.find_one({"id": {"$regex": problematic_id}}))
