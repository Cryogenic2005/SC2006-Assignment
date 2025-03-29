import os
import unittest

import dotenv
from dotenv import load_dotenv
import requests

from lta_datamall import LTADataMallClient, LTADataMallEndpoints

class TestLTADataMallClient(unittest.TestCase):
    def setUp(self):
        load_dotenv()
    
    def test_simple_fetch(self):
        client = LTADataMallClient(api_key=os.getenv("LTA_DATAMALL_API_KEY"))
        response = client.fetch(LTADataMallEndpoints.BUS_ARRIVAL, params={"BusStopCode": "83139"})
        
        self.assertIsNotNone(response)
        
        self.assertIn("odata.metadata", response)
        self.assertIn("BusStopCode", response)
        self.assertIn("Services", response)
    
    def test_fetch_with_amount(self):
        client = LTADataMallClient(api_key=os.getenv("LTA_DATAMALL_API_KEY"))
        response = client.fetch(LTADataMallEndpoints.BUS_ROUTES, amount=5)
        
        self.assertIsNotNone(response)
        
        self.assertIn("odata.metadata", response)
        self.assertIn("value", response)
        self.assertEqual(len(response["value"]), 5)
        
    def test_fetch_with_amount_and_offset(self):
        client = LTADataMallClient(api_key=os.getenv("LTA_DATAMALL_API_KEY"))
        response = client.fetch(LTADataMallEndpoints.BUS_STOPS, params={"$skip": 5}, amount=5)
        
        self.assertIsNotNone(response)
        
        self.assertIn("odata.metadata", response)
        self.assertIn("value", response)
        self.assertEqual(len(response["value"]), 5)
        
        # Verify that the first 5 records are not in the response
        first_500_data = requests.get(
            f"https://datamall2.mytransport.sg/ltaodataservice/BusStops",
            headers={"AccountKey": os.getenv("LTA_DATAMALL_API_KEY")}).json()
        
        self.assertNotIn(first_500_data["value"][0], response["value"])
        self.assertNotIn(first_500_data["value"][1], response["value"])
        self.assertNotIn(first_500_data["value"][2], response["value"])
        self.assertNotIn(first_500_data["value"][3], response["value"])
        self.assertNotIn(first_500_data["value"][4], response["value"])
        
        self.assertIn(first_500_data["value"][5], response["value"])
        self.assertIn(first_500_data["value"][6], response["value"])
        self.assertIn(first_500_data["value"][7], response["value"])
        self.assertIn(first_500_data["value"][8], response["value"])
        self.assertIn(first_500_data["value"][9], response["value"])
        