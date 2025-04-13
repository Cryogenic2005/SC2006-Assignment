import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Card, Icon, Button } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const ManageStallScreen = () => {
  const navigation = useNavigation();
  const { token } = useSelector((state) => state.auth);
  const [stall, setStall] = useState(null);

  useEffect(() => {
    fetchStallDetails();
  }, []);

  const fetchStallDetails = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/stalls/owner/me`, {
        headers: { 'x-auth-token': token },
      });
      
      if (res.data) {
        setStall(res.data);
      }
    } catch (err) {
      console.error(err.message);
    }
  };

  const handleRemoveStall = () => {
    if (!stall) return;

    Alert.alert(
      'Confirm Removal',
      'Are you sure you want to remove your stall? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE_URL}/api/stalls/${stall._id}`, {
                headers: { 'x-auth-token': token },
              });
              setStall(null);
              Alert.alert('Removed', 'Your stall has been removed.');
            } catch (err) {
              console.error(err);
              Alert.alert('Error', 'Failed to remove stall');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Stall Management</Text>

      {stall == null ? (
        <Card containerStyle={styles.card}>
          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => navigation.navigate('AddStall')}
          >
            <Icon name="add-business" color="#2ecc71" size={28} />
            <Text style={styles.actionText}>Add Stall to Hawker Centre</Text>
          </TouchableOpacity>
        </Card>
      ) : (
        <>
          <Card containerStyle={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('EditStallDetails')}
            >
              <Icon name="edit" color="#2980b9" size={28} />
              <Text style={styles.actionText}>Edit Stall Details</Text>
            </TouchableOpacity>
          </Card>

          <Card containerStyle={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('ManageMenu')}
            >
              <Icon name="restaurant-menu" color="#f39c12" size={28} />
              <Text style={styles.actionText}>Manage Menu</Text>
            </TouchableOpacity>
          </Card>

          <Card containerStyle={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('StallAnalytics')}
            >
              <Icon name="bar-chart" type="font-awesome" color="#8e44ad" size={26} />
              <Text style={styles.actionText}>View Analytics</Text>
            </TouchableOpacity>
          </Card>

          <Card containerStyle={styles.card}>
            <TouchableOpacity style={styles.actionRow} onPress={handleRemoveStall}>
              <Icon name="delete" color="#e74c3c" size={28} />
              <Text style={[styles.actionText, { color: '#e74c3c' }]}>Remove Stall</Text>
            </TouchableOpacity>
          </Card>
        </>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa',
    padding: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
  },
  card: {
    borderRadius: 10,
    paddingVertical: 15,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
});

export default ManageStallScreen;
