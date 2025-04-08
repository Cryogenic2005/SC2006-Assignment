from dotenv import load_dotenv

from .api_client import GooglePlacesAPIClient

class HawkerInfo:
    '''Represents information about a hawker center.'''
    
    def __init__(self, id: str, longitude: float, latitude: float, displayName: str):
        self.id = id
        self.longitude = longitude
        self.latitude = latitude
        self.displayName = displayName

class HawkerInfoFinder:
    def __init__(self, api_key):
        self.client = GooglePlacesAPIClient(api_key)
    
    def findHawkerCenters(self,
                          amount: int = 20,
                          page_token: str = None) -> tuple[list[HawkerInfo], str|None]:
        """Finds hawker centers in Singapore.

        Args:
            amount (int, optional): The amount of hawker centers to find. Defaults to 20.
            pageToken (str, optional): The token for the next page of results. Used for continuing
                a previous search. Default is None, which means the first page of results.

        Returns:
            list[HawkerInfo]: The list of hawker centers found.
                Contains the id, longitude, latitude, and display name of the hawker center.
            str|None: The next page token to get the next page of results.
                If None, there are no more results to retrieve.
        """        
        
        # Get the list of hawker centers
        hawker_centers, nextPageToken = self.client.requestTextSearch("Hawker Centers, Singapore",
                                                                      count=amount,
                                                                      page_token=page_token)
        
        hawker_infos = [
            HawkerInfo(hawker_center["id"],
                       hawker_center["location"]["longitude"],
                       hawker_center["location"]["latitude"],
                       hawker_center["displayName"]["text"])        
            for hawker_center in hawker_centers
        ]

        # Return the list of hawker centers
        return hawker_infos, nextPageToken
    
    def findNearbyBusStops(self,
                           hawker_center_info: HawkerInfo,
                           radius: float = 500.0) -> list[dict]:
        
        return self.findNearbyLocationsByType(
            hawker_center_info,
            types=["bus_station", "bus_stop"],
            radius=radius
        )
    
    def findNearbyMRTStations(self,
                              hawker_center_info: HawkerInfo,
                              radius: float = 500.0) -> list[dict]:
        
        return self.findNearbyLocationsByType(
            hawker_center_info,
            types=["subway_station", "light_rail_station", "train_station"],
            radius=radius
        )
        
    def findNearbyTaxiStands(self,
                             hawker_center_info: HawkerInfo,
                             radius: float = 500.0) -> list[dict]:
            
        return self.findNearbyLocationsByType(
            hawker_center_info,
            types=["taxi_stand"],
            radius=radius
        )
    
    def findNearbyLocationsByType(self,
                                  hawker_center_info: HawkerInfo,
                                  types: list[str],
                                  radius: float = 500.0) -> list[dict]:
        """Finds up to 20 nearby bus stops around a hawker center.

        Args:
            hawker_center_info (HawkerInfo): The information of the hawker center.
            types (list[str]): The types of locations to search for. Refer to the
                [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/place-types#table-a)
            radius (float, optional): The radius in meters to search for bus stops.
                Defaults to 500 meters.

        Returns:
            list[dict]: The list of locations found.
                Contains the id, longitude, latitude, and display name.
        """
        
        # Get the list of nearby bus stops
        nearby_bus_stops = self.client.requestNearbySearch(hawker_center_info.latitude,
                                                           hawker_center_info.longitude,
                                                           radius=radius,
                                                           types=types)
        
        for bus_stop in nearby_bus_stops:
            bus_stop["longitude"] = bus_stop["location"]["longitude"]
            bus_stop["latitude"] = bus_stop["location"]["latitude"]
            bus_stop["displayName"] = bus_stop["displayName"]["text"]
            bus_stop.pop("location")
            
        return nearby_bus_stops