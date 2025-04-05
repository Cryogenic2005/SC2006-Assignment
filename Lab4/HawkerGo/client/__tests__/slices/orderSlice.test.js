import reducer, {
  getUserOrders,
  createOrder,
  cancelOrder,
  clearOrders
} from '../../app/store/slices/orderSlice';
import axios from 'axios';
import configureStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_URL } from '../../app/constants/constants';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const axiosMock = new MockAdapter(axios);

describe('orderslice', () => {
  const token = 'mock-token';

  const baseState = {
    orders: [],
    loading: false,
    error: null
  };

  afterEach(() => {
    axiosMock.reset();
  });

  it('should return the initial state', () => {
    expect(reducer(undefined, { type: '' })).toEqual(baseState);
  });

  it('should handle getUserOrders fulfilled', async () => {
    const mockOrders = [{ _id: '1', status: 'pending' }];
    axiosMock.onGet(`${API_URL}/api/orders/user`).reply(200, mockOrders);

    const store = mockStore({ auth: { token } });
    await store.dispatch(getUserOrders());

    const actions = store.getActions();
    expect(actions[0].type).toBe(getUserOrders.pending.type);
    expect(actions[1].type).toBe(getUserOrders.fulfilled.type);
    expect(actions[1].payload).toEqual(mockOrders);
  });

  it('should handle getUserOrders rejected', async () => {
    axiosMock.onGet(`${API_URL}/api/orders/user`).reply(500, { msg: 'Fetch failed' });

    const store = mockStore({ auth: { token } });
    await store.dispatch(getUserOrders());

    const actions = store.getActions();
    expect(actions[1].type).toBe(getUserOrders.rejected.type);
    expect(actions[1].payload).toBe('Fetch failed');
  });

  it('should handle createOrder fulfilled', async () => {
    const newOrder = { _id: '2', status: 'pending' };
    axiosMock.onPost(`${API_URL}/api/orders`).reply(200, newOrder);

    const store = mockStore({ auth: { token } });
    await store.dispatch(createOrder({ item: 'test' }));

    const actions = store.getActions();
    expect(actions[1].type).toBe(createOrder.fulfilled.type);
    expect(actions[1].payload).toEqual(newOrder);
  });

  it('should handle createOrder rejected', async () => {
    axiosMock.onPost(`${API_URL}/api/orders`).reply(500, { msg: 'Create failed' });

    const store = mockStore({ auth: { token } });
    await store.dispatch(createOrder({ item: 'test' }));

    const actions = store.getActions();
    expect(actions[1].type).toBe(createOrder.rejected.type);
    expect(actions[1].payload).toBe('Create failed');
  });

  it('should handle cancelOrder fulfilled and update status', () => {
    const orderId = '3';
    const initialState = {
      orders: [{ _id: '3', status: 'pending' }],
      loading: true,
      error: null
    };

    const action = { type: cancelOrder.fulfilled.type, payload: orderId };
    const newState = reducer(initialState, action);

    expect(newState.orders[0].status).toBe('cancelled');
    expect(newState.loading).toBe(false);
  });

  it('should handle cancelOrder rejected', () => {
    const error = 'Cancel failed';
    const action = { type: cancelOrder.rejected.type, payload: error };
    const newState = reducer(baseState, action);

    expect(newState.error).toBe(error);
    expect(newState.loading).toBe(false);
  });

  it('should handle clearOrders reducer', () => {
    const state = {
      orders: [{ _id: '1' }],
      loading: false,
      error: null
    };

    const newState = reducer(state, clearOrders());
    expect(newState.orders).toEqual([]);
  });
});
