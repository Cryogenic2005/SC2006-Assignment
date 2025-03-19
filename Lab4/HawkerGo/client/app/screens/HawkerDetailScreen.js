import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Icon, Divider } from 'react-native-elements';
import { getHawkerById, getStallsByHawker } from '../store/slices/hawkerSlice';
import StallCard from '../components/StallCard';
import MapView, { Marker } from 'react-native-maps';
import { calculateRoute } from '../services/locationService';

const HawkerDetailScreen = ({ route, navigation }) => {
  const { hawkerId, hawkerName } = route.params;
  const [routeOptions, setRouteOptions] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  
  const dispatch = useDispatch();
  const { currentHawker, stallsByHawker, crowdLevels, loading } = useSelector(state => state.hawkers);
  
  useEffect(() => {
    navigation.setOptions({
      title: hawkerName
    });
    
    dispatch(getHawkerById(hawkerId));
    dispatch(getStallsByHawker(hawkerId));
    
    // Get user location and calculate route options
    const getLocationAndRoutes = async () => {
      try {
        const location = await getCurrentLocation();
        setUserLocation(location);
        
        if (currentHawker && currentHawker.location && location) {
          const routes = await calculateRoute(
            location.latitude,
            location.longitude,
            currentHawker.location.coordinates[1],
            currentHawker.location.coordinates[0]
          );
          
          setRouteOptions(routes);
        }
      } catch (error) {
        console.error('Error calculating routes:', error);
      }
    };
    
    if (currentHawker) {
      getLocationAndRoutes();
    }
  }, [hawkerId, currentHawker]);
  
  const getCrowdLevelColor = (level) => {
    switch (level) {
      case 'Low': return '#2ecc71';
      case 'Medium': return '#f39c12';
      case 'High': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  const openMaps = () => {
    if (currentHawker && currentHawker.location) {
      const { coordinates } = currentHawker.location;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates[1]},${coordinates[0]}&travelmode=driving`;
      Linking.openURL(url);
    }
  };
  
  if (loading || !currentHawker) {
    return (
      <View style={styles.center}>
        <Text>Loading hawker center details...</Text>
      </View>
    );
  }
  
  const stalls = stallsByHawker[hawkerId] || [];
  const crowdLevel = crowdLevels[hawkerId]?.level || 'Unknown';
  
  return (
    <ScrollView style={styles.container}>
      <Card containerStyle={styles.mapCard}>
        {currentHawker.location && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: currentHawker.location.coordinates[1],
              longitude: currentHawker.location.coordinates[0],
              latitudeDelta: 0.003,
              longitudeDelta: 0.003,
            }}
          >
            <Marker
              coordinate={{
                latitude: currentHawker.location.coordinates[1],
                longitude: currentHawker.location.coordinates[0],
              }}
              title={currentHawker.name}
            />
          </MapView>
        )}
        
        <View style={styles.addressContainer}>
          <Text style={styles.address}>{currentHawker.address}</Text>
          <TouchableOpacity onPress={openMaps}>
            <Text style={styles.directionsLink}>Get Directions</Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      <View style={styles.infoCardsContainer}>
        <Card containerStyle={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <Icon name="people" size={24} color="#3498db" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Current Crowd</Text>
              <Text style={[styles.infoValue, { color: getCrowdLevelColor(crowdLevel) }]}>
                {crowdLevel}
              </Text>
            </View>
          </View>
          <Button
            title="Report Crowd"
            type="clear"
            titleStyle={{ color: '#3498db' }}
            onPress={() => navigation.navigate('CrowdReport', { 
              hawkerId, 
              hawkerName: currentHawker.name 
            })}
          />
        </Card>
        
        <Card containerStyle={styles.infoCard}>
          <View style={styles.infoCardContent}>
            <Icon name="access-time" size={24} color="#e67e22" />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>Operating Hours</Text>
              <Text style={styles.infoValue}>{currentHawker.operatingHours}</Text>
            </View>
          </View>
        </Card>
      </View>
      
      {routeOptions.length > 0 && (
        <Card containerStyle={styles.routeCard}>
          <Card.Title>Travel Options</Card.Title>
          {routeOptions.map((option, index) => (
            <View key={index} style={styles.routeOption}>
              <View style={styles.routeIconContainer}>
                <Icon
                  name={option.mode === 'walking' ? 'directions-walk' : 'directions-bus'}
                  size={24}
                  color="#3498db"
                />
              </View>
              <View style={styles.routeDetails}>
                <Text style={styles.routeMode}>
                  {option.mode === 'walking' ? 'Walking' : 'Public Transport'}
                </Text>
                <Text style={styles.routeDistance}>
                  {option.distance < 1 
                    ? `${Math.round(option.distance * 1000)}m` 
                    : `${option.distance.toFixed(1)}km`}
                  {' • '}
                  {Math.round(option.duration)} mins
                </Text>
                <Text style={styles.routeInstructions}>{option.instructions}</Text>
              </View>
            </View>
          ))}
        </Card>
      )}
      
      <Text style={styles.stallsTitle}>Available Stalls ({stalls.length})</Text>
      
      <FlatList
        data={stalls}
        renderItem={({ item }) => (
          <StallCard
            stall={item}
            onPress={() => navigation.navigate('StallDetail', { 
              stallId: item._id,
              stallName: item.name
            })}
          />
        )}
        keyExtractor={item => item._id}
        scrollEnabled={false}
        ListEmptyComponent={
          <View style={styles.emptyStallsContainer}>
            <Text style={styles.emptyStallsText}>No stalls information available</Text>
          </View>
        }
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
  mapCard: {
    padding: 0,
    margin: 10,
    borderRadius: 10,
    overflow: 'hidden'
  },
  map: {
    width: '100%',
    height: 180
  },
  addressContainer: {
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  address: {
    flex: 1,
    fontSize: 14,
    color: '#2c3e50'
  },
  directionsLink: {
    color: '#3498db',
    fontSize: 14,
    fontWeight: 'bold'
  },
  infoCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 5
  },
  infoCard: {
    flex: 1,
    margin: 5,
    borderRadius: 10,
    padding: 10
  },
  infoCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  infoTextContainer: {
    marginLeft: 10
  },
  infoLabel: {
    fontSize: 12,
    color: '#7f8c8d'
  },
  infoValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  routeCard: {
    margin: 10,
    borderRadius: 10,
    padding: 15
  },
  routeOption: {
    flexDirection: 'row',
    marginBottom: 15
  },
  routeIconContainer: {
    marginRight: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ecf0f1',
    justifyContent: 'center',
    alignItems: 'center'
  },
  routeDetails: {
    flex: 1
  },
  routeMode: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 3
  },
  routeDistance: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 3
  },
  routeInstructions: {
    fontSize: 14,
    color: '#2c3e50'
  },
  stallsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 15
  },
  emptyStallsContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyStallsText: {
    color: '#7f8c8d',
    fontStyle: 'italic'
  }
});

export default HawkerDetailScreen;