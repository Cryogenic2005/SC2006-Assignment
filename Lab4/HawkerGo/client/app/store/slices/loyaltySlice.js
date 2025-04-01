import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';

// Fetch loyalty info for the current user (by stall)
export const getUserLoyalty = createAsyncThunk(
  'loyalty/getUserLoyalty',
  async (stallId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const res = await axios.get(`${API_BASE_URL}/api/loyalty/${stallId}`, config);
      return { stallId, loyalty: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to fetch loyalty data');
    }
  }
);

// Update loyalty (usually after an order)
export const updateLoyalty = createAsyncThunk(
  'loyalty/updateLoyalty',
  async ({ stallId, points, visits }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const body = { points, visits };

      const res = await axios.put(`${API_BASE_URL}/api/loyalty/${stallId}`, body, config);
      return { stallId, loyalty: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Failed to update loyalty');
    }
  }
);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState: {
    loyaltyByStall: {},
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getUserLoyalty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserLoyalty.fulfilled, (state, action) => {
        state.loading = false;
        const { stallId, loyalty } = action.payload;
        state.loyaltyByStall[stallId] = loyalty;
      })
      .addCase(getUserLoyalty.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateLoyalty.fulfilled, (state, action) => {
        const { stallId, loyalty } = action.payload;
        state.loyaltyByStall[stallId] = loyalty;
      })
      .addCase(updateLoyalty.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export default loyaltySlice.reducer;
