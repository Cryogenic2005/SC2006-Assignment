import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { useDispatch, useSelector } from 'react-redux';
import { register, reset } from '../../store/slices/authSlice';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('customer');

  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, errorMessage } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      Alert.alert('Error', errorMessage);
    }

    if (isSuccess) {
      Alert.alert('Success', 'Account created! Please login.');
      navigation.navigate('Login');
      dispatch(reset());
    }

    return () => {
      dispatch(reset());
    };
  }, [isError, isSuccess, errorMessage, dispatch]);

  const handleRegister = () => {
    if (!name || !email || !password || !userType) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    dispatch(register({ name, email, password, userType }));
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Create Account</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name"
          placeholderTextColor="#999"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.input}>
          <Picker
            selectedValue={userType}
            onValueChange={(itemValue) => setUserType(itemValue)}
          >
            <Picker.Item label="Customer" value="customer" />
            <Picker.Item label="Stall Owner" value="stallOwner" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Register</Text>
          )}
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.registerLink}>Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ...require('./LoginScreen').default?.styles, // optional: share styles
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  form: {
    width: '100%',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 15,
    marginBottom: 15,
  },
  button: {
    backgroundColor: '#e74c3c',
    borderRadius: 5,
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  registerText: {
    color: '#333',
  },
  registerLink: {
    color: '#e74c3c',
    fontWeight: 'bold',
  },
});

export default RegisterScreen;
