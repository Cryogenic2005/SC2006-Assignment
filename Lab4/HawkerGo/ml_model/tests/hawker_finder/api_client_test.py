import os
import unittest

import dotenv
from dotenv import load_dotenv

from hawker_finder import GooglePlacesAPIClient

class TestGooglePlacesAPIClient(unittest.TestCase):
    def setUp(self):
        load_dotenv()
    
    def test_simple_text_query(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        response, _ = client.requestTextSearch(
            "Hall of Residences, "
            "Nanyang Technological University, "
            "Singapore")
        
        self.assertIsNotNone(response)
                
        # Check that the response contains the expected fields
        # and no other fields.
        self.assertSetEqual(
            set(response[0].keys()),
            {"id", "formattedAddress", "displayName", "location"})
        
        # Check that the response contains some of the expected places
        displayNames = [place["displayName"]["text"] for place in response]
        self.assertIn("Hall of Residence 1", displayNames)
        self.assertIn("Nanyang Crescent Halls", displayNames)
        
    def test_multi_text_query(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        response, _ = client.requestTextSearch("Hawker Centre, Singapore",
                                               count=23,
                                               search_mask="places.id")
        
        self.assertIsNotNone(response)
        
        # Check that the response contains the expected number of places
        self.assertEqual(len(response), 23)
        
    def testFollowupSearch(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        
        response1, next_page_token = \
            client.requestTextSearch("Hall of Residences, NTU, Singapore",
                                     count=3,
                                     search_mask="places.id")
        
        self.assertIsNotNone(next_page_token)
        
        response2, next_page_token = \
            client.requestTextSearch("Hall of Residences, NTU, Singapore",
                                     count=3,
                                     page_token=next_page_token,
                                     search_mask="places.id")
        
        for place in response1:
            self.assertNotIn(place["id"], [item["id"] for item in response2])
        
        for place in response2:
            self.assertNotIn(place["id"], [item["id"] for item in response1])
            
        # This time, we will request all the results at once
        #   and check that the results are the same as before.
        response, _ = client.requestTextSearch("Hall of Residences, NTU, Singapore",
                                               count=6,
                                               search_mask="places.id")
        
        self.assertSetEqual(
            set([place["id"] for place in response]),
            set([place["id"] for place in response1] + [place["id"] for place in response2])
        )
                                 
            
    def test_nearby_search(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        response = client.requestNearbySearch( # Banyan Hall
            latitude=1.3538511,
            longitude=103.6885233,
            radius=500.0,
            types=["bus_stop"])
        
        self.assertIsNotNone(response)
        
        # Check that the response contains the expected fields
        # and no other fields.
        self.assertSetEqual(
            set(response[0].keys()),
            {"id", "formattedAddress", "displayName", "location", "types"})
        
        # Check that the response contains the expected places
        self.assertIn("Opp Hall 11", [place["displayName"]["text"] for place in response])
        
    def test_nearby_search_no_results(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        response = client.requestNearbySearch( # Banyan Hall
            latitude=1.3538511,
            longitude=103.6885233,
            radius=500.0,
            types=["train_station"])
        
        self.assertIsNotNone(response)
        
        # Check that the response is empty
        self.assertEqual(len(response), 0)
        
    def test_details_search(self):
        client = GooglePlacesAPIClient(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        response = client.requestPlaceDetails(
            "ChIJyxFYnKEP2jERkxRYpd1Ap8c", "id,displayName,types")
        
        self.assertIsNotNone(response)
        
        # Check that the response contains the expected fields and no other fields
        self.assertSetEqual(
            set(response.keys()),
            {"id", "displayName", "types"})
        
        self.assertEqual(response["id"], "ChIJyxFYnKEP2jERkxRYpd1Ap8c")
        self.assertEqual(response["displayName"]["text"], "Hall of Residence 6")
        self.assertIn("hostel", response["types"])
        self.assertIn("lodging", response["types"])