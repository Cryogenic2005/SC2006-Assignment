import Constants from 'expo-constants';

let API_BASE_URL;

if (Constants.manifest) {
  const { debuggerHost } = Constants.manifest;
  const ip = debuggerHost.split(':')[0]; // Gets something like '192.168.1.42'
  API_BASE_URL = `http://${ip}:5000/api`; // Replace 5000 if your backend uses a different port
} else {
  API_BASE_URL = 'https://your-production-api.com/api'; // Fallback for production
}

export { API_BASE_URL };
