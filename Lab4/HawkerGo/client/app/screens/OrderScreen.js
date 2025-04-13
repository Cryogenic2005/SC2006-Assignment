import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Divider, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const OrderScreen = ({ route, navigation }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stall, setStall] = useState(null);
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

  
  useEffect(() => {
    const { stallId } = route.params;
    
    const fetchStallData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_BASE_URL}/api/stalls/${stallId}`);
        setStall(res.data);
        
        // Get menu items for this stall
        const menuRes = await axios.get(`${API_BASE_URL}/api/stalls/${stallId}/menu`);
        setItems(menuRes.data);
        setLoading(false);
      } catch (err) {
        Alert.alert('Error', 'Could not load stall data');
        setLoading(false);
      }
    };
    
    fetchStallData();
  }, [route.params]);
  
  const [cart, setCart] = useState([]);
  
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item._id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item._id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, {
        id: item._id,
        name: item.name,
        price: item.price,
        quantity: 1
      }]);
    }
  };
  
  const removeFromCart = (itemId) => {
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem.quantity === 1) {
      setCart(cart.filter(item => item.id !== itemId));
    } else {
      setCart(cart.map(item => 
        item.id === itemId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    }
  };
  
  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };
  
  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    
    try {
      setLoading(true);
      
      const orderData = {
        stallId: stall._id,
        items: cart.map(item => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const res = await axios.post(`${API_BASE_URL}/api/orders`, orderData, config);
      
      setLoading(false);
      setCart([]);
      
      Alert.alert(
        'Order Placed!',
        `Your order has been placed. Queue number: ${res.data.queueNumber}`,
        [
          { 
            text: 'View Order', 
            onPress: () => navigation.navigate('OrderDetails', { orderId: res.data._id }) 
          },
          { 
            text: 'OK', 
            onPress: () => navigation.navigate('Hawkers') 
          }
        ]
      );
      
    } catch (err) {
      setLoading(false);
      Alert.alert('Error', err.response?.data?.msg || 'Could not place your order');
    }
  };
  
  if (!stall) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      
      <Text style={styles.sectionTitle}>Menu</Text>
      
      <View style={styles.listContainer}>
      <FlatList
        data={items}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <Card containerStyle={styles.itemCard}>
            <View style={styles.itemContainer}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={() => addToCart(item)}
              >
                <Icon name="add" color="#fff" />
              </TouchableOpacity>
            </View>
          </Card>
          )}
          contentContainerStyle={{ paddingBottom: cart.length > 0 ? 150 : 10 }}
      />
      </View>
      
      {cart.length > 0 && (
        <View style={styles.cartContainer}>
          <Text style={styles.cartTitle}>Your Order</Text>
          
          {cart.map(item => (
            <View key={item.id} style={styles.cartItem}>
              <Text>{item.name} x {item.quantity}</Text>
              <Text>${(item.price * item.quantity).toFixed(2)}</Text>
              <View style={styles.cartItemButtons}>
                <TouchableOpacity onPress={() => removeFromCart(item.id)}>
                  <Icon name="remove" size={18} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => addToCart({ _id: item.id, ...item })}>
                  <Icon name="add" size={18} />
                </TouchableOpacity>
              </View>
            </View>
          ))}
          
          <Divider style={styles.divider} />
          
          <View style={styles.totalContainer}>
            <Text style={styles.totalText}>Total:</Text>
            <Text style={styles.totalAmount}>${calculateTotal().toFixed(2)}</Text>
          </View>
          
          <Button
            title="Place Order"
            onPress={placeOrder}
            buttonStyle={styles.placeOrderButton}
            loading={loading}
          />
        </View>
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
  stallCard: {
    margin: 10,
    borderRadius: 10
  },
  stallInfo: {
    marginBottom: 5,
    fontSize: 14
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 10
  },
  itemCard: {
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 10,
    marginBottom: 5
  },
  itemContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  itemDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  addButton: {
    backgroundColor: '#e67e22',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    flex: 1, 
  },
  cartContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  cartItemButtons: {
    flexDirection: 'row',
    width: 60,
    justifyContent: 'space-between'
  },
  divider: {
    marginVertical: 10
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 10
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  placeOrderButton: {
    backgroundColor: '#e67e22',
    borderRadius: 8
  }
});

export default OrderScreen;
