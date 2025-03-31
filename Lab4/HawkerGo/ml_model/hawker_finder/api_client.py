""" Contains the GooglePlacesAPIClient class responsible for making requests to the Google Places API. """

import requests
import warnings

class GooglePlacesAPIClient:
    # Only include the following fields in the response by default.
    # This is to reduce the amount of data returned by the API
    # which can help improve performance and reduce costs
    _TEXT_SEARCH_MASKS_DEFAULT = ",".join([
        "places.id",
        "places.formattedAddress",
        "places.displayName",
        "places.location"
    ])
    
    _NEARBY_SEARCH_MASKS_DEFAULT = ",".join([
        "places.id",
        "places.types",
        "places.formattedAddress",
        "places.displayName",
        "places.location"
    ])
    
    def __init__(self, api_key):
        self.api_key = api_key
        
    def requestTextSearch(self,
                          query: str,
                          count: int = 20,
                          page_token: str = None,
                          search_mask: str = _TEXT_SEARCH_MASKS_DEFAULT) -> tuple[list[dict], str|None]:
        """Makes a request to the Google Places **Text Search (New)** API.

        Args:
            query (str): The query to search for.
            count (int, optional): The max number of places to return. Note the number of API calls
                made is equal to the number of places returned divided by 20, rounded up.
                To avoid making multiple API calls, count is restricted to a max of 2000 (100 API calls).
            page_token (str, optional): The token to get the page of results. If provided,
                the API will return the page of results based on the token. Used for continuing
                a previous search. Default is None, which means the first page of results.
            search_mask (str, optional): The fields to include in the response.
                Recommended to use the default value for performance and cost reasons.
                Refer to the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/text-search#fieldmask) for more info.

        Returns:
            dict: The list of places and their details. 
                Only includes the fields specified in the search_mask.
            str|None: The next page token to get the next page of results.
                If None, there are no more results to retrieve.
        """
        
        # Ensure count is not greater than 2000 to avoid making too many API calls
        if count > 2000:
            raise ValueError("Parameter 'count' cannot be greater than 2000. "
                             "This is to avoid making too many API calls (over 100)."
                             "Are you sure you need to retrieve that many places?")
        
        # Ensure nextPageToken is included in the search mask
        if "nextPageToken" not in search_mask:
            search_mask += f",nextPageToken"
        
        # Define the URI and headers for the request
        uri = "https://places.googleapis.com/v1/places:searchText"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            # Only include the following fields in the response
            "X-Goog-FieldMask": search_mask
        }
        
        body = { "textQuery": query }
        if page_token: # If a page token is provided, set it in the body
            body["pageToken"] = page_token
        
        request_count = 0 # Number of API calls made, used to limit the number of calls
        
        retrieved_places = []
        retrieved_count = 0
        
        # Loop until we have retrieved the desired number of places
        while retrieved_count < count:
            # Set the pageSize field in the body to
            #   get the exact number of results
            #   we want in the response.
            #   The API only allows max 20 results per page
            body["pageSize"] = min(count - retrieved_count, 20)
            
            response = requests.post(uri, headers=headers, json=body)
            
            # Increment the request count, then check if we have made too many calls
            # This should not happen as we have set a limit on the count parameter above
            # But just in case, we have this check here.
            request_count += 1
            if request_count > 100:
                warnings.warn(
                    "Exceeded max number of API calls. "
                    "This should not happen as we have set a limit on the count parameter."
                    "Please check the code for any errors.",
                    RuntimeWarning)
                break
        
            if response.status_code != 200:
                raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
            
            # Get the JSON response
            response_json = response.json()
            
            # If there are no results, break out of the loop
            if "places" not in response_json:
                break
            
            # Update the list and count of retrieved places
            retrieved_places.extend(response_json["places"])
            retrieved_count += len(response_json["places"])
            
            # If there are no more results,
            #   nextPageToken will not be in the response
            #   so we can break out of the loop
            if "nextPageToken" not in response_json:
                break
            
            # Get the next page of results by setting the pageToken field in the body
            body["pageToken"] = response_json["nextPageToken"]
        
        return retrieved_places, response_json.get("nextPageToken", None)

    def requestNearbySearch(self,
                            latitude: float,
                            longitude: float,
                            radius: float,
                            types: list[str],
                            search_mask: str = _NEARBY_SEARCH_MASKS_DEFAULT) -> dict:
        """Makes a request to the Google Places **Nearby Search (New)** API.

        Args:
            latitude (float): The latitude of the location to search around.
            longitude (float): The longitude of the location to search around.
            radius (float): The radius to search within.
            types (list[str]): The types of places to search for. For a list of
                supported types, refer to the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/place-types#table-a)
            search_mask (str, optional): The fields to include in the response.
                Recommended to use the default value for performance and cost reasons.
                Refer to the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/nearby-search#fieldmask) for more info.

        Returns:
            dict: The JSON response from the API. Returns top 20 results by distance.
                Only includes the fields specified in the search_mask.
        """
        
        uri = "https://places.googleapis.com/v1/places:searchNearby"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            # Only include the following fields in the response
            "X-Goog-FieldMask": search_mask
        }
        body = {
            "locationRestriction": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": radius
                }
            },
            "includedTypes": types,
            "rankPreference": "DISTANCE"
        }
        
        response = requests.post(uri, headers=headers, json=body)
        
        if response.status_code != 200:
            raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
        
        return response.json()["places"] if "places" in response.json() else []
    
    def requestPlaceDetails(self,
                            place_id: str,
                            search_mask: str = "places.id") -> dict:
        """Makes a request to the Google Places **Place Details (New)** API.

        Args:
            place_id (str): The unique identifier of the place.
            search_mask (str): The fields to include in the response.
                Default value set to avoid unnecessary data transfer when calling this function.
                Refer to the [Google Places API documentation](https://developers.google.com/maps/documentation/places/web-service/details#fieldmask) for more info.

        Returns:
            dict: The place details. Only includes the fields specified in the search_mask.
        """
        
        uri = f"https://places.googleapis.com/v1/places/{place_id}"
        headers = {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": self.api_key,
            # Only include the following fields in the response
            "X-Goog-FieldMask": search_mask
        }
        
        response = requests.get(uri, headers=headers)
        
        if response.status_code != 200:
            raise Exception(f"Request failed with status code {response.status_code}: {response.text}")
        
        return response.json()