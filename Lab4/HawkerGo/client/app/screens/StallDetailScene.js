import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Divider, Badge, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants';

const StallDetailScreen = ({ route, navigation }) => {
  const { stallId, stallName } = route.params;
  const [stall, setStall] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [queueStatus, setQueueStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  
  useEffect(() => {
    navigation.setOptions({
      title: stallName
    });
    
    fetchStallData();
  }, [stallId]);
  
  const fetchStallData = async () => {
    try {
      setLoading(true);
      
      // Get stall details
      const stallRes = await axios.get(`${API_URL}/api/stalls/${stallId}`);
      setStall(stallRes.data);
      
      // Get menu items
      const menuRes = await axios.get(`${API_URL}/api/stalls/${stallId}/menu`);
      setMenuItems(menuRes.data);
      
      // Get queue status
      const queueRes = await axios.get(`${API_URL}/api/queues/stall/${stallId}`);
      setQueueStatus(queueRes.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching stall data:', err);
      setLoading(false);
    }
  };
  
  const handlePlaceOrder = () => {
    navigation.navigate('Order', { stallId, stallName });
  };
  
  if (loading || !stall) {
    return (
      <View style={styles.center}>
        <Text>Loading stall details...</Text>
      </View>
    );
  }
  
  return (
    <ScrollView style={styles.container}>
      {stall.imageUrl ? (
        <Image source={{ uri: stall.imageUrl }} style={styles.coverImage} />
      ) : (
        <View style={styles.placeholderCover}>
          <Icon name="restaurant" size={60} color="#bdc3c7" />
        </View>
      )}
      
      <Card containerStyle={styles.infoCard}>
        <View style={styles.headerContainer}>
          <View>
            <Text style={styles.stallName}>{stall.name}</Text>
            <Text style={styles.cuisineType}>{stall.cuisine}</Text>
          </View>
          
          <View style={styles.badgeContainer}>
            {stall.isHalal && (
              <Badge
                value="Halal"
                badgeStyle={{ backgroundColor: '#3498db', marginRight: 5, paddingHorizontal: 10 }}
              />
            )}
            
            {stall.isVegetarian && (
              <Badge
                value="Vegetarian"
                badgeStyle={{ backgroundColor: '#2ecc71', marginRight: 5, paddingHorizontal: 10 }}
              />
            )}
          </View>
        </View>
        
        <Divider style={styles.divider} />
        
        <Text style={styles.description}>{stall.description}</Text>
        
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Icon name="access-time" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>{stall.operatingHours}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Icon name="attach-money" size={16} color="#7f8c8d" />
            <Text style={styles.infoText}>
              ${stall.minPrice.toFixed(2)} - ${stall.maxPrice.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
      
      {queueStatus && (
        <Card containerStyle={styles.queueCard}>
          <Card.Title>Queue Status</Card.Title>
          
          <View style={styles.queueInfo}>
            <View style={styles.queueItem}>
              <Text style={styles.queueLabel}>Current Number</Text>
              <Text style={styles.queueNumber}>{queueStatus.currentNumber}</Text>
            </View>
            
            <View style={styles.queueItem}>
              <Text style={styles.queueLabel}>Waiting Time</Text>
              <Text style={styles.queueTime}>~{queueStatus.estimatedWaitTime} mins</Text>
            </View>
            
            <View style={styles.queueItem}>
              <Text style={styles.queueLabel}>Status</Text>
              <Badge
                value={queueStatus.status === 'active' ? 'Open' : 'Closed'}
                badgeStyle={{ 
                  backgroundColor: queueStatus.status === 'active' ? '#2ecc71' : '#e74c3c',
                  paddingHorizontal: 10
                }}
              />
            </View>
          </View>
        </Card>
      )}
      
      <Card containerStyle={styles.menuCard}>
        <Card.Title>Menu Items</Card.Title>
        
        {menuItems.length === 0 ? (
          <Text style={styles.noMenuText}>No menu items available</Text>
        ) : (
          // screens/StallDetailScreen.js (continued)
          menuItems.map((item, index) => (
            <View key={item._id || index} style={styles.menuItem}>
              <View style={styles.menuItemInfo}>
                <Text style={styles.menuItemName}>{item.name}</Text>
                {item.description && (
                  <Text style={styles.menuItemDescription}>{item.description}</Text>
                )}
                <View style={styles.menuItemTags}>
                  {item.isSpicy && (
                    <Badge
                      value="Spicy"
                      badgeStyle={{ backgroundColor: '#e74c3c', marginRight: 5 }}
                      textStyle={{ fontSize: 10 }}
                    />
                  )}
                  {item.isSignature && (
                    <Badge
                      value="Signature"
                      badgeStyle={{ backgroundColor: '#f39c12', marginRight: 5 }}
                      textStyle={{ fontSize: 10 }}
                    />
                  )}
                </View>
              </View>
              <Text style={styles.menuItemPrice}>${item.price.toFixed(2)}</Text>
            </View>
          ))
        )}
      </Card>
      
      <Button
        title="Place Order"
        buttonStyle={styles.orderButton}
        containerStyle={styles.orderButtonContainer}
        onPress={handlePlaceOrder}
        icon={{
          name: 'shopping-cart',
          type: 'font-awesome',
          size: 16,
          color: 'white'
        }}
      />
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
  coverImage: {
    width: '100%',
    height: 200
  },
  placeholderCover: {
    width: '100%',
    height: 200,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  infoCard: {
    marginTop: -30,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    margin: 0,
    borderLeftWidth: 0,
    borderRightWidth: 0
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  stallName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5
  },
  cuisineType: {
    fontSize: 16,
    color: '#7f8c8d'
  },
  badgeContainer: {
    flexDirection: 'row'
  },
  divider: {
    marginVertical: 15
  },
  description: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 22
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  infoText: {
    marginLeft: 5,
    color: '#7f8c8d'
  },
  queueCard: {
    margin: 10,
    borderRadius: 10
  },
  queueInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  queueItem: {
    alignItems: 'center'
  },
  queueLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 5
  },
  queueNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3498db'
  },
  queueTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#f39c12'
  },
  menuCard: {
    margin: 10,
    borderRadius: 10,
    marginBottom: 80
  },
  noMenuText: {
    fontStyle: 'italic',
    color: '#7f8c8d',
    textAlign: 'center',
    padding: 20
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecf0f1'
  },
  menuItemInfo: {
    flex: 1,
    marginRight: 10
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 5
  },
  menuItemTags: {
    flexDirection: 'row'
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  orderButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20
  },
  orderButton: {
    backgroundColor: '#e67e22',
    borderRadius: 10,
    paddingVertical: 12
  }
});

export default StallDetailScreen;