import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import RegisterScreen from '../../app/screens/auth/RegisterScreen';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';


const mockStore = configureMockStore([thunk]);
const mockNavigation = { navigate: jest.fn() };

describe('RegisterScreen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      auth: {
        isLoading: false,
        isError: false,
        isSuccess: false,
        errorMessage: '',
      },
    });
  });

  it('renders input fields and buttons', () => {
    const { getByPlaceholderText, getByText } = render(
      <Provider store={store}>
        <RegisterScreen navigation={mockNavigation} />
      </Provider>
    );

    expect(getByPlaceholderText('Name')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
    expect(getByText('Login')).toBeTruthy();
  });

  it('shows alert if fields are empty on submit', () => {
    const alertMock = jest.spyOn(global, 'alert').mockImplementation(() => {});
    
    const { getByText } = render(
      <Provider store={store}>
        <RegisterScreen navigation={mockNavigation} />
      </Provider>
    );

    const registerButton = getByText('Register');
    fireEvent.press(registerButton);

    expect(alertMock).toHaveBeenCalled();

    alertMock.mockRestore();
  });
});