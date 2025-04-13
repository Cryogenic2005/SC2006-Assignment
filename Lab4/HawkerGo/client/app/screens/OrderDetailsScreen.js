import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Animated } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Divider, Icon, Input } from 'react-native-elements';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const OrderDetailsScreen = ({ route, navigation }) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [review, setReview] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [queueInfo, setQueueInfo] = useState(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  const { orderId, initialAction } = route.params;

  // If initialAction is null, there's no action to perform
  const [performedInitialAction, setPerformedInitialAction] = useState(initialAction == null);

  // Animation function for status changes
  const startPulseAnimation = () => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.2, duration: 300, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 300, useNativeDriver: true })
    ]).start();
  };

  // Function to fetch queue position
  const fetchQueuePosition = async () => {
    if (!order || !['pending', 'preparing'].includes(order.status)) return;
    
    try {
      // setPositionLoading(true);
      // setPositionError(false);
      
      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const res = await axios.get(`${API_BASE_URL}/api/queues/user/position/${orderId}`, config);
      console.log('Queue data:', res.data);

      setQueueInfo(res.data);
      // setPositionLoading(false);
    } catch (err) {
      console.error('Error fetching queue position:', err);
      // setPositionError(true);
      // setPositionLoading(false);
    }
  };

  const fetchOrderDetails = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };

      const res = await axios.get(`${API_BASE_URL}/api/orders/${orderId}`, config);
      
      // Check if the status has changed and show notification
      if (order && order.status !== res.data.status) {
        setPreviousStatus(order.status);
        setStatusChangeVisible(true);
        startPulseAnimation();
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setStatusChangeVisible(false);
        }, 5000);
      }
      
      setOrder(res.data);
      setLoading(false);

    } catch (err) {
      console.error('Error fetching order details:', err);
      setLoading(false);
      Alert.alert('Error', 'Could not load order details');
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    
    // Poll for order updates
    const orderInterval = setInterval(fetchOrderDetails, 20000); // Update every 20 seconds
    
    return () => clearInterval(orderInterval);
  }, [orderId, initialAction]);

  // Set up polling for queue position updates
  useEffect(() => {
    if (!order) return;
    
    // Only fetch and poll if the order is pending or preparing
    if (['pending', 'preparing'].includes(order.status)) {
      fetchQueuePosition();
      const interval = setInterval(fetchQueuePosition, 15000); // Update every 15 seconds
      return () => clearInterval(interval);
    }
  }, [order]);

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
      
      await axios.put(`${API_BASE_URL}/api/orders/${orderId}/cancel`, {}, config);
      
      // Update local state
      setOrder({ ...order, status: 'cancelled' });
      setCancelLoading(false);

      navigation.goBack();

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

  const handleSubmitReview = async () => {
    try {
      setSubmittingReview(true);
      const config = { headers: { 'x-auth-token': token } };
      await axios.post(`${API_BASE_URL}/api/stalls/${order.stall._id}/reviews`, {
        text: review,
        orderId: order._id
      }, config);
      setReview('');
      setReviewSubmitted(true);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.msg || 'Could not submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
    const interval = setInterval(fetchOrderDetails, 20000);
    return () => clearInterval(interval);
  }, [orderId, initialAction]);

  if (loading) {
    return <View style={styles.center}><Text>Loading order details...</Text></View>;
  }

  if (!order) {
    return <View style={styles.center}><Text>Order not found</Text></View>;
  }

  // Handle initial actions
  if (!performedInitialAction){
    if (initialAction === 'cancel' && order.status === 'pending') {
      setPerformedInitialAction(true);
      confirmCancelOrder();
    }
  }

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Card containerStyle={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>Order #{order.queueNumber}</Text>
              <Text style={styles.stallName}>{order.stall.name}</Text>
              {queueInfo && (
                <Text style={{ color: '#7f8c8d' }}>Current queue: {queueInfo.currentNumber}</Text>
              )}
            </View>
        
            <View style={{
              backgroundColor: getStatusColor(order.status),
              paddingHorizontal: 15,
              paddingVertical: 6,
              borderRadius: 12
            }}>
              <Text style={styles.badgeText}>{getStatusText(order.status)}</Text>
            </View>
          </View>

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

        {['cancelled', 'completed', 'ready'].includes(order.status) && !reviewSubmitted && (
          <Card containerStyle={{ marginHorizontal: 15 }}>
            <Text style={styles.sectionTitle}>Leave a Review</Text>
            <Input
              placeholder="Write your review here..."
              value={review}
              onChangeText={setReview}
              multiline
            />
            <Button
              title="Submit Review"
              onPress={handleSubmitReview}
              loading={submittingReview}
              disabled={!review.trim()}
            />
          </Card>
        )}

        {reviewSubmitted && (
          <Card containerStyle={{ marginHorizontal: 15 }}>
            <Text style={{ color: '#2ecc71', textAlign: 'center' }}>Thanks for your review!</Text>
          </Card>
        )}
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f8f8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 10, padding: 15, margin: 15 },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  orderNumber: { fontSize: 16, fontWeight: 'bold', color: '#7f8c8d', marginBottom: 5 },
  stallName: { fontSize: 20, fontWeight: 'bold' },
  divider: { marginVertical: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16 },
  itemQuantity: { fontSize: 14, color: '#7f8c8d', marginTop: 3 },
  itemPrice: { fontSize: 16, fontWeight: 'bold' },
  totalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  totalText: { fontSize: 18, fontWeight: 'bold' },
  totalAmount: { fontSize: 20, fontWeight: 'bold', color: '#e67e22' },
  cancelButton: { backgroundColor: '#e74c3c', marginTop: 20, borderRadius: 8 },
  badgeText: { color: '#fff', fontWeight: 'bold', fontSize: 14 }
});

export default OrderDetailsScreen;
