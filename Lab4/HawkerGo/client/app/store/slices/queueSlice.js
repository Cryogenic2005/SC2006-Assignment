import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_BASE_URL } from '../../constants/api';

// Get queue status for a stall
export const getQueueStatus = createAsyncThunk(
  'queue/getQueueStatus',
  async (stallId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/queues/stall/${stallId}`);
      return { stallId, queue: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error fetching queue status');
    }
  }
);

// Update queue settings (requires auth)
export const updateQueueSettings = createAsyncThunk(
  'queue/updateQueueSettings',
  async ({ stallId, settings }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const res = await axios.put(`${API_BASE_URL}/api/queues/stall/${stallId}`, settings, config);
      return { stallId, queue: res.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error updating queue settings');
    }
  }
);

// Reset queue for a stall (requires auth)
export const resetQueue = createAsyncThunk(
  'queue/resetQueue',
  async (stallId, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;

      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      await axios.put(`${API_BASE_URL}/api/queues/stall/${stallId}/reset`, {}, config);
      return stallId;
    } catch (err) {
      return rejectWithValue(err.response?.data?.msg || 'Error resetting queue');
    }
  }
);

const queueSlice = createSlice({
  name: 'queue',
  initialState: {
    queuesByStall: {},
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getQueueStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQueueStatus.fulfilled, (state, action) => {
        state.loading = false;
        const { stallId, queue } = action.payload;
        state.queuesByStall[stallId] = queue;
      })
      .addCase(getQueueStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(updateQueueSettings.fulfilled, (state, action) => {
        const { stallId, queue } = action.payload;
        state.queuesByStall[stallId] = queue;
      })
      .addCase(updateQueueSettings.rejected, (state, action) => {
        state.error = action.payload;
      })

      .addCase(resetQueue.fulfilled, (state, action) => {
        const stallId = action.payload;
        if (state.queuesByStall[stallId]) {
          state.queuesByStall[stallId].currentNumber = 0;
          state.queuesByStall[stallId].lastNumber = 0;
        }
      })
      .addCase(resetQueue.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export default queueSlice.reducer;
