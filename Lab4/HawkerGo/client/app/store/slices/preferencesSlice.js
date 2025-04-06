import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../constants/constants';

// Get user preferences
export const getUserPreferences = createAsyncThunk(
  'preferences/getUserPreferences',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`${API_URL}/api/preferences`, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Update user preferences
export const updatePreferences = createAsyncThunk(
  'preferences/updatePreferences',
  async (preferencesData, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const res = await axios.put(`${API_URL}/api/preferences`, preferencesData, config);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState: {
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
  },
  reducers: {
    clearPreferences: (state) => {
      state.cuisines = [];
      state.dietaryRestrictions = [];
      state.spiceLevel = 'No Preference';
      state.priceRange = { min: 0, max: 50 };
      state.favoriteHawkers = [];
      state.favoriteStalls = [];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getUserPreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserPreferences.fulfilled, (state, action) => {
        state.loading = false;
        
        if (action.payload) {
          state.cuisines = action.payload.cuisines || [];
          state.dietaryRestrictions = action.payload.dietaryRestrictions || [];
          state.spiceLevel = action.payload.spiceLevel || 'No Preference';
          state.priceRange = action.payload.priceRange || { min: 0, max: 50 };
          state.favoriteHawkers = action.payload.favoriteHawkers || [];
          state.favoriteStalls = action.payload.favoriteStalls || [];
        }
      })
      .addCase(getUserPreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updatePreferences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePreferences.fulfilled, (state, action) => {
        state.loading = false;
        
        state.cuisines = action.payload.cuisines || [];
        state.dietaryRestrictions = action.payload.dietaryRestrictions || [];
        state.spiceLevel = action.payload.spiceLevel || 'No Preference';
        state.priceRange = action.payload.priceRange || { min: 0, max: 50 };
        state.favoriteHawkers = action.payload.favoriteHawkers || [];
        state.favoriteStalls = action.payload.favoriteStalls || [];
      })
      .addCase(updatePreferences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearPreferences } = preferencesSlice.actions;

export default preferencesSlice.reducer;