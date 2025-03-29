''' Contains client class for fetching data from LTA DataMall API. '''

import requests

from .api_endpoints import LTADataMallEndpoints as Endpoint

class LTADataMallClient:
    ''' Client class for fetching data from LTA DataMall API. '''
    
    BASE_URL = "https://datamall2.mytransport.sg/ltaodataservice/"

    def __init__(self, api_key: str = None):
        """Initializes the LTADataMallClient with the given API key.

        Args:
            api_key (_type_): The API key to use for authenticating with the LTA DataMall API. 
        """        
        
        if api_key is None:
            raise ValueError("API key is required to access LTA DataMall API.")
        
        self.api_key: str = api_key

    def fetch(self, endpoint: Endpoint, params: dict = {}) -> dict:
        """Fetches data from the LTA DataMall API using the given endpoint and parameters.

        Args:
            endpoint (str): The endpoint to fetch data from.
            params (dict, optional): The parameters to pass to the endpoint.
            
        Returns:
            dict: The JSON response from the API.
        """        
        
        headers = {"AccountKey": self.api_key, "Accept": "application/json"}
        response = requests.get(self.BASE_URL + endpoint.value, headers=headers, params=params)
        
        return response.json()