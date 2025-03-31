import Constants from 'expo-constants';

let API_BASE_URL;

try {
  const { debuggerHost } = Constants.expoConfig?.hostUri
    ? { debuggerHost: Constants.expoConfig.hostUri }
    : Constants.manifest2?.extra?.expoGo?.debuggerHost
    ?? Constants.manifest?.debuggerHost;

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    API_BASE_URL = `http://${ip}:3000/api`;
  } 
} catch (error) {
  API_BASE_URL = `http://${ip}:3000/api`; // fallback
}

console.log('📡 API_BASE_URL (your backend (server) URL):', API_BASE_URL);

export { API_BASE_URL };
