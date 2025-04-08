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
        self._fetch_ignore_endpoint = [
            Endpoint.BUS_ARRIVAL,
            Endpoint.TAXI_STANDS,
            Endpoint.TRAIN_SERVICE_ALERTS,
        ] # Endpoints that ignore the $skip parameter

    def fetch(self, endpoint: Endpoint, params: dict = {}, amount: int = None) -> dict:
        """Fetches data from the LTA DataMall API using the given endpoint and parameters.
        The amount parameter specifies the number of records to fetch and will be used for
        repeated requests if the endpoint supports pagination.
        
        Note that to avoid catastrophic API usage, the maximum number of requests is limited to 200,
        equivalent to fetching 100,000 records; after which the function will return all data fetched.

        Args:
            endpoint (str): The endpoint to fetch data from.
            params (dict, optional): The parameters to pass to the endpoint.
            amount (int, optional): The amount of data to fetch. For some endpoint requests,
                this value is ignored. Defaults to None.
                - If value is None, no *$skip* parameter is added.
                - If value is -1, all data is fetched.
                - Otherwise, fetches data up to the specified amount.
                - If *$skip* parameter is present in the params, it is taken as an offset.
                For example, this will fetch 50 values starting from the 101st record:
                    params={'$skip'=100}, amount=50 
            
        Returns:
            dict: The JSON response from the API.
        """        
        
        # Set the headers and target URL
        headers = {"AccountKey": self.api_key, "Accept": "application/json"}
        target_url = self.BASE_URL + endpoint.value
        
        # If only one request is needed, fetch the data and return it
        if amount is None or endpoint in self._fetch_ignore_endpoint:
            response = requests.get(target_url, headers=headers, params=params)
            return response.json()
        
        # Fetch data in multiple requests until specified amount is reached
        data: dict = None               # Data fetched so far
        offset = params.get('$skip', 0) # Offset for the current request
        count = 0                       # Number of records fetched so far
        retrieved_count = 0             # Number of records retrieved for the current request
        request_count = 0               # Number of requests made so far
        
        # Repeat fetch request until the required amount of data is fetched
        while count < amount or amount == -1:
            response = requests.get(target_url, headers=headers, params=params)
            
            retrieved_data = response.json()
            retrieved_count = len(retrieved_data['value'])
            
            if data is None: # First request
                data = retrieved_data # Initialize the data, which includes the metadata as well
            else: # Subsequent requests
                data['value'] += retrieved_data['value'] # Append the new data to the existing data
                count += retrieved_count                 # Update the total count of records fetched

            # Update the offset for the next request
            params['$skip'] = offset + count
            
            request_count += 1
            if request_count > 200: # Limit the number of requests to prevent infinite loops
                break
            
            if retrieved_count == 0: # No more data to fetch, exit the loop early
                break
            
        # Slice off excess data if amount is specified
        if amount != -1:
            data['value'] = data['value'][:amount]
            
        return data