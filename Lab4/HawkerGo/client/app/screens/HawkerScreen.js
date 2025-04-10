import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { SearchBar, Button } from 'react-native-elements';
import { getHawkers, getCrowdLevels } from '../store/slices/hawkerSlice';
import { getUserPreferences } from '../store/slices/preferencesSlice';
import { getRecommendations } from '../services/recommendationService';
import { getCurrentLocation, getNearbyHawkers, calculateDistance } from '../services/locationService'; 
import HawkerCard from '../components/HawkerCard';

const HawkersScreen = ({ navigation }) => {
  const [search, setSearch] = useState('');
  const [filteredHawkers, setFilteredHawkers] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isRecommending, setIsRecommending] = useState(false);
  
  const dispatch = useDispatch();
  const { hawkers, crowdLevels, loading } = useSelector(state => state.hawkers);
  const { isAuthenticated } = useSelector(state => state.auth);
  const preferences = useSelector(state => state.preferences);
  const { orders } = useSelector(state => state.orders);
  
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setFilteredHawkers(hawkers);
  }, [hawkers]); // Update filtered hawkers when hawkers change
  
  const [userLocation, setUserLocation] = useState(null);

  const loadData = async () => {
    dispatch(getHawkers());
    dispatch(getCrowdLevels());

    if (isAuthenticated) {
      dispatch(getUserPreferences());
    }

    try {
      const location = await getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.error('Failed to get location:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  
  const filterHawkers = () => {
    if (search) {
      const filtered = hawkers.filter(hawker => 
        hawker.name.toLowerCase().includes(search.toLowerCase()) ||
        hawker.address.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredHawkers(filtered);
    } else {
      setFilteredHawkers(hawkers);
    }
  };
  
  const getPersonalizedRecommendations = async () => {
    setIsRecommending(true);
    
    try {
      const recommendations = await getRecommendations(
        hawkers,
        isAuthenticated ? preferences : null,
        isAuthenticated ? orders : [],
        crowdLevels
      );
      
      setFilteredHawkers(recommendations);
    } catch (error) {
      console.error('Error getting recommendations:', error);
    } finally {
      setIsRecommending(false);
    }
  };

  //Fetch nearby hawkers from backend
  const fetchNearbyHawkers = async () => {
    setRefreshing(true);
    try {
      const location = await getCurrentLocation();
      const nearby = await getNearbyHawkers(location.latitude, location.longitude);
      setFilteredHawkers(nearby);
    } catch (error) {
      console.error('Error fetching nearby hawkers:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const renderHawkerCard = ({ item }) => {
    let distance = null;
  
    if (userLocation && item.location?.coordinates) {
      const [lng, lat] = item.location.coordinates;
      distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        lat,
        lng
      );
    }
  
    return (
      <HawkerCard
        hawker={item}
        crowdLevel={crowdLevels[item._id]?.level || 'Unknown'}
        distance={distance}  // Now actual distance
        onPress={() => navigation.navigate('HawkerDetail', { 
          hawkerId: item._id,
          hawkerName: item.name
        })}
      />
    );
  };
  
  
  return (
    <View style={styles.container}>
      <SearchBar
        placeholder="Search hawker centers..."
        value={search}
        onChangeText={(text) => {
          setSearch(text);
        
          if (text.trim() === '') {
            setFilteredHawkers(hawkers);
            return;
          }
        
          const matched = hawkers.filter(h =>
            (h.name && h.name.toLowerCase().includes(text.toLowerCase())) ||
            (h.address && h.address.toLowerCase().includes(text.toLowerCase()))
          );
        
          setFilteredHawkers(matched);
        }}
        
        containerStyle={styles.searchContainer}
        inputContainerStyle={styles.searchInputContainer}
        lightTheme
        round
      />

      
      <View style={styles.filterContainer}>
        <Button
          title="Recommend For Me"
          type="clear"
          titleStyle={{ color: '#e67e22' }}
          loading={isRecommending}
          onPress={getPersonalizedRecommendations}
          icon={{
            name: 'thumbs-up',
            type: 'font-awesome',
            size: 15,
            color: '#e67e22',
          }}
          iconRight
        />
        
        <Button
          title="Filter"
          type="clear"
          titleStyle={{ color: '#3498db' }}
          onPress={() => navigation.navigate('FilterScreen')}
          icon={{
            name: 'filter',
            type: 'font-awesome',
            size: 15,
            color: '#3498db',
          }}
          iconRight
        />

        <Button
            title="Nearby"
            type="clear"
            titleStyle={{ color: '#2ecc71' }}
            onPress={fetchNearbyHawkers}
            icon={{
              name: 'map-marker',
              type: 'font-awesome',
              size: 15,
              color: '#2ecc71',
            }}
            iconRight
        />
      </View>
      
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#e67e22" />
          <Text style={styles.loadingText}>Loading hawker centers...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHawkers}
          renderItem={renderHawkerCard}
          keyExtractor={item => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No hawker centers found. Try a different search term or refresh the list.
              </Text>
              <Button
                title="Refresh"
                onPress={onRefresh}
                buttonStyle={styles.refreshButton}
              />
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  searchContainer: {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    borderBottomWidth: 0,
    paddingHorizontal: 10,
    marginVertical: 5
  },
  searchInputContainer: {
    backgroundColor: '#fff',
    height: 40
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginBottom: 10
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 10,
    color: '#7f8c8d'
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center'
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 15,
    color: '#7f8c8d'
  },
  refreshButton: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 30
  }
});

export default HawkersScreen;
