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
  Platform,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login, reset, socialLogin } from '../../store/slices/authSlice';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { FontAwesome } from '@expo/vector-icons';
import Constants from 'expo-constants';

// Initialize WebBrowser for Auth
WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const { isLoading, isError, isSuccess, errorMessage } = useSelector((state) => state.auth);
  const [socialLoading, setSocialLoading] = useState(false);

  // Get configuration from app.config.js
  const googleWebClientId = Constants.expoConfig?.extra?.googleWebClientId;
  const googleIosClientId = Constants.expoConfig?.extra?.googleIosClientId;
  const googleAndroidClientId = Constants.expoConfig?.extra?.googleAndroidClientId;

  const facebookAppId = Constants.expoConfig?.extra?.facebookAppId;

  // Google Auth with web and iOS client IDs
  const [googleRequest, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    expoClientId: googleWebClientId,
    iosClientId: googleIosClientId,
    webClientId: googleWebClientId,
    androidClientId: googleAndroidClientId,
    // Use host.exp.exponent as the iOS bundle ID for Expo Go
    iosBundleId: 'host.exp.exponent',
  });

  // Facebook Auth
  const [fbRequest, fbResponse, promptFacebookAsync] = Facebook.useAuthRequest({
    clientId: facebookAppId,
  });

  useEffect(() => {
    if (isError) {
      Alert.alert('Error', errorMessage);
      setSocialLoading(false);
    }

    if (isSuccess) {
      dispatch(reset());
      setSocialLoading(false);
    }

    return () => {
      dispatch(reset());
    };
  }, [isError, isSuccess, errorMessage, dispatch]);

  // Handle Google auth response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.accessToken) {
        handleSocialLoginSuccess('google', authentication.accessToken);
      } else {
        console.error('Google auth missing access token');
        setSocialLoading(false);
        Alert.alert('Login Error', 'Failed to get Google access token');
      }
    } else if (googleResponse?.type === 'error') {
      console.error('Google auth error:', googleResponse.error);
      setSocialLoading(false);
      Alert.alert('Login Error', 'Failed to login with Google');
    }
  }, [googleResponse]);

  // Handle Facebook auth response
  useEffect(() => {
    if (fbResponse?.type === 'success') {
      const { authentication } = fbResponse;
      if (authentication?.accessToken) {
        handleSocialLoginSuccess('facebook', authentication.accessToken);
      } else {
        console.error('Facebook auth missing access token');
        setSocialLoading(false);
        Alert.alert('Login Error', 'Failed to get Facebook access token');
      }
    } else if (fbResponse?.type === 'error') {
      console.error('Facebook auth error:', fbResponse.error);
      setSocialLoading(false);
      Alert.alert('Login Error', 'Failed to login with Facebook');
    }
  }, [fbResponse]);

  const handleSocialLoginSuccess = async (provider, token) => {
    try {
      // For development purposes, use mock data
      let userData = { email: '', name: '' };
      
      if (provider === 'google') {
        // In a real implementation, fetch user data from Google API with the token
        userData = { 
          email: 'google@example.com', 
          name: 'Google User' 
        };
      } else if (provider === 'facebook') {
        // In a real implementation, fetch user data from Facebook Graph API
        userData = {
          email: 'facebook@example.com',
          name: 'Facebook User'
        };
      }
      
      dispatch(socialLogin({
        provider,
        token,
        email: userData.email,
        name: userData.name
      }));
    } catch (error) {
      console.error('Error during social login:', error);
      setSocialLoading(false);
      Alert.alert('Login Error', 'Failed to login with ' + provider);
    }
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    dispatch(login({ email, password }));
  };

  const handleGoogleLogin = async () => {
    try {
      setSocialLoading(true);
      console.log('Starting Google login process...');
      if (!googleRequest) {
        console.log('Google request object is not ready yet');
        setSocialLoading(false);
        return;
      }
      
      const result = await promptGoogleAsync();
      console.log('Google login prompt result:', result);
    } catch (error) {
      console.error('Google login error:', error);
      setSocialLoading(false);
      Alert.alert('Login Error', 'Failed to login with Google');
    }
  };

  const handleFacebookLogin = async () => {
    try {
      setSocialLoading(true);
      console.log('Starting Facebook login process...');
      if (!fbRequest) {
        console.log('Facebook request object is not ready yet');
        setSocialLoading(false);
        return;
      }
      
      const result = await promptFacebookAsync();
      console.log('Facebook login prompt result:', result);
    } catch (error) {
      console.error('Facebook login error:', error);
      setSocialLoading(false);
      Alert.alert('Login Error', 'Failed to login with Facebook');
    }
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
            onPress={handleGoogleLogin}
            disabled={socialLoading || isLoading}
          >
            {socialLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome name="google" size={18} color="#fff" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Google</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialButton, styles.facebookButton]}
            onPress={handleFacebookLogin}
            disabled={socialLoading || isLoading}
          >
            {socialLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <FontAwesome name="facebook" size={18} color="#fff" style={styles.socialIcon} />
                <Text style={styles.socialButtonText}>Facebook</Text>
              </>
            )}
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
    flexDirection: 'row',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 5,
  },
  socialIcon: {
    marginRight: 8,
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
