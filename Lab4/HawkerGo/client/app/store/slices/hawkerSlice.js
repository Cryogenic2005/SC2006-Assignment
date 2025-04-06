import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { API_URL } from '../../constants/api';

// Get all hawker centers
export const getHawkers = createAsyncThunk(
  'hawkers/getHawkers',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/api/hawkers`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Get hawker center by ID
export const getHawkerById = createAsyncThunk(
  'hawkers/getHawkerById',
  async (hawkerId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/api/hawkers/${hawkerId}`);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Get stalls by hawker center ID
export const getStallsByHawker = createAsyncThunk(
  'hawkers/getStallsByHawker',
  async (hawkerId, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/api/stalls/hawker/${hawkerId}`);
      return { hawkerId, stalls: res.data };
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Get crowd levels for all hawker centers
export const getCrowdLevels = createAsyncThunk(
  'hawkers/getCrowdLevels',
  async (_, { rejectWithValue }) => {
    try {
      const res = await axios.get(`${API_URL}/api/crowds`);
      
      // Convert array to object with hawkerId as key
      const crowdData = {};
      res.data.forEach(item => {
        crowdData[item.hawker] = {
          level: item.level,
          timestamp: item.timestamp,
          validated: item.validated
        };
      });
      
      return crowdData;
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

// Report crowd level
export const reportCrowdLevel = createAsyncThunk(
  'hawkers/reportCrowdLevel',
  async ({ hawkerId, level }, { getState, rejectWithValue }) => {
    try {
      const { token } = getState().auth;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const body = { hawkerId, level };
      
      await axios.post(`${API_URL}/api/crowds`, body, config);
      
      return { hawkerId, level };
    } catch (err) {
      return rejectWithValue(err.response.data.msg);
    }
  }
);

const hawkerSlice = createSlice({
  name: 'hawkers',
  initialState: {
    hawkers: [],
    currentHawker: null,
    stallsByHawker: {},
    crowdLevels: {},
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getHawkers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHawkers.fulfilled, (state, action) => {
        state.loading = false;
        state.hawkers = action.payload;
      })
      .addCase(getHawkers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getHawkerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHawkerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentHawker = action.payload;
      })
      .addCase(getHawkerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getStallsByHawker.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getStallsByHawker.fulfilled, (state, action) => {
        state.loading = false;
        state.stallsByHawker[action.payload.hawkerId] = action.payload.stalls;
      })
      .addCase(getStallsByHawker.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(getCrowdLevels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCrowdLevels.fulfilled, (state, action) => {
        state.loading = false;
        state.crowdLevels = action.payload;
      })
      .addCase(getCrowdLevels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(reportCrowdLevel.fulfilled, (state, action) => {
        const { hawkerId, level } = action.payload;
        state.crowdLevels[hawkerId] = {
          level,
          timestamp: new Date().toISOString(),
          validated: false
        };
      });
  }
});

export default hawkerSlice.reducer;