import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, thunkAPI) => {
    try {
      const response = await authService.login(email, password);
      await AsyncStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ name, email, password, userType }, thunkAPI) => {
    try {
      const response = await authService.register(name, email, password, userType);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response.data);
    }
  }
);

export const socialLogin = createAsyncThunk(
  'auth/socialLogin',
  async ({ provider, token, email, name }, thunkAPI) => {
    try {
      const response = await authService.socialLogin(provider, token, email, name);
      await AsyncStorage.setItem('token', response.token);
      return response;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: 'Social login failed' });
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.removeItem('token');
});

export const updateUserSettings = createAsyncThunk(
  'auth/updateUserSettings',
  async (userData, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await authService.updateUserSettings(token, userData);
      
      // Update the user object in the state
      return response.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: 'Failed to update settings' });
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, thunkAPI) => {
    try {
      const state = thunkAPI.getState();
      const token = state.auth.token;
      
      if (!token) {
        throw new Error('No authentication token found');
      }

      await authService.changePassword(token, currentPassword, newPassword);
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || { message: 'Failed to change password' });
    }
  }
);

const initialState = {
  user: null,
  token: null,
  isLoading: false,
  isSuccess: false,
  isAuthenticated: false,
  isError: false,
  errorMessage: '',
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    reset: (state) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = false;
      state.errorMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload?.message || 'Login failed';
        state.user = null;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(register.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload?.message || 'Registration failed';
      })
      .addCase(socialLogin.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(socialLogin.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.token = action.payload.token;
      })
      .addCase(socialLogin.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload?.message || 'Social login failed';
        state.user = null;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      })
      .addCase(updateUserSettings.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = '';
      })
      .addCase(updateUserSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.user = { ...state.user, ...action.payload };
      })
      .addCase(updateUserSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload?.message || 'Failed to update settings';
      })
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.isError = false;
        state.errorMessage = '';
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.isSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.errorMessage = action.payload?.message || 'Failed to change password';
      });
  },
});

export const { reset } = authSlice.actions;
export default authSlice.reducer;