import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Badge, Divider, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants/constants';
import moment from 'moment';

const OrderDetailsScreen = ({ route, navigation }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  
  const { orderId, initialAction } = route.params;
  
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
            <Text style={styles.infoText}>{order.estimatedWaitTime} minutes</Text>
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
      
      {(order.status === 'ready' || order.status === 'preparing') && (
        <Card containerStyle={styles.instructionCard}>
          <Text style={styles.instructionTitle}>
            {order.status === 'ready' 
              ? 'Your order is ready for pickup!' 
              : 'Your order is being prepared'}
          </Text>
          <Text style={styles.instructionText}>
            {order.status === 'ready'
              ? 'Head to the stall and show this order screen to collect your food.'
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
    marginBottom: 10
  },
  infoHeading: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3
  },
  infoText: {
    fontSize: 16
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
  }
});

export default OrderDetailsScreen;