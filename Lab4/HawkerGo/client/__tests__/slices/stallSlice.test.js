import reducer, {
  getStallById,
  getStallMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem
} from '../../app/store/slices/stallSlice';

import axios from 'axios';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import MockAdapter from 'axios-mock-adapter';
import { API_BASE_URL } from '../../app/constants/api';

const mockStore = configureStore([thunk]);
const axiosMock = new MockAdapter(axios);

describe('stallSlice', () => {
  const token = 'mock-token';
  const authState = { auth: { token } };

  const initialState = {
    currentStall: null,
    menusByStall: {},
    loading: false,
    error: null
  };

  afterEach(() => {
    axiosMock.reset();
  });

  it('should return initial state', () => {
    expect(reducer(undefined, { type: '' })).toEqual(initialState);
  });

  it('should handle getStallById fulfilled', async () => {
    const stallId = 'stall123';
    const mockStall = { _id: stallId, name: 'Roti Stall' };

    axiosMock.onGet(`${API_BASE_URL}/api/stalls/${stallId}`).reply(200, mockStall);

    const store = mockStore({});
    await store.dispatch(getStallById(stallId));

    const actions = store.getActions();
    expect(actions[1].type).toBe(getStallById.fulfilled.type);
    expect(actions[1].payload).toEqual(mockStall);
  });

  it('should handle getStallById rejected', async () => {
    const stallId = 'stall123';

    axiosMock.onGet(`${API_BASE_URL}/api/stalls/${stallId}`).reply(500, { msg: 'Error fetching stall' });

    const store = mockStore({});
    await store.dispatch(getStallById(stallId));

    const actions = store.getActions();
    expect(actions[1].type).toBe(getStallById.rejected.type);
    expect(actions[1].payload).toBe('Error fetching stall');
  });

  it('should handle getStallMenu fulfilled', async () => {
    const stallId = 'stall1';
    const menu = [{ _id: 'item1', name: 'Mee Goreng' }];

    axiosMock.onGet(`${API_BASE_URL}/api/stalls/${stallId}/menu`).reply(200, menu);

    const store = mockStore({});
    await store.dispatch(getStallMenu(stallId));

    const actions = store.getActions();
    expect(actions[1].type).toBe(getStallMenu.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, menu });
  });

  it('should handle addMenuItem fulfilled', async () => {
    const stallId = 'stall1';
    const itemData = { name: 'Nasi Lemak' };
    const returnedItem = { _id: 'item2', name: 'Nasi Lemak' };

    axiosMock
      .onPost(`${API_BASE_URL}/api/stalls/${stallId}/menu`)
      .reply(200, returnedItem);

    const store = mockStore(authState);
    await store.dispatch(addMenuItem({ stallId, itemData }));

    const actions = store.getActions();
    expect(actions[1].type).toBe(addMenuItem.fulfilled.type);
    expect(actions[1].payload).toEqual({ stallId, item: returnedItem });
  });

  it('should handle updateMenuItem fulfilled', () => {
    const stallId = 'stall1';
    const itemId = 'item1';
    const initialStateWithMenu = {
      ...initialState,
      menusByStall: {
        [stallId]: [{ _id: itemId, name: 'Old Name' }]
      }
    };
    const updatedItem = { _id: itemId, name: 'Updated Name' };

    const action = {
      type: updateMenuItem.fulfilled.type,
      payload: { stallId, itemId, item: updatedItem }
    };

    const state = reducer(initialStateWithMenu, action);
    expect(state.menusByStall[stallId][0].name).toBe('Updated Name');
  });

  it('should handle deleteMenuItem fulfilled', () => {
    const stallId = 'stall1';
    const itemId = 'item1';

    const initialStateWithMenu = {
      ...initialState,
      menusByStall: {
        [stallId]: [
          { _id: itemId, name: 'To be deleted' },
          { _id: 'item2', name: 'Keep me' }
        ]
      }
    };

    const action = {
      type: deleteMenuItem.fulfilled.type,
      payload: { stallId, itemId }
    };

    const state = reducer(initialStateWithMenu, action);
    expect(state.menusByStall[stallId].length).toBe(1);
    expect(state.menusByStall[stallId][0].name).toBe('Keep me');
  });
});
