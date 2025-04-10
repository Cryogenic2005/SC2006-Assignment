import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Button, Input, CheckBox } from 'react-native-elements';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const daysOfWeek = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const EditStallDetailsScreen = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [stallId, setStallId] = useState('');
  const [loading, setLoading] = useState(true);

  const [stallDetails, setStallDetails] = useState({
    name: '',
    description: '',
    stallNumber: '',
    cuisine: '',
    imageUrl: '',
    minPrice: '',
    maxPrice: '',
    isHalal: false,
    isVegetarian: false,
    isVegan: false,
    operatingHours: {
      monday: { open: '', close: '' },
      tuesday: { open: '', close: '' },
      wednesday: { open: '', close: '' },
      thursday: { open: '', close: '' },
      friday: { open: '', close: '' },
      saturday: { open: '', close: '' },
      sunday: { open: '', close: '' },
    },
  });

  useEffect(() => {
    fetchStall();
  }, []);

  const fetchStall = async () => {
    try {
      const config = {
        headers: { 'x-auth-token': token },
      };
      const res = await axios.get(`${API_BASE_URL}/api/stalls/owner/me`, config);
      if (res.data.length > 0) {
        const stall = res.data[0];
        setStallId(stall._id);
        setStallDetails({
          name: stall.name || '',
          description: stall.description || '',
          stallNumber: stall.stallNumber || '',
          cuisine: stall.cuisine || '',
          imageUrl: stall.imageUrl || '',
          minPrice: stall.minPrice?.toString() || '',
          maxPrice: stall.maxPrice?.toString() || '',
          isHalal: stall.isHalal || false,
          isVegetarian: stall.isVegetarian || false,
          isVegan: stall.isVegan || false,
          operatingHours: stall.operatingHours || stallDetails.operatingHours,
        });
      }
      setLoading(false);
    } catch (err) {
      console.error(err.message);
      Alert.alert('Error', 'Could not fetch stall details.');
    }
  };

  const handleTimeChange = (day, field, value) => {
    setStallDetails((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleSave = async () => {
    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token,
        },
      };

      const payload = {
        ...stallDetails,
        minPrice: parseFloat(stallDetails.minPrice),
        maxPrice: parseFloat(stallDetails.maxPrice),
      };

      await axios.put(`${API_BASE_URL}/api/stalls/${stallId}`, payload, config);
      Alert.alert('Success', 'Stall details updated successfully.');
    } catch (err) {
      console.error(err.message);
      Alert.alert('Error', 'Could not update stall details.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading stall details...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Edit Stall Details</Text>

      <Input
        label="Stall Name"
        value={stallDetails.name}
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, name: text }))}
      />

      <Input
        label="Description"
        value={stallDetails.description}
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, description: text }))}
      />

      <Input
        label="Stall Number"
        value={stallDetails.stallNumber}
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, stallNumber: text }))}
      />

      <Input
        label="Cuisine"
        value={stallDetails.cuisine}
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, cuisine: text }))}
      />

      <Input
        label="Image URL"
        value={stallDetails.imageUrl}
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, imageUrl: text }))}
      />

      <Input
        label="Minimum Price"
        value={stallDetails.minPrice}
        keyboardType="numeric"
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, minPrice: text }))}
      />

      <Input
        label="Maximum Price"
        value={stallDetails.maxPrice}
        keyboardType="numeric"
        onChangeText={(text) => setStallDetails((prev) => ({ ...prev, maxPrice: text }))}
      />

      <View style={styles.checkboxContainer}>
        <CheckBox
          title="Halal"
          checked={stallDetails.isHalal}
          onPress={() => setStallDetails((prev) => ({ ...prev, isHalal: !prev.isHalal }))}
        />
        <CheckBox
          title="Vegetarian"
          checked={stallDetails.isVegetarian}
          onPress={() => setStallDetails((prev) => ({ ...prev, isVegetarian: !prev.isVegetarian }))}
        />
        <CheckBox
          title="Vegan"
          checked={stallDetails.isVegan}
          onPress={() => setStallDetails((prev) => ({ ...prev, isVegan: !prev.isVegan }))}
        />
      </View>

      <Text style={styles.subTitle}>Operating Hours</Text>
      {daysOfWeek.map((day) => (
        <View key={day} style={styles.dayRow}>
          <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
          <TextInput
            style={styles.timeInput}
            placeholder="Open"
            value={stallDetails.operatingHours[day]?.open || ''}
            onChangeText={(text) => handleTimeChange(day, 'open', text)}
          />
          <Text style={{ marginHorizontal: 5 }}>to</Text>
          <TextInput
            style={styles.timeInput}
            placeholder="Close"
            value={stallDetails.operatingHours[day]?.close || ''}
            onChangeText={(text) => handleTimeChange(day, 'close', text)}
          />
        </View>
      ))}

      <Button
        title="Save Changes"
        onPress={handleSave}
        buttonStyle={styles.saveButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  subTitle: { fontSize: 16, fontWeight: '600', marginVertical: 10 },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dayLabel: { width: 80, fontWeight: '500' },
  timeInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    width: 70,
    paddingVertical: 2,
    textAlign: 'center',
  },
  saveButton: { marginTop: 30, backgroundColor: '#e67e22' },
  checkboxContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
});

export default EditStallDetailsScreen;
