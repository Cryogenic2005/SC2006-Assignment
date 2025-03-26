import axios from 'axios';
import { API_URL } from '../constants/api';

const login = async (email, password) => {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });
  return response.data;
};

const register = async (name, email, password, userType) => {
  const response = await axios.post(`${API_URL}/auth/register`, {
    name,
    email,
    password,
    userType,
  });
  return response.data;
};

const socialLogin = async (provider, token) => {
  const response = await axios.post(`${API_URL}/auth/social-login`, {
    provider,
    token,
  });
  return response.data;
};

const authService = {
  login,
  register,
  socialLogin,
};

export default authService;