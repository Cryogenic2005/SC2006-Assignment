import reducer, {
  getQueueStatus,
  updateQueueSettings,
  resetQueue
} from '../../app/store/slices/queueSlice';
import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_BASE_URL } from '../../app/constants/api';

const middlewares = [thunk];
const mockStore = configureStore(middlewares);
const axiosMock = new MockAdapter(axios);

describe('queueSlice', () => {
  const token = 'mock-token';
  const authState = { auth: { token } };

  const baseState = {
    queuesByStall: {},
    loading: false,
    error: null
  };

  afterEach(() => {
    axiosMock.reset();
  });

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '' })).toEqual(baseState);
  });

  it('should handle getQueueStatus fulfilled', async () => {
    const stallId = 'stall1';
    const mockQueue = { currentNumber: 3, lastNumber: 10 };

    axiosMock.onGet(`${API_BASE_URL}/api/queues/stall/${stallId}`).reply(200, mockQueue);

    const store = mockStore({});
    await store.dispatch(getQueueStatus(stallId));

    const actions = store.getActions();
    expect(actions[0].type).toBe(getQueueStatus.pending.type);
    expect(actions[1].type).toBe(getQueueStatus.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, queue: mockQueue });
  });

  it('should handle getQueueStatus rejected', async () => {
    const stallId = 'stall1';

    axiosMock.onGet(`${API_BASE_URL}/api/queues/stall/${stallId}`).reply(500, { msg: 'Queue fetch failed' });

    const store = mockStore({});
    await store.dispatch(getQueueStatus(stallId));

    const actions = store.getActions();
    expect(actions[1].type).toBe(getQueueStatus.rejected.type);
    expect(actions[1].payload).toBe('Queue fetch failed');
  });

  it('should handle updateQueueSettings fulfilled', async () => {
    const stallId = 'stall1';
    const settings = { queueEnabled: true };
    const updatedQueue = { currentNumber: 5, lastNumber: 15 };

    axiosMock.onPut(`${API_BASE_URL}/api/queues/stall/${stallId}`).reply(200, updatedQueue);

    const store = mockStore(authState);
    await store.dispatch(updateQueueSettings({ stallId, settings }));

    const actions = store.getActions();
    expect(actions[1].type).toBe(updateQueueSettings.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, queue: updatedQueue });
  });

  it('should handle updateQueueSettings rejected', async () => {
    const stallId = 'stall1';
    const settings = { queueEnabled: false };

    axiosMock.onPut(`${API_BASE_URL}/api/queues/stall/${stallId}`).reply(500, { msg: 'Update failed' });

    const store = mockStore(authState);
    await store.dispatch(updateQueueSettings({ stallId, settings }));

    const actions = store.getActions();
    expect(actions[1].type).toBe(updateQueueSettings.rejected.type);
    expect(actions[1].payload).toBe('Update failed');
  });

  it('should handle resetQueue fulfilled and update state', () => {
    const stallId = 'stall1';
    const initialState = {
      queuesByStall: {
        stall1: { currentNumber: 8, lastNumber: 10 }
      },
      loading: false,
      error: null
    };

    const action = { type: resetQueue.fulfilled.type, payload: stallId };
    const newState = reducer(initialState, action);

    expect(newState.queuesByStall[stallId].currentNumber).toBe(0);
    expect(newState.queuesByStall[stallId].lastNumber).toBe(0);
  });

  it('should handle resetQueue rejected', () => {
    const errorMsg = 'Reset failed';
    const action = { type: resetQueue.rejected.type, payload: errorMsg };
    const newState = reducer(baseState, action);

    expect(newState.error).toBe(errorMsg);
  });
});
