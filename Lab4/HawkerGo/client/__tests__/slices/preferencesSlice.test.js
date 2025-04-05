import reducer, {
  getUserPreferences,
  updatePreferences,
  clearPreferences
} from '../../app/store/slices/preferencesSlice';
import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_URL } from '../../app/constants/constants';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const axiosMock = new MockAdapter(axios);

describe('preferencesSlice', () => {
  const token = 'mock-token';
  const authState = { auth: { token } };

  const defaultState = {
    cuisines: [],
    dietaryRestrictions: [],
    spiceLevel: 'No Preference',
    priceRange: {
      min: 0,
      max: 50
    },
    favoriteHawkers: [],
    favoriteStalls: [],
    loading: false,
    error: null
  };

  afterEach(() => {
    axiosMock.reset();
  });

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' })).toEqual(defaultState);
  });

  it('should handle getUserPreferences fulfilled', async () => {
    const mockPrefs = {
      cuisines: ['Chinese'],
      dietaryRestrictions: ['Vegetarian'],
      spiceLevel: 'Mild',
      priceRange: { min: 5, max: 25 },
      favoriteHawkers: ['hawker1'],
      favoriteStalls: ['stall1']
    };

    axiosMock.onGet(`${API_URL}/api/preferences`).reply(200, mockPrefs);

    const store = mockStore(authState);
    await store.dispatch(getUserPreferences());

    const actions = store.getActions();
    expect(actions[0].type).toBe(getUserPreferences.pending.type);
    expect(actions[1].type).toBe(getUserPreferences.fulfilled.type);
    expect(actions[1].payload).toEqual(mockPrefs);
  });

  it('should handle getUserPreferences rejected', async () => {
    axiosMock.onGet(`${API_URL}/api/preferences`).reply(500, { msg: 'Failed to fetch' });

    const store = mockStore(authState);
    await store.dispatch(getUserPreferences());

    const actions = store.getActions();
    expect(actions[1].type).toBe(getUserPreferences.rejected.type);
    expect(actions[1].payload).toBe('Failed to fetch');
  });

  it('should handle updatePreferences fulfilled', async () => {
    const updatedPrefs = {
      cuisines: ['Indian'],
      dietaryRestrictions: [],
      spiceLevel: 'Spicy',
      priceRange: { min: 10, max: 40 },
      favoriteHawkers: ['hawker2'],
      favoriteStalls: ['stall2']
    };

    axiosMock.onPut(`${API_URL}/api/preferences`).reply(200, updatedPrefs);

    const store = mockStore(authState);
    await store.dispatch(updatePreferences(updatedPrefs));

    const actions = store.getActions();
    expect(actions[0].type).toBe(updatePreferences.pending.type);
    expect(actions[1].type).toBe(updatePreferences.fulfilled.type);
    expect(actions[1].payload).toEqual(updatedPrefs);
  });

  it('should handle updatePreferences rejected', async () => {
    axiosMock.onPut(`${API_URL}/api/preferences`).reply(500, { msg: 'Update failed' });

    const store = mockStore(authState);
    await store.dispatch(updatePreferences({}));

    const actions = store.getActions();
    expect(actions[1].type).toBe(updatePreferences.rejected.type);
    expect(actions[1].payload).toBe('Update failed');
  });

  it('should handle clearPreferences reducer', () => {
    const filledState = {
      ...defaultState,
      cuisines: ['Japanese'],
      dietaryRestrictions: ['Halal'],
      spiceLevel: 'Mild',
      priceRange: { min: 10, max: 30 },
      favoriteHawkers: ['hawkerX'],
      favoriteStalls: ['stallY']
    };

    const newState = reducer(filledState, clearPreferences());

    expect(newState).toEqual(defaultState);
  });
});
