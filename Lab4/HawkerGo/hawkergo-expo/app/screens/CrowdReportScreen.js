// screens/CrowdReportScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSelector } from 'react-redux';
import { Card, Button, Icon } from 'react-native-elements';
import axios from 'axios';
import { API_URL } from '../constants/constants';

const CrowdReportScreen = ({ route, navigation }) => {
  const [currentCrowd, setCurrentCrowd] = useState('Unknown');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [recentlyReported, setRecentlyReported] = useState(false);
  
  const auth = useSelector(state => state.auth);
  const { token } = auth;
  
  const { hawkerId, hawkerName } = route.params;
  
  useEffect(() => {
    fetchCrowdData();
  }, [hawkerId]);
  
  const fetchCrowdData = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/crowds/${hawkerId}`);
      setCurrentCrowd(res.data.level);
      
      // Check if user has reported recently
      if (token) {
        const config = {
          headers: {
            'x-auth-token': token
          }
        };
        
        const userReportRes = await axios.get(
          `${API_URL}/api/crowds/user-status/${hawkerId}`,
          config
        );
        
        if (userReportRes.data.recentlyReported) {
          setRecentlyReported(true);
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching crowd data:', err);
      setLoading(false);
      setCurrentCrowd('Unknown');
    }
  };
  
  const handleSubmit = async () => {
    if (!selectedLevel) {
      Alert.alert('Error', 'Please select a crowd level');
      return;
    }
    
    if (!auth.isAuthenticated) {
      Alert.alert(
        'Login Required',
        'You need to log in to report crowd levels',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Log In', onPress: () => navigation.navigate('Login') }
        ]
      );
      return;
    }
    
    try {
      setSubmitting(true);
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };
      
      const body = {
        hawkerId,
        level: selectedLevel
      };
      
      await axios.post(`${API_URL}/api/crowds`, body, config);
      
      setSubmitting(false);
      setSelectedLevel(null);
      setRecentlyReported(true);
      
      // Refresh crowd data
      fetchCrowdData();
      
      Alert.alert('Thank You!', 'Your crowd report has been submitted.');
    } catch (err) {
      setSubmitting(false);
      Alert.alert('Error', err.response?.data?.msg || 'Could not submit crowd report');
    }
  };
  
  const getCrowdLevelColor = (level) => {
    switch (level) {
      case 'Low': return '#2ecc71';
      case 'Medium': return '#f39c12';
      case 'High': return '#e74c3c';
      default: return '#95a5a6';
    }
  };
  
  const crowdLevels = [
    { value: 'Low', label: 'Low', icon: 'sentiment-satisfied', description: 'Plenty of seats available' },
    { value: 'Medium', label: 'Medium', icon: 'sentiment-neutral', description: 'Some seats available' },
    { value: 'High', label: 'High', icon: 'sentiment-dissatisfied', description: 'Difficult to find seats' }
  ];
  
  return (
    <View style={styles.container}>
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>{hawkerName}</Card.Title>
        
        <View style={styles.currentCrowdContainer}>
          <Text style={styles.currentCrowdLabel}>Current Crowd Level</Text>
          <View 
            style={[
              styles.crowdLevelBadge, 
              { backgroundColor: getCrowdLevelColor(currentCrowd) }
            ]}
          >
            <Text style={styles.crowdLevelText}>{currentCrowd}</Text>
          </View>
          
          <TouchableOpacity onPress={fetchCrowdData}>
            <Text style={styles.refreshText}>
              <Icon name="refresh" size={14} color="#3498db" /> Refresh
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
      
      <Card containerStyle={styles.card}>
        <Card.Title style={styles.cardTitle}>Report Crowd Level</Card.Title>
        
        {recentlyReported ? (
          <View style={styles.alreadyReportedContainer}>
            <Icon name="check-circle" size={40} color="#2ecc71" />
            <Text style={styles.alreadyReportedText}>
              Thank you for your report! You can submit another report in 30 minutes.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.selectText}>How crowded is it right now?</Text>
            
            <View style={styles.levelContainer}>
              {crowdLevels.map((level) => (
                <TouchableOpacity
                  key={level.value}
                  style={[
                    styles.levelButton,
                    selectedLevel === level.value && { 
                      backgroundColor: getCrowdLevelColor(level.value),
                      borderColor: getCrowdLevelColor(level.value)
                    }
                  ]}
                  onPress={() => setSelectedLevel(level.value)}
                >
                  <Icon
                    name={level.icon}
                    size={28}
                    color={selectedLevel === level.value ? '#fff' : getCrowdLevelColor(level.value)}
                  />
                  <Text 
                    style={[
                      styles.levelLabel,
                      selectedLevel === level.value && { color: '#fff' }
                    ]}
                  >
                    {level.label}
                  </Text>
                  <Text 
                    style={[
                      styles.levelDescription,
                      selectedLevel === level.value && { color: '#fff' }
                    ]}
                  >
                    {level.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <Button
              title="Submit Report"
              buttonStyle={styles.submitButton}
              loading={submitting}
              onPress={handleSubmit}
            />
          </>
        )}
      </Card>
      
      <Card containerStyle={styles.infoCard}>
        <Text style={styles.infoText}>
          Crowd levels are validated when multiple users report similar levels. Your reports help other users make informed decisions.
        </Text>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8'
  },
  card: {
    borderRadius: 10,
    margin: 10,
    padding: 15
  },
  cardTitle: {
    fontSize: 18
  },
  currentCrowdContainer: {
    alignItems: 'center',
    marginTop: 10
  },
  currentCrowdLabel: {
    fontSize: 16,
    marginBottom: 10
  },
  crowdLevelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15
  },
  crowdLevelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18
  },
  refreshText: {
    color: '#3498db',
    fontSize: 14
  },
  selectText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20
  },
  levelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  levelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 5,
    backgroundColor: '#fff'
  },
  levelLabel: {
    fontWeight: 'bold',
    marginTop: 5
  },
  levelDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 5,
    color: '#7f8c8d'
  },
  submitButton: {
    backgroundColor: '#3498db',
    borderRadius: 8
  },
  alreadyReportedContainer: {
    alignItems: 'center',
    padding: 20
  },
  alreadyReportedText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 16,
    color: '#2c3e50',
    lineHeight: 22
  },
  infoCard: {
    borderRadius: 10,
    margin: 10,
    padding: 15,
    backgroundColor: '#e8f4fc',
    borderColor: '#3498db'
  },
  infoText: {
    color: '#2c3e50',
    lineHeight: 20
  }
});

export default CrowdReportScreen;