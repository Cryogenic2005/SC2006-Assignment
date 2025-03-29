import os
import unittest

import dotenv
from dotenv import load_dotenv

from lta_datamall import LTADataMallClient, LTADataMallEndpoints

class TestLTADataMallClient(unittest.TestCase):
    def setUp(self):
        load_dotenv()
    
    def test_fetch(self):
        client = LTADataMallClient(api_key=os.getenv("LTA_DATAMALL_API_KEY"))
        response = client.fetch(LTADataMallEndpoints.BUS_ARRIVAL, params={"BusStopCode": "83139"})
        
        self.assertIsNotNone(response)
        
        self.assertIn("odata.metadata", response)
        self.assertIn("BusStopCode", response)
        self.assertIn("Services", response)