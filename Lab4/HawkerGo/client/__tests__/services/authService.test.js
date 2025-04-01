import axios from 'axios';
import authService from '../../app/services/authService';

jest.mock('axios');

describe('authService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('login() should post email and password and return data', async () => {
    const mockResponse = {
      data: {
        token: 'fakeToken',
        user: {
          id: '123',
          email: 'test@example.com',
          name: 'Test User',
          userType: 'customer'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    const result = await authService.login('test@example.com', 'password123');

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/login$/), {
      email: 'test@example.com',
      password: 'password123'
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('register() should post user details and return data', async () => {
    const mockResponse = {
      data: {
        token: 'fakeToken',
        user: {
          id: '456',
          email: 'new@example.com',
          name: 'New User',
          userType: 'stallOwner'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    const result = await authService.register('New User', 'new@example.com', 'password123', 'stallOwner');

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/register$/), {
      name: 'New User',
      email: 'new@example.com',
      password: 'password123',
      userType: 'stallOwner'
    });

    expect(result).toEqual(mockResponse.data);
  });

  it('socialLogin() should post provider and token and return data', async () => {
    const mockResponse = {
      data: {
        token: 'socialToken',
        user: {
          id: '789',
          email: 'social@example.com',
          name: 'Social User',
          userType: 'customer'
        }
      }
    };

    axios.post.mockResolvedValueOnce(mockResponse);

    const result = await authService.socialLogin('google', 'testGoogleToken');

    expect(axios.post).toHaveBeenCalledWith(expect.stringMatching(/\/auth\/social-login$/), {
      provider: 'google',
      token: 'testGoogleToken'
    });

    expect(result).toEqual(mockResponse.data);
  });
});
