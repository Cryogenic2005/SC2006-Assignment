import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Badge, Icon } from 'react-native-elements';

const StallCard = ({ stall, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      <Card containerStyle={styles.card}>
        <View style={styles.headerContainer}>
          {stall.imageUrl ? (
            <Image 
              source={{ uri: stall.imageUrl }} 
              style={styles.image}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Icon name="restaurant" size={30} color="#bdc3c7" />
            </View>
          )}
          
          <View style={styles.headerInfo}>
            <Text style={styles.name}>{stall.name}</Text>
            <Text style={styles.cuisine}>{stall.cuisine}</Text>
          </View>
        </View>
        
        <View style={styles.badgeContainer}>
          {stall.isHalal && (
            <Badge
              value="Halal"
              badgeStyle={{ backgroundColor: '#3498db', marginRight: 5 }}
              textStyle={{ fontSize: 12 }}
            />
          )}
          
          {stall.isVegetarian && (
            <Badge
              value="Vegetarian"
              badgeStyle={{ backgroundColor: '#2ecc71', marginRight: 5 }}
              textStyle={{ fontSize: 12 }}
            />
          )}
          
          {stall.isVegan && (
            <Badge
              value="Vegan"
              badgeStyle={{ backgroundColor: '#27ae60', marginRight: 5 }}
              textStyle={{ fontSize: 12 }}
            />
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {stall.description || "No description available"}
        </Text>
        
        <View style={styles.footerContainer}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price Range:</Text>
            <Text style={styles.priceValue}>
              ${stall.minPrice.toFixed(2)} - ${stall.maxPrice.toFixed(2)}
            </Text>
          </View>
          
          <View style={styles.hoursContainer}>
            <Icon name="access-time" size={14} color="#7f8c8d" />
            <Text style={styles.hours}>{stall.operatingHours}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 12,
    margin: 8
  },
  headerContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  image: {
    width: 70,
    height: 70,
    borderRadius: 8
  },
  placeholderImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2
  },
  cuisine: {
    fontSize: 14,
    color: '#7f8c8d'
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 10
  },
  description: {
    fontSize: 14,
    marginBottom: 10,
    color: '#2c3e50'
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  priceLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginRight: 5
  },
  priceValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#e67e22'
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  hours: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 5
  }
});

export default StallCard;