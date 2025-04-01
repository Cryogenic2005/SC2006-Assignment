// screens/OrderHistoryScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Badge } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants/constants';
import moment from 'moment';

const OrderHistoryScreen = ({ navigation }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = useSelector(state => state.auth);
  const { token } = auth;

  const fetchOrders = async () => {
    try {
      const config = {
        headers: {
          'x-auth-token': token
        }
      };
      
      const res = await axios.get(`${API_URL}/api/orders/user`, config);
      setOrders(res.data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
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
        <Text>Loading your orders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Order History</Text>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't placed any orders yet</Text>
          <Button
            title="Browse Hawker Centers"
            onPress={() => navigation.navigate('Hawkers')}
            buttonStyle={styles.browseButton}
          />
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => navigation.navigate('OrderDetails', { orderId: item._id })}
            >
              <Card containerStyle={styles.orderCard}>
                <View style={styles.orderHeader}>
                  <Text style={styles.stallName}>{item.stall.name}</Text>
                  <Badge
                    value={getStatusText(item.status)}
                    badgeStyle={{ backgroundColor: getStatusColor(item.status) }}
                    textStyle={styles.badgeText}
                  />
                </View>
                
                <Text style={styles.orderDate}>
                  Ordered on {moment(item.created).format('MMM D, YYYY [at] h:mm A')}
                </Text>
                
                <View style={styles.orderSummary}>
                  <Text style={styles.itemCount}>{item.items.length} {item.items.length === 1 ? 'item' : 'items'}</Text>
                  <Text style={styles.orderTotal}>${item.totalAmount.toFixed(2)}</Text>
                </View>
                
                {item.status === 'pending' && (
                  <Button
                    title="Cancel Order"
                    type="outline"
                    buttonStyle={styles.cancelButton}
                    titleStyle={styles.cancelButtonTitle}
                    onPress={() => {
                      // Cancel order handler
                      navigation.navigate('OrderDetails', { 
                        orderId: item._id,
                        initialAction: 'cancel'
                      });
                    }}
                  />
                )}
              </Card>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 10
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginVertical: 15,
    marginLeft: 10
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  emptyText: {
    fontSize: 18,
    color: '#95a5a6',
    textAlign: 'center',
    marginBottom: 20
  },
  browseButton: {
    backgroundColor: '#e67e22',
    borderRadius: 8,
    paddingHorizontal: 20
  },
  orderCard: {
    borderRadius: 10,
    marginBottom: 10,
    padding: 15
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  stallName: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  orderDate: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15
  },
  itemCount: {
    fontSize: 16
  },
  orderTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  cancelButton: {
    borderColor: '#e74c3c',
    marginTop: 5
  },
  cancelButtonTitle: {
    color: '#e74c3c'
  }
});

export default OrderHistoryScreen;