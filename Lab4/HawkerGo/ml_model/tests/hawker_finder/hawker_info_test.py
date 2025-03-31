import os
import unittest

import dotenv
from dotenv import load_dotenv

from hawker_finder import HawkerInfoFinder, HawkerInfo

class TestGooglePlacesAPIClient(unittest.TestCase):
    def setUp(self):
        load_dotenv()
    
    def testSimpleSearch(self):
        finder = HawkerInfoFinder(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        
        places, _ = finder.findHawkerCenters(7)
        
        self.assertIsNotNone(places)
        self.assertEqual(len(places), 7)
        self.assertTrue(all(isinstance(place, HawkerInfo) for place in places))