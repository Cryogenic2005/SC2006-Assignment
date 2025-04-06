// navigation/MainNavigation.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';

// Screens
import HawkerScreen from '../screens/HawkerScreen';
import HawkerDetailScreen from '../screens/HawkerDetailScreen';
import StallDetailScreen from '../screens/StallDetailScreen';
import OrderScreen from '../screens/OrderScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import LoyaltyScreen from '../screens/LoyaltyScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CrowdReportScreen from '../screens/CrowdReportScreen';
import QueueManagementScreen from '../screens/QueueManagementScreen';
import FilterScreen from '../screens/FilterScreen';

// Auth
import AuthNavigation from './AuthNavigation';
import { useSelector } from 'react-redux';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const HawkersStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#e67e22',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Hawkers" 
        component={HawkerScreen} 
        options={{ title: 'Hawker Centers' }}
      />
      <Stack.Screen 
        name="HawkerDetail" 
        component={HawkerDetailScreen} 
        options={({ route }) => ({ title: route.params.hawkerName })}
      />
      <Stack.Screen 
        name="StallDetail" 
        component={StallDetailScreen} 
        options={({ route }) => ({ title: route.params.stallName })}
      />
      <Stack.Screen 
        name="Order" 
        component={OrderScreen} 
        options={{ title: 'Place Order' }}
      />
      <Stack.Screen 
        name="CrowdReport" 
        component={CrowdReportScreen} 
        options={{ title: 'Report Crowd Level' }}
      />
      <Stack.Screen 
        name="FilterScreen" 
        component={FilterScreen} 
        options={{ title: 'Filter Options' }}
      />
    </Stack.Navigator>
  );
};

const OrdersStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#e67e22',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="OrderHistory" 
        component={OrderHistoryScreen} 
        options={{ title: 'My Orders' }}
      />
      <Stack.Screen 
        name="OrderDetails" 
        component={OrderDetailsScreen} 
        options={{ title: 'Order Details' }}
      />
      <Stack.Screen 
        name="QueueManagement" 
        component={QueueManagementScreen} 
        options={{ title: 'Queue Management' }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#e67e22',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Stack.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ title: 'My Profile' }}
      />
      <Stack.Screen 
        name="Loyalty" 
        component={LoyaltyScreen} 
        options={{ title: 'Loyalty Rewards' }}
      />
      <Stack.Screen 
        name="FilterScreen" 
        component={FilterScreen} 
        options={{ title: 'Preferences' }} 
/>

    </Stack.Navigator>
  );
};

const MainNavigation = () => {
  const { isAuthenticated, user } = useSelector(state => state.auth);
  
  if (!isAuthenticated) {
    return <AuthNavigation />;
  }
  
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#e67e22',
        tabBarInactiveTintColor: '#95a5a6',
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5
        }
      }}
    >
      <Tab.Screen 
        name="HawkersTab" 
        component={HawkersStack} 
        options={{
          tabBarLabel: 'Hawkers',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="OrdersTab" 
        component={OrdersStack} 
        options={{
          tabBarLabel: 'Orders',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="receipt" color={color} size={size} />
          )
        }}
      />
      <Tab.Screen 
        name="ProfileTab" 
        component={ProfileStack} 
        options={{
          tabBarLabel: 'Profile',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="person" color={color} size={size} />
          )
        }}
      />
    </Tab.Navigator>
  );
};

export default MainNavigation;