import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Card, Badge, Icon } from 'react-native-elements';

const HawkerCard = ({ hawker, crowdLevel, distance, onPress }) => {
  const getCrowdLevelColor = (level) => {
    switch (level) {
      case 'Low': return '#2ecc71';
      case 'Medium': return '#f39c12';
      case 'High': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card containerStyle={styles.card}>
        {hawker.imageUrl ? (
          <Image 
            source={{ uri: hawker.imageUrl }} 
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Icon name="restaurant" size={40} color="#bdc3c7" />
          </View>
        )}
        
        <View style={styles.contentContainer}>
          <Text style={styles.name}>{hawker.name}</Text>
          <Text style={styles.address} numberOfLines={2}>{hawker.address}</Text>
          
          <View style={styles.infoContainer}>
            {crowdLevel && (
              <View style={styles.infoItem}>
                <Badge
                  value={crowdLevel}
                  badgeStyle={{ 
                    backgroundColor: getCrowdLevelColor(crowdLevel),
                    paddingHorizontal: 8,
                    marginRight: 5
                  }}
                  textStyle={{ fontSize: 12, fontWeight: 'bold' }}
                />
              </View>
            )}
            
            {distance !== null && (
              <View style={styles.infoItem}>
                <Icon name="place" size={16} color="#7f8c8d" />
                <Text style={styles.infoText}>
                  {distance < 1 
                    ? `${Math.round(distance * 1000)}m` 
                    : `${distance.toFixed(1)}km`}
                </Text>
              </View>
            )}
            
            <View style={styles.infoItem}>
              <Icon name="store" size={16} color="#7f8c8d" />
              <Text style={styles.infoText}>
                {hawker.stallCount || hawker.stalls?.length || 0} stalls
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    padding: 0,
    margin: 10,
    overflow: 'hidden'
  },
  image: {
    width: '100%',
    height: 120
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  contentContainer: {
    padding: 15
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5
  },
  address: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 10
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    marginBottom: 5
  },
  infoText: {
    fontSize: 13,
    color: '#7f8c8d',
    marginLeft: 3
  }
});

export default HawkerCard;