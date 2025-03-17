import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import AuthNavigator from './AuthNavigator';
import CustomerNavigator from './CustomerNavigator';
import OwnerNavigator from './OwnerNavigator';

const Stack = createStackNavigator();

const MainNavigator = () => {
  const { user } = useSelector((state) => state.auth);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      ) : user.userType === 'customer' ? (
        <Stack.Screen name="Customer" component={CustomerNavigator} />
      ) : (
        <Stack.Screen name="Owner" component={OwnerNavigator} />
      )}
    </Stack.Navigator>
  );
};

export default MainNavigator;