import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
    email,
    password,
  });
  console.log('Login response for debugging (authService):', response.data);
  return response.data;
};

const register = async (name, email, password, userType) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
    name,
    email,
    password,
    userType,
  });
  return response.data;
};

const socialLogin = async (provider, token, email, name) => {
  const response = await axios.post(`${API_BASE_URL}/api/auth/social-login`, {
    provider,
    token,
    email,
    name
  });
  console.log('Social login response for debugging:', response.data);
  return response.data;
};

const authService = {
  login,
  register,
  socialLogin,
};

export default authService;