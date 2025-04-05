// client/__tests__/slices/hawkerslice.test.js

import reducer, {
  getHawkers,
  getCrowdLevels
} from '../../app/store/slices/hawkerslice';
import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_URL } from '../../app/constants/api';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const axiosMock = new MockAdapter(axios);

describe('hawkerslice', () => {
  afterEach(() => {
    axiosMock.reset();
  });

  it('should return the initial state', () => {
    const initialState = reducer(undefined, { type: '' });
    expect(initialState).toEqual({
      hawkers: [],
      currentHawker: null,
      stallsByHawker: {},
      crowdLevels: {},
      loading: false,
      error: null
    });
  });

  it('handles getHawkers fulfilled', async () => {
    const mockHawkers = [{ id: 1, name: 'ABC Hawker' }];
    axiosMock.onGet(`${API_URL}/api/hawkers`).reply(200, mockHawkers);

    const store = mockStore({});
    await store.dispatch(getHawkers());

    const actions = store.getActions();
    expect(actions[0].type).toBe(getHawkers.pending.type);
    expect(actions[1].type).toBe(getHawkers.fulfilled.type);
    expect(actions[1].payload).toEqual(mockHawkers);
  });

  it('handles getCrowdLevels fulfilled and formats correctly', async () => {
    const mockData = [
      {
        hawker: '123',
        level: 'High',
        timestamp: '2023-01-01T00:00:00Z',
        validated: true
      }
    ];

    axiosMock.onGet(`${API_URL}/api/crowds`).reply(200, mockData);

    const store = mockStore({});
    await store.dispatch(getCrowdLevels());

    const actions = store.getActions();
    expect(actions[1].type).toBe(getCrowdLevels.fulfilled.type);
    expect(actions[1].payload).toEqual({
      '123': {
        level: 'High',
        timestamp: '2023-01-01T00:00:00Z',
        validated: true
      }
    });
  });

  it('handles getHawkers rejected', async () => {
    axiosMock.onGet(`${API_URL}/api/hawkers`).reply(500, { msg: 'Error occurred' });

    const store = mockStore({});
    await store.dispatch(getHawkers());

    const actions = store.getActions();
    expect(actions[1].type).toBe(getHawkers.rejected.type);
    expect(actions[1].payload).toBe('Error occurred');
  });
});
