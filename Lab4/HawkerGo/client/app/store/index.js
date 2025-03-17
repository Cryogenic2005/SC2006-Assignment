import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import hawkerReducer from './slices/hawkerSlice';
import stallReducer from './slices/stallSlice';
import orderReducer from './slices/orderSlice';
import queueReducer from './slices/queueSlice';
import loyaltyReducer from './slices/loyaltySlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hawker: hawkerReducer,
    stall: stallReducer,
    order: orderReducer,
    queue: queueReducer,
    loyalty: loyaltyReducer,
  },
});