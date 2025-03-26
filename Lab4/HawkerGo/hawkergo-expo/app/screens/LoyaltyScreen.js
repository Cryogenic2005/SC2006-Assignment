// screens/LoyaltyScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Badge, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants/constants';

const LoyaltyScreen = ({ navigation }) => {
  const [loyaltyData, setLoyaltyData] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  
  useEffect(() => {
    if (!auth.isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    
    fetchLoyaltyData();
  }, [auth.isAuthenticated]);
  
  const fetchLoyaltyData = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`${API_URL}/api/loyalty`, config);
      setLoyaltyData(res.data);
      
      // Get available rewards
      const rewardsRes = await axios.get(`${API_URL}/api/rewards`, config);
      setRewards(rewardsRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching loyalty data:', err);
      setLoading(false);
    }
  };
  
  const redeemReward = async (rewardId, stallId, points) => {
    try {
      setLoading(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const body = {
        rewardId,
        stallId
      };
      
      await axios.post(`${API_URL}/api/rewards/redeem`, body, config);
      
      // Refresh loyalty data
      fetchLoyaltyData();
      
      setLoading(false);
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.msg || 'Could not redeem reward');
    }
  };
  
  const getTierColor = (tier) => {
    switch (tier) {
      case 'Bronze': return '#cd7f32';
      case 'Silver': return '#c0c0c0';
      case 'Gold': return '#ffd700';
      case 'Platinum': return '#e5e4e2';
      default: return '#95a5a6';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading loyalty data...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Card containerStyle={styles.pointsCard}>
        <View style={styles.pointsHeader}>
          <Text style={styles.pointsTitle}>Total Loyalty Points</Text>
          <Text style={styles.pointsValue}>
            {loyaltyData.reduce((total, item) => total + item.points, 0)}
          </Text>
          <Text style={styles.pointsSubtitle}>across all hawker stalls</Text>
        </View>
      </Card>
      
      <Text style={styles.sectionTitle}>Your Loyalty Status</Text>
      
      {loyaltyData.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="card-giftcard" size={60} color="#bdc3c7" />
          <Text style={styles.emptyText}>
            You haven't earned any loyalty points yet. Visit hawker stalls and place orders to start earning!
          </Text>
          <Button
            title="Browse Hawker Centers"
            buttonStyle={styles.browseButton}
            onPress={() => navigation.navigate('Hawkers')}
          />
        </View>
      ) : (
        <FlatList
          data={loyaltyData}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <Card containerStyle={styles.stallCard}>
              <View style={styles.stallHeader}>
                <View>
                  <Text style={styles.stallName}>{item.stall.name}</Text>
                  <Text style={styles.hawkerName}>{item.stall.hawker.name}</Text>
                </View>
                <Badge
                  value={item.tier}
                  badgeStyle={{ 
                    backgroundColor: getTierColor(item.tier),
                    paddingHorizontal: 15,
                    paddingVertical: 8
                  }}
                  textStyle={styles.badgeText}
                />
              </View>
              
              <View style={styles.pointsContainer}>
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoValue}>{item.points}</Text>
                  <Text style={styles.pointsInfoLabel}>Points</Text>
                </View>
                
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoValue}>{item.visits}</Text>
                  <Text style={styles.pointsInfoLabel}>Visits</Text>
                </View>
                
                <View style={styles.pointsInfo}>
                  <Text style={styles.pointsInfoValue}>
                    {item.tier === 'Bronze' ? 100 - item.points : 
                     item.tier === 'Silver' ? 250 - item.points : 
                     item.tier === 'Gold' ? 500 - item.points : 0}
                  </Text>
                  <Text style={styles.pointsInfoLabel}>Until Next Tier</Text>
                </View>
              </View>
              
              <Text style={styles.rewardsTitle}>Available Rewards</Text>
              
              {rewards
                .filter(reward => 
                  reward.stall._id === item.stall._id && 
                  reward.pointsRequired <= item.points
                )
                .map((reward) => (
                  <View key={reward._id} style={styles.rewardItem}>
                    <View style={styles.rewardInfo}>
                      <Text style={styles.rewardName}>{reward.name}</Text>
                      <Text style={styles.rewardDescription}>
                        {reward.description}
                      </Text>
                      <Text style={styles.pointsRequired}>
                        {reward.pointsRequired} points required
                      </Text>
                    </View>
                    <Button
                      title="Redeem"
                      buttonStyle={styles.redeemButton}
                      onPress={() => redeemReward(reward._id, item.stall._id, reward.pointsRequired)}
                    />
                  </View>
                ))
              }
              
              {rewards.filter(reward => 
                reward.stall._id === item.stall._id && 
                reward.pointsRequired <= item.points
              ).length === 0 && (
                <Text style={styles.noRewardsText}>
                  No rewards available for redemption yet. Earn more points to unlock rewards!
                </Text>
              )}
            </Card>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  pointsCard: {
    borderRadius: 10,
    padding: 20,
    margin: 15,
    backgroundColor: '#3498db'
  },
  pointsHeader: {
    alignItems: 'center'
  },
  pointsTitle: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 5
  },
  pointsValue: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 5
  },
  pointsSubtitle: {
    color: '#fff',
    fontSize: 14
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 24
  },
  browseButton: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 20,
    borderRadius: 8
  },
  stallCard: {
    borderRadius: 10,
    margin: 10,
    padding: 15
  },
  stallHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  stallName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  hawkerName: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  pointsInfo: {
    alignItems: 'center'
  },
  pointsInfoValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db'
  },
  pointsInfoLabel: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  rewardsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15
  },
  rewardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10
  },
  rewardInfo: {
    flex: 1,
    marginRight: 10
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  rewardDescription: {
    fontSize: 14,
    color: '#2c3e50',
    marginBottom: 5
  },
  pointsRequired: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  redeemButton: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 15,
    paddingVertical: 8
  },
  noRewardsText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 15
  }
});

export default LoyaltyScreen;