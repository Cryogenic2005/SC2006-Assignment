import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { Button, CheckBox, Input, Slider } from 'react-native-elements';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const allergyOptions = ['Peanuts', 'Dairy', 'Gluten', 'Shellfish'];

const ManageMenuScreen = () => {
  const { token, user } = useSelector((state) => state.auth);
  const [stallId, setStallId] = useState('');
  const [menuItems, setMenuItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    isAvailable: true,
    isSpicy: false,
    isSignature: false,
    imageUrl: '',
  });

  useEffect(() => {
    const fetchStallAndMenu = async () => {
      try {
        const stallRes = await axios.get(`${API_BASE_URL}/api/stalls/owner/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (stallRes.data.length > 0) {
          const stall = stallRes.data[0];
          setStallId(stall._id);

          const menuRes = await axios.get(`${API_BASE_URL}/api/stalls/${stall._id}/menu`);
          setMenuItems(menuRes.data);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Failed to load menu data.');
      }
    };
    fetchStallAndMenu();
  }, []);

  const toggleNewItemField = (field) => {
    setNewItem((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleAddItem = async () => {
    const { name, price } = newItem;
    if (!name || !price) {
      Alert.alert('Missing Fields', 'Please enter at least name and price.');
      return;
    }

    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/stalls/${stallId}/menu`,
        {
          ...newItem,
          price: parseFloat(newItem.price),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMenuItems((prev) => [...prev, res.data]);
      setNewItem({
        name: '',
        description: '',
        price: '',
        category: '',
        isAvailable: true,
        isSpicy: false,
        isSignature: false,
        imageUrl: '',
      });
      Alert.alert('Success', 'Menu item added.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to add menu item.');
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/stalls/${stallId}/menu/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMenuItems((prev) => prev.filter((item) => item._id !== itemId));
      Alert.alert('Deleted', 'Menu item removed.');
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to delete item.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add New Menu Item</Text>

      <Input
        label="Name"
        value={newItem.name}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, name: text }))}
      />
      <Input
        label="Description"
        value={newItem.description}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, description: text }))}
      />
      <Input
        label="Price"
        keyboardType="decimal-pad"
        value={newItem.price}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, price: text }))}
      />
      <Input
        label="Category"
        value={newItem.category}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, category: text }))}
      />
      <Input
        label="Image URL"
        value={newItem.imageUrl}
        onChangeText={(text) => setNewItem((prev) => ({ ...prev, imageUrl: text }))}
      />

      <CheckBox
        title="Available"
        checked={newItem.isAvailable}
        onPress={() => toggleNewItemField('isAvailable')}
      />
      <CheckBox
        title="Spicy"
        checked={newItem.isSpicy}
        onPress={() => toggleNewItemField('isSpicy')}
      />
      <CheckBox
        title="Signature Dish"
        checked={newItem.isSignature}
        onPress={() => toggleNewItemField('isSignature')}
      />

      <Button title="Add Menu Item" onPress={handleAddItem} buttonStyle={styles.addButton} />

      <Text style={styles.title}>Current Menu Items</Text>
      <FlatList
        data={menuItems}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => (
          <View style={styles.menuCard}>
            <Text style={styles.menuName}>
              {item.name} (${item.price?.toFixed(2)})
            </Text>
            {item.description && <Text>{item.description}</Text>}
            {item.isSpicy && <Text style={styles.menuTag}>🌶️ Spicy</Text>}
            {item.isSignature && <Text style={styles.menuTag}>⭐ Signature</Text>}
            <Text style={styles.menuTag}>Available: {item.isAvailable ? 'Yes' : 'No'}</Text>
            <TouchableOpacity
              onPress={() => handleDeleteItem(item._id)}
              style={{ marginTop: 5 }}
            >
              <Text style={{ color: 'red' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', marginVertical: 15 },
  addButton: { backgroundColor: '#e67e22', marginVertical: 20 },
  menuCard: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
    borderRadius: 8,
  },
  menuName: { fontSize: 16, fontWeight: 'bold' },
  menuTag: { fontSize: 12, color: '#7f8c8d' },
});

export default ManageMenuScreen;
