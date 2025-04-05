import reducer, {
  getUserLoyalty,
  updateLoyalty
} from '../../app/store/slices/loyaltySlice';
import axios from 'axios';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_BASE_URL } from '../../app/constants/api';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const axiosMock = new MockAdapter(axios);

describe('loyaltyslice', () => {
  const token = 'mock-token';
  const initialState = {
    auth: { token },
    loyalty: {
      loyaltyByStall: {},
      loading: false,
      error: null
    }
  };

  afterEach(() => {
    axiosMock.reset();
  });

  it('should return initial state', () => {
    const state = reducer(undefined, { type: '' });
    expect(state).toEqual({
      loyaltyByStall: {},
      loading: false,
      error: null
    });
  });

  it('handles getUserLoyalty fulfilled', async () => {
    const stallId = 'stall123';
    const mockLoyalty = { points: 10, visits: 3 };

    axiosMock.onGet(`${API_BASE_URL}/api/loyalty/${stallId}`).reply(200, mockLoyalty);

    const store = mockStore({ auth: { token } });
    await store.dispatch(getUserLoyalty(stallId));

    const actions = store.getActions();
    expect(actions[0].type).toBe(getUserLoyalty.pending.type);
    expect(actions[1].type).toBe(getUserLoyalty.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, loyalty: mockLoyalty });
  });

  it('handles getUserLoyalty rejected', async () => {
    const stallId = 'stall123';

    axiosMock.onGet(`${API_BASE_URL}/api/loyalty/${stallId}`).reply(500, { msg: 'Not found' });

    const store = mockStore({ auth: { token } });
    await store.dispatch(getUserLoyalty(stallId));

    const actions = store.getActions();
    expect(actions[1].type).toBe(getUserLoyalty.rejected.type);
    expect(actions[1].payload).toBe('Not found');
  });

  it('handles updateLoyalty fulfilled', async () => {
    const stallId = 'stall123';
    const input = { stallId, points: 5, visits: 1 };
    const mockUpdated = { points: 15, visits: 4 };

    axiosMock.onPut(`${API_BASE_URL}/api/loyalty/${stallId}`).reply(200, mockUpdated);

    const store = mockStore({ auth: { token } });
    await store.dispatch(updateLoyalty(input));

    const actions = store.getActions();
    expect(actions[1].type).toBe(updateLoyalty.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, loyalty: mockUpdated });
  });

  it('handles updateLoyalty rejected', async () => {
    const input = { stallId: 'stall123', points: 5, visits: 1 };

    axiosMock.onPut(`${API_BASE_URL}/api/loyalty/${input.stallId}`).reply(500, { msg: 'Update failed' });

    const store = mockStore({ auth: { token } });
    await store.dispatch(updateLoyalty(input));

    const actions = store.getActions();
    expect(actions[1].type).toBe(updateLoyalty.rejected.type);
    expect(actions[1].payload).toBe('Update failed');
  });
});
