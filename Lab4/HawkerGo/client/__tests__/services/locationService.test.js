import * as Location from 'expo-location';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  checkLocationPermission,
  getCurrentLocation,
  calculateDistance,
  getNearbyBusStops,
  getBusArrivals,
  calculateRoute
} from '../../app/store/services/locationService';
import { LTA_API_KEY } from '../../app/constants/constants';

jest.mock('expo-location');

const axiosMock = new MockAdapter(axios);

describe('locationService', () => {
  afterEach(() => {
    axiosMock.reset();
    jest.clearAllMocks();
  });

  describe('checkLocationPermission', () => {
    it('should return true when permission is granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      const result = await checkLocationPermission();
      expect(result).toBe(true);
    });

    it('should return false on error', async () => {
      Location.requestForegroundPermissionsAsync.mockRejectedValue(new Error('fail'));
      const result = await checkLocationPermission();
      expect(result).toBe(false);
    });
  });

  describe('getCurrentLocation', () => {
    it('should return coordinates when permission is granted', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'granted' });
      Location.getCurrentPositionAsync.mockResolvedValue({
        coords: { latitude: 1.3, longitude: 103.8 }
      });

      const result = await getCurrentLocation();
      expect(result).toEqual({ latitude: 1.3, longitude: 103.8 });
    });

    it('should throw if permission denied', async () => {
      Location.requestForegroundPermissionsAsync.mockResolvedValue({ status: 'denied' });

      await expect(getCurrentLocation()).rejects.toThrow('Location permission not granted');
    });
  });

  describe('calculateDistance', () => {
    it('should return ~0km for same coords', () => {
      const dist = calculateDistance(1.3, 103.8, 1.3, 103.8);
      expect(dist).toBeCloseTo(0);
    });

    it('should return a non-zero distance for different coords', () => {
      const dist = calculateDistance(1.3, 103.8, 1.31, 103.81);
      expect(dist).toBeGreaterThan(0);
    });
  });

  describe('getNearbyBusStops', () => {
    it('should return sorted nearby bus stops within radius', async () => {
      const mockStops = [
        { BusStopCode: '123', Latitude: 1.300, Longitude: 103.800 },
        { BusStopCode: '456', Latitude: 1.310, Longitude: 103.810 },
        { BusStopCode: '789', Latitude: 1.350, Longitude: 103.850 }, // outside radius
      ];

      axiosMock
        .onGet('http://datamall2.mytransport.sg/ltaodataservice/BusStops')
        .reply(200, { value: mockStops });

      const results = await getNearbyBusStops(1.3, 103.8, 2);
      expect(results.length).toBe(2);
      expect(results[0].BusStopCode).toBe('123');
    });
  });

  describe('getBusArrivals', () => {
    it('should fetch bus arrival data for a bus stop', async () => {
      const mockServices = [{ ServiceNo: '12', NextBus: {} }];

      axiosMock
        .onGet(/BusArrivalv2\?BusStopCode=12345/)
        .reply(200, { Services: mockServices });

      const result = await getBusArrivals('12345');
      expect(result).toEqual(mockServices);
    });
  });

  describe('calculateRoute', () => {
    it('should return walking and public transport if distance > 1km', async () => {
      const routes = await calculateRoute(1.3, 103.8, 1.32, 103.82);
      expect(routes.length).toBe(2);
      expect(routes[0].mode).toBe('walking');
      expect(routes[1].mode).toBe('public_transport');
    });

    it('should return only walking if distance <= 1km', async () => {
      const routes = await calculateRoute(1.3, 103.8, 1.305, 103.805);
      expect(routes.length).toBe(1);
      expect(routes[0].mode).toBe('walking');
    });
  });
});
