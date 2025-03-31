import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';

// Get stall by ID
export const getStallById = createAsyncThunk(
  'stalls/getStallById',
  async (stallId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stalls/${stallId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error fetching stall');
    }
  }
);

// Get menu items for a stall
export const getStallMenu = createAsyncThunk(
  'stalls/getStallMenu',
  async (stallId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stalls/${stallId}/menu`);
      return { stallId, menu: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error fetching menu');
    }
  }
);

// Add menu item to stall (requires auth)
export const addMenuItem = createAsyncThunk(
  'stalls/addMenuItem',
  async ({ stallId, itemData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      const res = await axios.post(`${API_BASE_URL}/api/stalls/${stallId}/menu`, itemData, config);
      return { stallId, item: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error adding menu item');
    }
  }
);

// Update a menu item
export const updateMenuItem = createAsyncThunk(
  'stalls/updateMenuItem',
  async ({ stallId, itemId, itemData }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      const res = await axios.put(`${API_BASE_URL}/api/stalls/${stallId}/menu/${itemId}`, itemData, config);
      return { stallId, itemId, item: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error updating menu item');
    }
  }
);

// Delete a menu item
export const deleteMenuItem = createAsyncThunk(
  'stalls/deleteMenuItem',
  async ({ stallId, itemId }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'x-auth-token': token,
        },
      };

      await axios.delete(`${API_BASE_URL}/api/stalls/${stallId}/menu/${itemId}`, config);
      return { stallId, itemId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error deleting menu item');
    }
  }
);

const stallSlice = createSlice({
  name: 'stalls',
  initialState: {
    currentStall: null,
    menusByStall: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getStallById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStallById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentStall = action.payload;
      })
      .addCase(getStallById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getStallMenu.fulfilled, (state, action) => {
        state.menusByStall[action.payload.stallId] = action.payload.menu;
      })
      .addCase(addMenuItem.fulfilled, (state, action) => {
        const { stallId, item } = action.payload;
        if (state.menusByStall[stallId]) {
          state.menusByStall[stallId].push(item);
        } else {
          state.menusByStall[stallId] = [item];
        }
      })
      .addCase(updateMenuItem.fulfilled, (state, action) => {
        const { stallId, itemId, item } = action.payload;
        const menu = state.menusByStall[stallId];
        const index = menu.findIndex((m) => m._id === itemId);
        if (index !== -1) {
          menu[index] = item;
        }
      })
      .addCase(deleteMenuItem.fulfilled, (state, action) => {
        const { stallId, itemId } = action.payload;
        state.menusByStall[stallId] = state.menusByStall[stallId].filter(
          (item) => item._id !== itemId
        );
      });
  },
});

export default stallSlice.reducer;
