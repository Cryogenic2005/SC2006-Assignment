import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Alert, TouchableOpacity, Switch } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Badge, Overlay, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const QueueManagementScreen = ({ route, navigation }) => {
  const [queue, setQueue] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queueActive, setQueueActive] = useState(true);
  const [waitTime, setWaitTime] = useState(10);
  const [isSettingsVisible, setIsSettingsVisible] = useState(false);
  // const [isFocused, setIsFocused] = useState(false);
  
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  
  const { user } = useSelector(state => state.auth);
  const [stallId, setStallId] = useState(null);
  
  useEffect(() => {
    console.log('User:', user);
    console.log('Stall ID:', stallId);

    if (stallId != null)
      fetchQueueData();
    
    // Set up polling for updates
    const interval = setInterval(fetchQueueData, 300000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, [stallId]);

  const fetchStallID = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const stallIdRes = await axios.get(`${API_BASE_URL}/api/stalls/owner/me`, config);
  
      setStallId(stallIdRes.data._id);
    } catch (err) {
      console.error('Error fetching stall ID:', err);
      Alert.alert('Error', 'Could not fetch stall ID');
    }
  };

  useEffect(() => {
    if (user) {
      fetchStallID();
    }
  }, [user]);

  const fetchQueueData = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      console.log('Fetching queue data...');
      console.log('Stall ID:', stallId);

      // Get queue status
      const queueRes = await axios.get(`${API_BASE_URL}/api/queues/stall/${stallId}`, config);
      setQueue(queueRes.data);
      setQueueActive(queueRes.data.status === 'active');
      setWaitTime(queueRes.data.averageWaitTime);
      
      // Get pending orders
      const ordersRes = await axios.get(`${API_BASE_URL}/api/orders/stall/${stallId}`, config);
      setOrders(ordersRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching queue data:', err);
      setLoading(false);
      Alert.alert('Error', 'Could not load queue data');
    }
  };
  
  const updateQueueSettings = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const updateData = {
        status: queueActive ? 'active' : 'paused',
        averageWaitTime: waitTime
      };
      
      await axios.put(`${API_BASE_URL}/api/queues/stall/${stallId}`, updateData, config);
      
      setIsSettingsVisible(false);
      fetchQueueData();
      
      Alert.alert('Success', 'Queue settings updated');
    } catch (err) {
      Alert.alert('Error', 'Could not update queue settings');
    }
  };
  
  const resetQueue = async () => {
    Alert.alert(
      'Reset Queue',
      'Are you sure you want to reset the queue? This will clear all queue numbers.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: async () => {
            try {
              const config = {
                headers: {
                  'x-auth-token': token
                }
              };
              
              await axios.put(`${API_BASE_URL}/api/queues/stall/${stallId}/reset`, {}, config);
              
              fetchQueueData();
              Alert.alert('Success', 'Queue has been reset');
            } catch (err) {
              Alert.alert('Error', 'Could not reset queue');
            }
          }
        }
      ]
    );
  };
  
  const updateOrderStatus = async (orderId, status) => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      await axios.put(`${API_BASE_URL}/api/orders/${orderId}/status`, { status }, config);
      
      // Update local state
      setOrders(orders.map(order => 
        order._id === orderId ? { ...order, status } : order
      ));
      
      if (status === 'completed') {
        // Remove from list if completed
        setTimeout(() => {
          setOrders(orders.filter(order => order._id !== orderId));
        }, 2000);
      }
      
      fetchQueueData(); // Refresh queue numbers
    } catch (err) {
      Alert.alert('Error', 'Could not update order status');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'preparing': return '#3498db';
      case 'ready': return '#2ecc71';
      default: return '#95a5a6';
    }
  };
  
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading queue data...</Text>
      </View>
    );
  }

  if (!queue) {
    return (
      <View style={styles.center}>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>No Queue Found</Text>
        <Text style={{ marginTop: 10, color: '#7f8c8d', textAlign: 'center', paddingHorizontal: 20 }}>
          You haven't set up a stall yet, or the queue hasn't been initialized.
          Please add your stall under a hawker centre to start managing your queue.
        </Text>
      </View>
    );
  }
  
  
  return (
    <View style={styles.container}>
      <Card containerStyle={styles.queueStatusCard}>
        <View style={styles.queueHeader}>
          <Text style={styles.queueTitle}>Queue Status</Text>
          <TouchableOpacity 
            onPress={() => setIsSettingsVisible(true)}
            style={styles.settingsButton}
          >
            <Icon name="settings" size={24} color="#7f8c8d" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.queueInfo}>
          <View style={styles.queueNumberContainer}>
            <Text style={styles.queueLabel}>Now Serving</Text>
            <Text style={styles.queueNumber}>
              {queue ? queue.currentNumber : '--'}
            </Text>

          </View>
          
          <View style={styles.queueStatsContainer}>
            <View style={styles.queueStat}>
              <Text style={styles.statLabel}>Last Number</Text>
              <Text style={styles.statValue}>{queue.lastNumber}</Text>
            </View>
            
            <View style={styles.queueStat}>
              <Text style={styles.statLabel}>Wait Time</Text>
              <Text style={styles.statValue}>{queue.averageWaitTime} min</Text>
            </View>
            
            <View style={styles.queueStat}>
              <Text style={styles.statLabel}>Pending</Text>
              <Text style={styles.statValue}>{queue.pendingOrders}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.queueActions}>
          <Badge
            value={queue.status === 'active' ? 'Active' : 'Paused'}
            badgeStyle={{ 
              backgroundColor: queue.status === 'active' ? '#2ecc71' : '#e74c3c',
              paddingHorizontal: 15,
              paddingVertical: 10
            }}
            textStyle={styles.badgeText}
          />
          
          <Button
            title="Reset Queue"
            type="outline"
            buttonStyle={styles.resetButton}
            titleStyle={styles.resetButtonText}
            onPress={resetQueue}
          />
        </View>
      </Card>
      
      <Text style={styles.ordersTitle}>Pending Orders</Text>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending orders</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          renderItem={({ item }) => (
            <Card containerStyle={styles.orderCard}>
              <View style={styles.orderHeader}>
                <View>
                  <Text style={styles.orderNumber}>#{item.queueNumber}</Text>
                  <Badge
                    value={item.status}
                    badgeStyle={{ backgroundColor: getStatusColor(item.status) }}
                  />
                </View>
                <Text style={styles.orderTime}>
                  {new Date(item.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              
              <View style={styles.orderItems}>
                {item.items.map((orderItem, index) => (
                  <Text key={index} style={styles.orderItem}>
                    {orderItem.quantity}x {orderItem.name}
                  </Text>
                ))}
              </View>
              
              <View style={styles.orderActions}>
                {item.status === 'pending' && (
                  <Button
                    title="Prepare"
                    buttonStyle={[styles.actionButton, { backgroundColor: '#3498db' }]}
                    onPress={() => updateOrderStatus(item._id, 'preparing')}
                  />
                )}
                
                {item.status === 'preparing' && (
                  <Button
                    title="Ready"
                    buttonStyle={[styles.actionButton, { backgroundColor: '#2ecc71' }]}
                    onPress={() => updateOrderStatus(item._id, 'ready')}
                  />
                )}
                
                {item.status === 'ready' && (
                  <Button
                    title="Complete"
                    buttonStyle={[styles.actionButton, { backgroundColor: '#27ae60' }]}
                    onPress={() => updateOrderStatus(item._id, 'completed')}
                  />
                )}
                
                {item.status !== 'ready' && (<Button
                  title="Cancel"
                  type="outline"
                  buttonStyle={styles.cancelButton}
                  titleStyle={styles.cancelButtonText}
                  onPress={() => updateOrderStatus(item._id, 'cancelled')}
                />)}
              </View>
            </Card>
          )}
        />
      )}
      
      {/* Queue Settings Overlay */}
      <Overlay
        isVisible={isSettingsVisible}
        onBackdropPress={() => setIsSettingsVisible(false)}
        overlayStyle={styles.overlay}
      >
        <Text style={styles.overlayTitle}>Queue Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Queue Status</Text>
          <View style={styles.switchContainer}>
            <Text style={{ color: queueActive ? '#bdc3c7' : '#e74c3c' }}>Paused</Text>
            <Switch
              value={queueActive}
              onValueChange={setQueueActive}
              trackColor={{ false: '#bdc3c7', true: '#2ecc71' }}
              thumbColor={queueActive ? '#27ae60' : '#e74c3c'}
              style={styles.switch}
            />
            <Text style={{ color: queueActive ? '#2ecc71' : '#bdc3c7' }}>Active</Text>
          </View>
        </View>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Average Wait Time (minutes)</Text>
          <View style={styles.waitTimeContainer}>
            <Button
              icon={{ name: 'remove', color: '#fff' }}
              buttonStyle={styles.waitTimeButton}
              onPress={() => setWaitTime(Math.max(1, waitTime - 1))}
            />
            <Text style={styles.waitTimeValue}>{waitTime}</Text>
            <Button
              icon={{ name: 'add', color: '#fff' }}
              buttonStyle={styles.waitTimeButton}
              onPress={() => setWaitTime(waitTime + 1)}
            />
          </View>
        </View>
        
        <Button
          title="Save Settings"
          buttonStyle={styles.saveButton}
          onPress={updateQueueSettings}
        />
      </Overlay>
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
  queueStatusCard: {
    borderRadius: 10,
    padding: 15,
    margin: 15
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  queueTitle: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  settingsButton: {
    padding: 5
  },
  queueInfo: {
    flexDirection: 'row',
    marginBottom: 20
  },
  queueNumberContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 15,
    padding: 15,
    marginRight: 15,
    width: 120,
    height: 120
  },
  queueLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 5
  },
  queueNumber: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold'
  },
  queueStatsContainer: {
    flex: 1,
    justifyContent: 'space-around'
  },
  queueStat: {
    marginBottom: 10
  },
  statLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  queueActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  resetButton: {
    borderColor: '#e74c3c',
    borderWidth: 1,
    paddingHorizontal: 15
  },
  resetButtonText: {
    color: '#e74c3c'
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 15,
    marginTop: 10,
    marginBottom: 5
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6'
  },
  orderCard: {
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 15,
    marginVertical: 8
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  orderTime: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  orderItems: {
    marginBottom: 15
  },
  orderItem: {
    fontSize: 15,
    marginBottom: 5
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  actionButton: {
    flex: 1,
    marginRight: 10,
    borderRadius: 5
  },
  cancelButton: {
    borderColor: '#e74c3c',
    borderWidth: 1,
    borderRadius: 5
  },
  cancelButtonText: {
    color: '#e74c3c'
  },
  overlay: {
    width: '90%',
    borderRadius: 10,
    padding: 20
  },
  overlayTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  settingRow: {
    marginBottom: 20
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 10
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  switch: {
    marginHorizontal: 10
  },
  waitTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  waitTimeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    padding: 0,
    backgroundColor: '#3498db'
  },
  waitTimeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20
  },
  saveButton: {
    backgroundColor: '#2ecc71',
    borderRadius: 5
  }
});

export default QueueManagementScreen;