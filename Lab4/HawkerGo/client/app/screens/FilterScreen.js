import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Slider, Divider } from 'react-native-elements';
import { updatePreferences } from '../store/slices/preferencesSlice';

const FilterScreen = ({ navigation }) => {
  // Get existing preferences from Redux store
  const currentPreferences = useSelector(state => state.preferences);
  const { isAuthenticated } = useSelector(state => state.auth);
  
  // Local state for form
  const [cuisines, setCuisines] = useState(currentPreferences.cuisines || []);
  const [dietaryRestrictions, setDietaryRestrictions] = useState(
    currentPreferences.dietaryRestrictions || []
  );
  const [spiceLevel, setSpiceLevel] = useState(currentPreferences.spiceLevel || 'No Preference');
  const [priceRange, setPriceRange] = useState(
    currentPreferences.priceRange || { min: 0, max: 50 }
  );
  
  const dispatch = useDispatch();
  
  // Cuisine options
  const cuisineOptions = [
    'Chinese', 'Malay', 'Indian', 'Western', 'Japanese', 
    'Korean', 'Thai', 'Vietnamese', 'Vegetarian', 'Seafood', 'Dessert'
  ];
  
  // Dietary restriction options
  const dietaryOptions = [
    { value: 'Vegetarian', label: 'Vegetarian' },
    { value: 'Vegan', label: 'Vegan' },
    { value: 'Halal', label: 'Halal' },
    { value: 'Gluten-free', label: 'Gluten-free' }
  ];
  
  // Spice level options
  const spiceLevelOptions = [
    'No Preference', 'Mild', 'Medium', 'Spicy', 'Very Spicy'
  ];
  
  const toggleCuisine = (cuisine) => {
    if (cuisines.includes(cuisine)) {
      setCuisines(cuisines.filter(c => c !== cuisine));
    } else {
      setCuisines([...cuisines, cuisine]);
    }
  };
  
  const toggleDietaryRestriction = (restriction) => {
    if (dietaryRestrictions.includes(restriction)) {
      setDietaryRestrictions(dietaryRestrictions.filter(r => r !== restriction));
    } else {
      setDietaryRestrictions([...dietaryRestrictions, restriction]);
    }
  };
  
  const applyFilters = () => {
    if (isAuthenticated) {
      // Save to user profile if logged in
      dispatch(updatePreferences({
        cuisines,
        dietaryRestrictions,
        spiceLevel,
        priceRange
      }));
    }
    
    // Return to previous screen
    navigation.goBack();
  };
  
  const resetFilters = () => {
    setCuisines([]);
    setDietaryRestrictions([]);
    setSpiceLevel('No Preference');
    setPriceRange({ min: 0, max: 50 });
  };
  
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>Cuisine Preferences</Text>
      <View style={styles.optionsContainer}>
        {cuisineOptions.map(cuisine => (
          <Button
            key={cuisine}
            title={cuisine}
            type={cuisines.includes(cuisine) ? 'solid' : 'outline'}
            buttonStyle={[
              styles.optionButton,
              cuisines.includes(cuisine) ? styles.selectedButton : {}
            ]}
            titleStyle={[
              styles.optionButtonText,
              cuisines.includes(cuisine) ? styles.selectedButtonText : {}
            ]}
            onPress={() => toggleCuisine(cuisine)}
          />
        ))}
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
      <View style={styles.switchContainer}>
        {dietaryOptions.map(option => (
          <View key={option.value} style={styles.switchRow}>
            <Text style={styles.switchLabel}>{option.label}</Text>
            <Switch
              value={dietaryRestrictions.includes(option.value)}
              onValueChange={() => toggleDietaryRestriction(option.value)}
              trackColor={{ false: '#bdc3c7', true: '#e67e22' }}
              thumbColor={
                dietaryRestrictions.includes(option.value) ? '#d35400' : '#ecf0f1'
              }
            />
          </View>
        ))}
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Spice Level</Text>
      <View style={styles.optionsContainer}>
        {spiceLevelOptions.map(level => (
          <Button
            key={level}
            title={level}
            type={spiceLevel === level ? 'solid' : 'outline'}
            buttonStyle={[
              styles.optionButton,
              spiceLevel === level ? styles.selectedButton : {}
            ]}
            titleStyle={[
              styles.optionButtonText,
              spiceLevel === level ? styles.selectedButtonText : {}
            ]}
            onPress={() => setSpiceLevel(level)}
          />
        ))}
      </View>
      
      <Divider style={styles.divider} />
      
      <Text style={styles.sectionTitle}>Price Range</Text>
      <View style={styles.priceContainer}>
        <Text style={styles.priceRangeText}>
          ${priceRange.min.toFixed(2)} - ${priceRange.max.toFixed(2)}
        </Text>
        <Slider
          value={[priceRange.min, priceRange.max]}
          onValueChange={values => setPriceRange({ min: values[0], max: values[1] })}
          minimumValue={0}
          maximumValue={50}
          step={1}
          allowOverlap={false}
          renderThumbComponent={() => (
            <View style={styles.sliderThumb} />
          )}
          trackStyle={styles.sliderTrack}
          thumbStyle={styles.sliderThumb}
          minimumTrackTintColor="#e67e22"
          maximumTrackTintColor="#bdc3c7"
        />
      </View>
      
      <View style={styles.actionButtons}>
        <Button
          title="Reset"
          type="outline"
          buttonStyle={styles.resetButton}
          titleStyle={styles.resetButtonText}
          onPress={resetFilters}
        />
        <Button
          title="Apply Filters"
          buttonStyle={styles.applyButton}
          onPress={applyFilters}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10
  },
  optionButton: {
    margin: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderColor: '#e67e22'
  },
  selectedButton: {
    backgroundColor: '#e67e22',
    borderColor: '#e67e22'
  },
  optionButtonText: {
    fontSize: 14,
    color: '#e67e22'
  },
  selectedButtonText: {
    color: '#fff'
  },
  divider: {
    marginVertical: 15
  },
  switchContainer: {
    marginVertical: 10
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10
  },
  switchLabel: {
    fontSize: 16
  },
  priceContainer: {
    marginVertical: 10
  },
  priceRangeText: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 10
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e67e22',
    borderWidth: 2,
    borderColor: '#fff'
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 50
  },
  resetButton: {
    borderColor: '#e74c3c',
    paddingHorizontal: 20
  },
  resetButtonText: {
    color: '#e74c3c'
  },
  applyButton: {
    backgroundColor: '#e67e22',
    paddingHorizontal: 20
  }
});

export default FilterScreen;