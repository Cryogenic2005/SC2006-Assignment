import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import reducer, {
  login,
  register,
  logout,
  reset,
} from '../../app/store/slices/authSlice';
import authService from '../../app/services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../app/services/authService');
jest.mock('@react-native-async-storage/async-storage');

const middlewares = [thunk];
const mockStore = configureStore(middlewares);

describe('authSlice', () => {
  const initialState = {
    user: null,
    token: null,
    isLoading: false,
    isSuccess: false,
    isAuthenticated: false,
    isError: false,
    errorMessage: '',
  };

  it('should return initial state', () => {
    expect(reducer(undefined, { type: undefined })).toEqual(initialState);
  });

  it('should handle login.fulfilled', () => {
    const mockPayload = {
      token: 'mockToken',
      user: { id: '1', name: 'User', email: 'user@example.com', userType: 'customer' },
    };

    const action = {
      type: login.fulfilled.type,
      payload: mockPayload,
    };

    const expected = {
      ...initialState,
      user: mockPayload.user,
      token: mockPayload.token,
      isSuccess: true,
      isAuthenticated: true,
    };

    expect(reducer(initialState, action)).toEqual(expected);
  });

  it('should handle login.rejected', () => {
    const action = {
      type: login.rejected.type,
      payload: { message: 'Invalid credentials' },
    };

    const expected = {
      ...initialState,
      isError: true,
      errorMessage: 'Invalid credentials',
    };

    expect(reducer(initialState, action)).toEqual(expected);
  });

  it('should handle register.fulfilled', () => {
    const action = {
      type: register.fulfilled.type,
    };

    const expected = {
      ...initialState,
      isSuccess: true,
    };

    expect(reducer(initialState, action)).toEqual(expected);
  });

  it('should handle logout.fulfilled', () => {
    const loggedInState = {
      ...initialState,
      user: { id: '1', name: 'User' },
      token: 'mockToken',
    };

    const action = {
      type: logout.fulfilled.type,
    };

    const expected = {
      ...loggedInState,
      user: null,
      token: null,
    };

    expect(reducer(loggedInState, action)).toEqual(expected);
  });

  it('should handle reset reducer', () => {
    const state = {
      ...initialState,
      isLoading: true,
      isSuccess: true,
      isError: true,
      errorMessage: 'Something went wrong',
    };

    expect(reducer(state, reset())).toEqual({
      ...initialState,
    });
  });
});
