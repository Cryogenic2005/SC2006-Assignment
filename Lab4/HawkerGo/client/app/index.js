// app/index.js
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store'; 
import MainNavigation from './navigation/MainNavigation';

export default function AppEntry() {
  return (
    <Provider store={store}>
      <MainNavigation />
    </Provider>
  );
}
