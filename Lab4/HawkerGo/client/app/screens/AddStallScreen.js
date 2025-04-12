import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, TextInput, Platform, Pressable } from 'react-native';
import { Input, Button, CheckBox } from 'react-native-elements';
import DateTimePicker from '@react-native-community/datetimepicker';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { API_BASE_URL } from '../constants/api';

const categoryOptions = ['Rice Dishes', 'Noodles', 'Beverages', 'Snacks', 'Vegetarian', 'Seafood', 'Halal', 'Vegan'];

const defaultHours = { open: '08:00', close: '20:00' };

const AddStallScreen = ({ navigation }) => {
  const { token } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [stallNumber, setStallNumber] = useState('');
  const [hawkerId, setHawkerId] = useState('');
  const [hawkerSearch, setHawkerSearch] = useState('');
  const [hawkerOptions, setHawkerOptions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [tempTime, setTempTime] = useState(new Date());
  const [showPicker, setShowPicker] = useState({ day: null, type: null });
  const [operatingHours, setOperatingHours] = useState({
    monday: defaultHours,
    tuesday: defaultHours,
    wednesday: defaultHours,
    thursday: defaultHours,
    friday: defaultHours,
    saturday: defaultHours,
    sunday: defaultHours
  });

  useEffect(() => {
    const fetchHawkers = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/hawkers`);
        setHawkerOptions(res.data);
      } catch (err) {
        console.error('Error fetching hawkers:', err.message);
      }
    };

    fetchHawkers();
  }, []);

  const toggleCategory = (category) => {
    if (categories.includes(category)) {
      setCategories(categories.filter((c) => c !== category));
    } else {
      setCategories([...categories, category]);
    }
  };

  const openPicker = (day, type) => {
    const [hour, min] = operatingHours[day][type].split(':');
    const initialTime = new Date();

    initialTime.setHours(hour);
    initialTime.setMinutes(min);
    
    setTempTime(initialTime);
    setShowPicker({ day, type });
  }

  const handleTimeChange = () => {
    const day = showPicker.day;
    const isOpening = showPicker.type === 'open';
    const formattedTime = tempTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOperatingHours = {
      ...operatingHours,
      [day]: {
        ...operatingHours[day],
        [isOpening ? 'open' : 'close']: formattedTime
      }
    };

    // Validate opening and closing times
    const openingHours = new Date(`1970-01-01T${newOperatingHours[day].open}:00`);
    const closingHours = new Date(`1970-01-01T${newOperatingHours[day].close}:00`);

    if (openingHours >= closingHours) {
      Alert.alert('Invalid Hours', 'Opening time must be before closing time.');
      return;
    }

    setOperatingHours(newOperatingHours);
  };

  const handleAddStall = async () => {
    if (!name || !hawkerId || !stallNumber || !cuisine || !minPrice || !maxPrice) {
      Alert.alert('Missing Fields', 'Please complete all required fields.');
      return;
    }

    const payload = {
      name,
      description,
      hawkerId,
      stallNumber,
      imageUrl,
      cuisine,
      categories,
      minPrice: parseFloat(minPrice),
      maxPrice: parseFloat(maxPrice),
      operatingHours
    };

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        }
      };

      const res = await axios.post(`${API_BASE_URL}/api/stalls`, payload, config);
      console.log('Stall created:', payload);
      Alert.alert('Success', 'Stall created successfully!');
    } catch (err) {
      console.error('Error creating stall:', err.message);
      Alert.alert('Error', 'Failed to create stall.');
    }

    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Input label="Stall Name" value={name} onChangeText={setName} placeholder="e.g. Ah Huat Chicken Rice" />
      <Input label="Description" value={description} onChangeText={setDescription} placeholder="Short description" multiline />
      <Input label="Stall Number" value={stallNumber} onChangeText={setStallNumber} placeholder="e.g. #01-24" />
      <Input label="Cuisine Type" value={cuisine} onChangeText={setCuisine} placeholder="e.g. Chinese, Malay, Indian..." />
      <Input label="Minimum Price ($)" value={minPrice} onChangeText={setMinPrice} keyboardType="numeric" />
      <Input label="Maximum Price ($)" value={maxPrice} onChangeText={setMaxPrice} keyboardType="numeric" />
      <Input label="Image URL (optional)" value={imageUrl} onChangeText={setImageUrl} />

      <Input
        label="Search Hawker Centre"
        value={hawkerSearch}
        onChangeText={(text) => {
          setHawkerSearch(text);
          const match = hawkerOptions.find(h => h.name.toLowerCase().includes(text.toLowerCase()));
          if (match) setHawkerId(match._id);
        }}
        placeholder="Type to search..."
      />
      {hawkerSearch !== '' && hawkerOptions.map((h) => (
        h.name.toLowerCase().includes(hawkerSearch.toLowerCase()) && (
          <TouchableOpacity key={h._id} onPress={() => {
            setHawkerSearch(h.name);
            setHawkerId(h._id);
          }}>
            <Text style={styles.hawkerOption}>{h.name}</Text>
          </TouchableOpacity>
        )
      ))}

      <Text style={styles.sectionTitle}>Categories</Text>
      <View style={styles.checkboxContainer}>
        {categoryOptions.map((category) => (
          <CheckBox
            key={category}
            title={category}
            checked={categories.includes(category)}
            onPress={() => toggleCategory(category)}
            containerStyle={styles.checkbox}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>Operating Hours</Text>
      {Object.keys(operatingHours).map((day) => (
        <View key={day} style={styles.dayRow}>
          <Text style={styles.dayLabel}>
            {day.charAt(0).toUpperCase() + day.slice(1)}
          </Text>

          <Pressable
            style={styles.timeDisplay}
            onPress={() => openPicker(day, 'open')}
          >
            <Text>{operatingHours[day].open}</Text>
          </Pressable>

          <Pressable
            style={styles.timeDisplay}
            onPress={() => openPicker(day, 'close')}
          >
            <Text>{operatingHours[day].close}</Text>
          </Pressable>
        </View>
      ))}

      {showPicker.day && (
        <View style={[styles.container, {backgroundColor: '#dedede', borderRadius: 10}]}>
          <Text style={styles.popupTitle}>
            Set {showPicker.type === 'open' ? 'opening' : 'closing'} time
            for {showPicker.day.charAt(0).toUpperCase() + showPicker.day.slice(1)}s
          </Text>
            
          <View style={{ height: Platform.OS === 'ios' ? 50 : 150}}>
            <DateTimePicker
              style={{flex: 1}}
              value={tempTime}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedTime) => setTempTime(selectedTime)}
              themeVariant='light'
            />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10}}>
            <Button
              title="Cancel"
              onPress={() => setShowPicker({ day: null, type: null })}
              buttonStyle={styles.cancelButton}
            />
            <Button title="Confirm" onPress={handleTimeChange} buttonStyle={styles.confirmButton} />
          </View>
        </View>
      )}

      <Button title="Add Stall" onPress={handleAddStall} buttonStyle={styles.button} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10
  },
  popupTitle: {
    fontSize: 18,
    fontStyle: 'italic',
    alignSelf: 'center',
    marginVertical: 5
  },
  checkboxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  checkbox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    width: '50%'
  },
  hawkerOption: {
    padding: 10,
    backgroundColor: '#f1f1f1',
    borderRadius: 6,
    marginVertical: 4
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  dayLabel: {
    flex: 1,
    fontSize: 14
  },
  timeDisplay: {
    padding: 5,
    backgroundColor: '#e8e8e8',
    borderRadius: 8,
    marginHorizontal: 5,
    minWidth: 80,
    alignItems: 'center'
  },
  button: {
    marginTop: 30,
    backgroundColor: '#e67e22'
  },
  confirmButton: {
    margin: 5,
    backgroundColor: '#2ecc71'
  },
  cancelButton: {
    margin: 5,
    backgroundColor: '#e74c3c'
  }
});

export default AddStallScreen;
