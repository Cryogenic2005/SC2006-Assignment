import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Badge, Divider, Icon, Overlay } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants';
import moment from 'moment';

const OrderDetailsScreen = ({ route, navigation }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [queuePosition, setQueuePosition] = useState(null);
  const [previousStatus, setPreviousStatus] = useState(null);
  const [statusChangeVisible, setStatusChangeVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const auth = useSelector(state => state.auth);
  const { token } = auth;

  const { orderId, initialAction } = route.params;

  // Function to fetch queue position
  const fetchQueuePosition = async () => {
    if (!order || !['pending', 'preparing'].includes(order.status)) return;
    
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`${API_URL}/api/queues/user/position/${orderId}`, config);
      setQueuePosition(res.data);
    } catch (err) {
      console.error('Error fetching queue position:', err);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const config = {
          headers: {
            'x-auth-token': token
          }
        };

        const res = await axios.get(`${API_URL}/api/orders/${orderId}`, config);
        setOrder(res.data);
        setLoading(false);

        // Handle initial actions
        if (initialAction === 'cancel' && res.data.status === 'pending') {
          confirmCancelOrder();
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setLoading(false);
        Alert.alert('Error', 'Could not load order details');
      }
    };

    fetchOrderDetails();
  }, [orderId, initialAction]);
  
  // Set up polling for queue position updates
  useEffect(() => {
    if (!order) return;
    
    fetchQueuePosition();
    
    // Only poll if the order is pending or preparing
    if (['pending', 'preparing'].includes(order.status)) {
      const interval = setInterval(fetchQueuePosition, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [order]);
        // If order is active, fetch queue position and set up polling
        if (res.data.status === 'pending' || res.data.status === 'preparing') {
          fetchQueuePosition();
          
          // Poll for queue position updates every 15 seconds
          intervalId = setInterval(fetchQueuePosition, 15000);
        }
      } catch (err) {
        console.error('Error fetching order details:', err);
        setLoading(false);
        Alert.alert('Error', 'Could not load order details');
      }
    };
    
    const fetchQueuePosition = async () => {
      try {
        setPositionLoading(true);
        setPositionError(false);
        
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const res = await axios.get(`${API_URL}/api/queues/user/position/${orderId}`, config);
        setQueuePosition(res.data);
        setPositionLoading(false);
      } catch (err) {
        console.error('Error fetching queue position:', err);
        setPositionError(true);
        setPositionLoading(false);
      }
    };

    fetchOrderDetails();
    
    // Clean up interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [orderId, initialAction]);
  
  const confirmCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes', onPress: handleCancelOrder }
      ]
    );
  };
  
  const handleCancelOrder = async () => {
    try {
      setCancelLoading(true);
      
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      await axios.put(`${API_URL}/api/orders/${orderId}/cancel`, {}, config);
      
      // Update local state
      setOrder({ ...order, status: 'cancelled' });
      setCancelLoading(false);
      
      Alert.alert('Success', 'Your order has been cancelled');
    } catch (err) {
      setCancelLoading(false);
      Alert.alert('Error', err.response?.data?.msg || 'Could not cancel your order');
    }
  };
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return '#f39c12';
      case 'preparing': return '#3498db';
      case 'ready': return '#2ecc71';
      case 'completed': return '#27ae60';
      case 'cancelled': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  const getStatusText = (status) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready for Pickup';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };
  
  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading order details...</Text>
      </View>
    );
  }
  
  if (!order) {
    return (
      <View style={styles.center}>
        <Text>Order not found</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.card}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{order.queueNumber}</Text>
            <Text style={styles.stallName}>{order.stall.name}</Text>
          </View>
          <Badge
            value={getStatusText(order.status)}
            badgeStyle={{ 
              backgroundColor: getStatusColor(order.status),
              paddingHorizontal: 15,
              paddingVertical: 10
            }}
            textStyle={styles.badgeText}
          />
        </View>
        
        <Divider style={styles.divider} />
        
        <View style={styles.orderInfo}>
          <Text style={styles.infoHeading}>Order Date</Text>
          <Text style={styles.infoText}>
            {moment(order.created).format('MMM D, YYYY [at] h:mm A')}
          </Text>
        </View>
        
        {order.estimatedWaitTime && (
          <View style={styles.orderInfo}>
            <Text style={styles.infoHeading}>Estimated Wait Time</Text>
            <Text style={styles.infoText}>{queuePosition?.estimatedWaitTime || order.estimatedWaitTime} minutes</Text>
          </View>
        )}
        
        {queuePosition && queuePosition.position > 0 && (order.status === 'pending' || order.status === 'preparing') && (
          <View style={styles.orderInfo}>
            <Text style={styles.infoHeading}>Queue Position</Text>
            <View style={styles.queuePositionContainer}>
              <Text style={styles.positionText}>You are position #{queuePosition.position} in line</Text>
              <Text style={styles.currentNumberText}>
                Now serving: #{queuePosition.currentNumber}
              </Text>
              <View style={styles.progressContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    {
                      width: `${Math.min(100, 100 * (1 - queuePosition.position / (queuePosition.position + 5)))}%`,
                      backgroundColor: getStatusColor(order.status)
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}
        
        <Divider style={styles.divider} />
        
        <Text style={styles.sectionTitle}>Items</Text>
        
        {order.items.map((item, index) => (
          <View key={index} style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemQuantity}>x{item.quantity}</Text>
            </View>
            <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
        
        <Divider style={styles.divider} />
        
        <View style={styles.totalContainer}>
          <Text style={styles.totalText}>Total</Text>
          <Text style={styles.totalAmount}>${order.totalAmount.toFixed(2)}</Text>
        </View>
        
        {order.status === 'pending' && (
          <Button
            title="Cancel Order"
            buttonStyle={styles.cancelButton}
            loading={cancelLoading}
            onPress={confirmCancelOrder}
            icon={<Icon name="close" color="#fff" size={16} style={{ marginRight: 5 }} />}
          />
        )}
      </Card>
      
      {(order.status === 'ready' || order.status === 'preparing' || order.status === 'pending') && (
        <Card containerStyle={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {order.status === 'ready'
              ? 'Your order is ready for pickup!'
              : order.status === 'preparing'
              ? 'Your order is being prepared'
              : 'Your order is in queue'}
          </Text>
          
          {queuePosition && (order.status === 'pending' || order.status === 'preparing') && (
          {positionLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#3498db" />
              <Text style={styles.loadingText}>Getting your position in queue...</Text>
            </View>
          ) : positionError ? (
            <View style={styles.errorContainer}>
              <Icon name="error-outline" size={40} color="#e74c3c" />
              <Text style={styles.errorText}>Couldn't retrieve queue position</Text>
              <Button
                title="Try Again"
                type="clear"
                onPress={fetchQueuePosition}
                buttonStyle={styles.retryButton}
              />
            </View>
          ) : queuePosition && (
            <View style={styles.queuePositionContainer}>
              <View style={styles.queuePositionBadge}>
                <Text style={styles.queuePositionNumber}>{queuePosition.position}</Text>
              </View>
              <Text style={styles.queuePositionText}>
                {queuePosition.position === 0 
                  ? 'You are next in line!'
                  : `There ${queuePosition.position === 1 ? 'is' : 'are'} ${queuePosition.position} order${queuePosition.position === 1 ? '' : 's'} ahead of you`}
              </Text>
              <Text style={styles.queueInfoText}>Current serving: #{queuePosition.currentNumber}</Text>
              <Text style={styles.queueInfoText}>Your number: #{queuePosition.queueNumber}</Text>
              
              {/* Queue progress bar */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        width: `${Math.min(100, Math.max(5, (queuePosition.currentNumber / queuePosition.lastNumber) * 100))}%`,
                        backgroundColor: queuePosition.position === 0 ? '#2ecc71' : '#3498db'
                      }
                    ]} 
                  />
                </View>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabel}>Queue Start</Text>
                  <Text style={styles.progressLabel}>Your Order</Text>
                </View>
              </View>
              
              <Text style={styles.estimatedTimeText}>
                Estimated wait: ~{queuePosition.estimatedWaitTime} minutes
              </Text>
            </View>
          )}
          
          <Text style={styles.instructionText}>
            {order.status === 'ready'
              ? 'Head to the stall and show this order screen to collect your food.'
              : queuePosition
                ? 'We\'ll notify you when your order is ready for pickup.'
                : `Your food is being prepared. Estimated wait time: ${order.estimatedWaitTime} minutes.`}
          </Text>
        </Card>
      )}
    </ScrollView>
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
  card: {
    borderRadius: 10,
    padding: 15,
    margin: 15
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7f8c8d',
    marginBottom: 5
  },
  stallName: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  divider: {
    marginVertical: 15
  },
  orderInfo: {
    marginBottom: 15
  },
  infoHeading: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  infoText: {
    fontSize: 16
  },
  queuePositionContainer: {
    marginTop: 5
  },
  positionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  currentNumberText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8
  },
  progressContainer: {
    height: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 5
  },
  progressBar: {
    height: '100%',
    borderRadius: 10
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16
  },
  itemQuantity: {
    fontSize: 14,
    color: '#7f8c8d',
    marginTop: 3
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    marginTop: 20,
    borderRadius: 8
  },
  instructionCard: {
    borderRadius: 10,
    padding: 15,
    margin: 15,
    backgroundColor: '#e8f8f5',
    borderColor: '#2ecc71'
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 10
  },
  instructionText: {
    fontSize: 16,
    lineHeight: 22
  },
  queuePositionContainer: {
    alignItems: 'center',
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f8fffa',
    borderRadius: 8
  },
  queuePositionBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10
  },
  queuePositionNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  queuePositionText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  queueInfoText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
  },
  estimatedTimeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e67e22',
    marginTop: 10,
    textAlign: 'center'
  },
  progressContainer: {
    width: '100%',
    marginVertical: 15
  },
  progressBar: {
    height: 10,
    backgroundColor: '#ecf0f1',
    borderRadius: 5,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 5
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5
  },
  progressLabel: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  loaderContainer: {
    alignItems: 'center',
    paddingVertical: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#7f8c8d'
  },
  errorContainer: {
    alignItems: 'center',
    padding: 20
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#e74c3c'
  },
  retryButton: {
    marginTop: 10
  }
});

export default OrderDetailsScreen;
