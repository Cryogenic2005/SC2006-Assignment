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
        
    def testFollowupSearch(self):
        finder = HawkerInfoFinder(api_key=os.getenv("GOOGLE_PLACES_API_KEY"))
        
        places, next_page_token = finder.findHawkerCenters(7)
        
        self.assertIsNotNone(next_page_token)
        
        places2, _ = finder.findHawkerCenters(8, next_page_token)
        
        self.assertIsNotNone(places2)
        self.assertEqual(len(places2), 8)
        self.assertTrue(all(isinstance(place, HawkerInfo) for place in places2))
        
        for place in places:
            self.assertNotIn(place, places2)
            
        for place in places2:
            self.assertNotIn(place, places)