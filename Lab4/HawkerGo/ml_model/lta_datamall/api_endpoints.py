""" This module contains the API endpoints for the LTA DataMall API. """

from enum import Enum

class LTADataMallEndpoints(Enum):
    '''Contains the API endpoints for the LTA DataMall API for easy access.
    Full documentation can be found [here](https://datamall.lta.gov.sg/content/dam/datamall/datasets/LTA_DataMall_API_User_Guide.pdf).
    '''
    
    BUS_ARRIVAL = "v3/BusArrival"
    '''Returns real-time bus arrival information for bus services at a queried bus stop.
    Ignores `LTADataMallClient.fetch()` *amount* parameter.
    
    Parameters: BusStopCode, [ServiceNo]'''
    
    BUS_SERVICES = "BusServices"
    '''Returns detailed service information for all buses currently in operation.
    
    Parameters: None'''
    
    BUS_ROUTES = "BusRoutes"
    '''Returns detailed route information for all services currently in operation.
    
    Parameters: None'''
    
    BUS_STOPS = "BusStops"
    '''Returns detailed information for all bus stops currently in operation.
    
    Parameters: None'''
    
    PASSENGER_VOLUME_BY_BUS_STOP = "PV/Bus"
    '''Returns tap in and tap out passenger volume by weekdays and weekends for individual bus stop.
    
    Parameters: [Date]'''
    
    PASSENGER_VOLUME_BY_ORIGIN_DESTINATION_BUS_STOP = "PV/ODBus"
    '''Returns number of trips by weekdays and weekends from origin to destination bus stops.
    
    Parameters: [Date]'''
    
    PASSENGER_VOLUME_BY_TRAIN_STATION = "PV/Train"
    '''Returns tap in and tap out passenger volume by weekdays and weekends for individual train station.
    
    Parameters: [Date]'''
    
    PASSENGER_VOLUME_BY_ORIGIN_DESTINATION_TRAIN_STATION = "PV/ODTrain"
    '''Returns number of trips by weekdays and weekends from origin to destination train stations.
    
    Parameters: [Date]'''
    
    TAXI_AVAILABILITY = "Taxi-Availability"
    '''Returns location coordinates of all Taxis that are currently available for hire. Does not include "Hired" or "Busy" Taxis.
    
    Parameters: None'''
    
    TAXI_STANDS = "TaxiStands"
    '''Returns detailed information of Taxi stands, such as location and whether is it barrier free.
    Ignores `LTADataMallClient.fetch()` *amount* parameter.
    
    Parameters: None'''
    
    TRAIN_SERVICE_ALERTS = "TrainServiceAlerts"
    '''Returns detailed information on train service unavailability during scheduled operating hours.
    Ignores `LTADataMallClient.fetch()` *amount* parameter.
    
    Parameters: None'''
    
    CARPARK_AVAILABILITY = "CarParkAvailabilityv2"
    '''Returns no. of available lots for HDB, LTA and URA carpark data. The LTA carpark data consist of
    major shopping malls and developments within Orchard, Marina, HarbourFront, Jurong Lake District
    
    Parameters: None'''
    
    ESTIMATED_TRAVEL_TIMES = "EstTravelTimes"
    '''Returns estimated travel times of expressways (in segments).
    
    Parameters: None'''
    
    FAULTY_TRAFFIC_LIGHTS = "FaultyTrafficLights"
    '''Returns alerts of traffic lights that are currently faulty, or currently undergoing scheduled maintenance.
    
    Parameters: None'''
    
    ROAD_OPENINGS = "RoadOpenings"
    '''Information on planned road openings.
    
    Parameters: None'''
    
    APPROVED_ROAD_WORKS = "RoadWorks"
    '''Information on approved road works to be carried out/being carried out.
    
    Parameters: None'''
    
    TRAFFIC_IMAGES = "Traffic-Imagesv2"
    '''Returns links to images of live traffic conditions along expressways and Woodlands & Tuas Checkpoints.
    
    Parameters: None'''
    
    TRAFFIC_INCIDENTS = "TrafficIncidents"
    '''Returns incidents currently happening on the roads.
    
    Parameters: None'''
    
    TRAFFIC_SPEED_BANDS = "v3/TrafficSpeedBands"
    '''Returns current traffic speeds on expressways and arterial roads, expressed in speed bands.
    
    Parameters: None'''
    
    VMS_EMAS = "VMS"
    '''Returns traffic advisories (via variable message services) concerning current traffic conditions that are displayed on EMAS signboards along expressways and arterial roads.
    
    Parameters: None'''