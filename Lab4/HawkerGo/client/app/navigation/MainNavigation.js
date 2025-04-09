import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { useSelector } from 'react-redux';

// Shared Screens
import ProfileScreen from '../screens/ProfileScreen';
import LoyaltyScreen from '../screens/LoyaltyScreen';
import FilterScreen from '../screens/FilterScreen';

// Customer Screens
import HawkerScreen from '../screens/HawkerScreen';
import HawkerDetailScreen from '../screens/HawkerDetailScreen';
import StallDetailScreen from '../screens/StallDetailScreen';
import OrderScreen from '../screens/OrderScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderDetailsScreen from '../screens/OrderDetailsScreen';
import CrowdReportScreen from '../screens/CrowdReportScreen';

// Stall Owner Screens
import ManageStallScreen from '../screens/ManageStallScreen';
import ManageMenuScreen from '../screens/ManageMenuScreen';
import StallAnalyticsScreen from '../screens/StallAnalyticsScreen';
import AddStallScreen from '../screens/AddStallScreen';
import EditStallDetailsScreen from '../screens/EditStallDetailsScreen';
import QueueManagementScreen from '../screens/QueueManagementScreen';

import AuthNavigation from './AuthNavigation';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Customer: Hawker Flow
const HawkersStack = () => (
  <Stack.Navigator screenOptions={defaultStackOptions}>
    <Stack.Screen name="Hawkers" component={HawkerScreen} />
    <Stack.Screen name="HawkerDetail" component={HawkerDetailScreen} />
    <Stack.Screen name="StallDetail" component={StallDetailScreen} />
    <Stack.Screen name="Order" component={OrderScreen} />
    <Stack.Screen name="CrowdReport" component={CrowdReportScreen} />
    <Stack.Screen name="FilterScreen" component={FilterScreen} />
  </Stack.Navigator>
);

// Customer: Orders Flow
const OrdersStack = () => (
  <Stack.Navigator screenOptions={defaultStackOptions}>
    <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} />
    <Stack.Screen name="OrderDetails" component={OrderDetailsScreen} />
    <Stack.Screen name="QueueManagement" component={QueueManagementScreen} />
  </Stack.Navigator>
);

// Common Profile Flow
const ProfileStack = () => (
  <Stack.Navigator screenOptions={defaultStackOptions}>
    <Stack.Screen name="Profile" component={ProfileScreen} />
    <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
    <Stack.Screen name="FilterScreen" component={FilterScreen} />
  </Stack.Navigator>
);

// Stall Owner: Manage Stall Flow
const ManageStallStack = () => (
  <Stack.Navigator screenOptions={defaultStackOptions}>
    <Stack.Screen name="ManageStall" component={ManageStallScreen} />
    <Stack.Screen name="ManageMenu" component={ManageMenuScreen} />
    <Stack.Screen name="StallAnalytics" component={StallAnalyticsScreen} />
    <Stack.Screen name="AddStall" component={AddStallScreen} />
    <Stack.Screen name="EditStallDetails" component={EditStallDetailsScreen} />
  </Stack.Navigator>
);

// Stall Owner: Manage Queue Flow
const ManageQueueStack = () => (
  <Stack.Navigator screenOptions={defaultStackOptions}>
    <Stack.Screen name="ManageQueue" component={QueueManagementScreen} />
  </Stack.Navigator>
);

const defaultStackOptions = {
  headerStyle: { backgroundColor: '#e67e22' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: 'bold' }
};

const MainNavigation = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

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
      {user.userType === 'stallOwner' ? (
        <>
          <Tab.Screen
            name="ManageStallTab"
            component={ManageStallStack}
            options={{
              tabBarLabel: 'My Stall',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Icon name="store" color={color} size={size} />
              )
            }}
          />
          <Tab.Screen
            name="ManageQueueTab"
            component={ManageQueueStack}
            options={{
              tabBarLabel: 'Queue',
              headerShown: false,
              tabBarIcon: ({ color, size }) => (
                <Icon name="queue" color={color} size={size} />
              )
            }}
          />
        </>
      ) : (
        <>
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
        </>
      )}

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
