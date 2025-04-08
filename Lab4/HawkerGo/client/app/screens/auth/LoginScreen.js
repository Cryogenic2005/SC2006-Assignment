import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset } from '../../store/slices/authSlice';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, errorMessage } = useSelector((state) => state.auth);

  useEffect(() => {
    if (isError) {
      Alert.alert('Error', errorMessage);
    }

    if (isSuccess) {
      dispatch(reset());
    }

    return () => {
      dispatch(reset());
    };
  }, [isError, isSuccess, errorMessage, dispatch]);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    dispatch(login({ email, password }));
  };

  const handleSocialLogin = (provider) => {
    // To be implemented with social login service
    Alert.alert('Info', `${provider} login coming soon`);
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../../../assets/images/icon.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to HawkerGo</Text>
      
      <View style={styles.form}>
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
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <Text style={styles.forgotPassword}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <View style={styles.socialContainer}>
          <TouchableOpacity
            style={[styles.socialButton, styles.googleButton]}
            onPress={() => handleSocialLogin('Google')}
          >
            <Text style={styles.socialButtonText}>Google</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={() => handleSocialLogin('Facebook')}
          >
            <Text style={styles.socialButtonText}>Facebook</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>Don't have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  forgotPassword: {
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 20,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  socialButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  googleButton: {
    backgroundColor: '#DB4437',
  },
  facebookButton: {
    backgroundColor: '#4267B2',
  },
  socialButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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

export default LoginScreen;