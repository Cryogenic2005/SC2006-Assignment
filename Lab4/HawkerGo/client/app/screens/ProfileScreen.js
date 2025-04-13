import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Avatar, Icon, ListItem } from 'react-native-elements';
import { logout } from '../store/slices/authSlice';
import { clearPreferences } from '../store/slices/preferencesSlice';
import { clearOrders } from '../store/slices/orderSlice';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const ProfileScreen = ({ navigation }) => {
  const [userStats, setUserStats] = useState({
    totalOrders: 0,
    totalSpent: 0,
    favoriteHawker: '',
    totalPoints: 0
  });
  
  const [loading, setLoading] = useState(false);
  
  const dispatch = useDispatch();
  const { user, token } = useSelector(state => state.auth);
  const preferences = useSelector(state => state.preferences);
  
  useEffect(() => {
    fetchUserStats();
  }, []);
  
  const fetchUserStats = async () => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`${API_BASE_URL}/api/users/stats`, config);
      
      setUserStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setLoading(false);
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          onPress: () => {
            dispatch(logout());
            dispatch(clearPreferences());
            dispatch(clearOrders());
          } 
        }
      ]
    );
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.profileCard}>
        <View style={styles.profileHeader}>
          <Avatar
            size="large"
            rounded
            title={getInitials(user?.name)}
            containerStyle={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
            {user?.userType === 'stallOwner' && (
              <Text style={styles.ownerBadge}>Stall Owner</Text>
            )}
          </View>
        </View>
        
        <Button
          title="Edit Profile"
          type="outline"
          buttonStyle={styles.editButton}
          titleStyle={{ color: '#e67e22' }}
          onPress={() => navigation.navigate('Settings')}
        />
      </Card>
      
      {user?.userType === 'stallOwner' ? (
        <Card containerStyle={styles.statsCard}>
          <Card.Title>Stall Management</Card.Title>
          
          <Button
            title="Manage Queue"
            buttonStyle={styles.queueButton}
            onPress={() => navigation.navigate('ManageQueueTab')}
            icon={{
              name: 'people',
              color: '#fff',
              size: 16,
              style: { marginRight: 10 }
            }}
          />
          
          <Button
            title="Manage Menu"
            buttonStyle={styles.menuButton}
            onPress={() => {navigation.navigate('ManageStallTab', { screen: 'ManageMenu' })}}
            icon={{
              name: 'restaurant-menu',
              color: '#fff',
              size: 16,
              style: { marginRight: 10 }
            }}
          />
          
          <Button
            title="View Analytics"
            buttonStyle={styles.analyticsButton}
            onPress={() => {navigation.navigate('ManageStallTab', { screen: 'StallAnalytics' })}}
            icon={{
              name: 'trending-up',
              color: '#fff',
              size: 16,
              style: { marginRight: 10 }
            }}
          />
        </Card>
      ) : (
        <Card containerStyle={styles.statsCard}>
          <Card.Title>Your Stats</Card.Title>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalOrders}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${userStats.totalSpent.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Spent</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userStats.totalPoints}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
          </View>
          
          {userStats.favoriteHawker && (
            <View style={styles.favoriteContainer}>
              <Text style={styles.favoriteLabel}>Favorite Hawker Center</Text>
              <Text style={styles.favoriteValue}>{userStats.favoriteHawker}</Text>
            </View>
          )}
        </Card>
      )}
      
      <View style={styles.menuListContainer}>
        {user?.userType !== 'stallOwner' && (<TouchableOpacity
          onPress={() => navigation.navigate('Loyalty')}
          style={styles.menuItem}
        >
          <Icon name="card-giftcard" color="#e67e22" size={24} />
          <Text style={styles.menuItemText}>Loyalty Rewards</Text>
          <Icon name="chevron-right" color="#bdc3c7" size={24} />
        </TouchableOpacity>)}
        
        {user?.userType !== 'stallOwner' && (<TouchableOpacity
          onPress={() => navigation.navigate('FilterScreen')}
          style={styles.menuItem}
        >
          <Icon name="tune" color="#3498db" size={24} />
          <Text style={styles.menuItemText}>Preferences</Text>
          <Icon name="chevron-right" color="#bdc3c7" size={24} />
        </TouchableOpacity>)}
        
        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={styles.menuItem}
        >
          <Icon name="settings" color="#7f8c8d" size={24} />
          <Text style={styles.menuItemText}>Settings</Text>
          <Icon name="chevron-right" color="#bdc3c7" size={24} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleLogout}
          style={styles.menuItem}
        >
          <Icon name="exit-to-app" color="#e74c3c" size={24} />
          <Text style={styles.menuItemText}>Logout</Text>
          <Icon name="chevron-right" color="#bdc3c7" size={24} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  profileCard: {
    borderRadius: 10,
    padding: 15,
    margin: 10
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  avatar: {
    backgroundColor: '#e67e22'
  },
  userInfo: {
    marginLeft: 20
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 3
  },
  userEmail: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  ownerBadge: {
    marginTop: 5,
    color: '#e67e22',
    fontWeight: 'bold'
  },
  editButton: {
    borderColor: '#e67e22',
    borderRadius: 8
  },
  statsCard: {
    borderRadius: 10,
    padding: 15,
    margin: 10
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  statItem: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  favoriteContainer: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f8f8',
    borderRadius: 8
  },
  favoriteLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  favoriteValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  queueButton: {
    backgroundColor: '#3498db',
    marginBottom: 10,
    borderRadius: 8
  },
  menuButton: {
    backgroundColor: '#2ecc71',
    marginBottom: 10,
    borderRadius: 8
  },
  analyticsButton: {
    backgroundColor: '#9b59b6',
    borderRadius: 8
  },
  menuListContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    marginBottom: 30
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16
  }
});

export default ProfileScreen;