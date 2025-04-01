import Constants from 'expo-constants';

let API_BASE_URL;

try {
  let debuggerHost;

  if (Constants.expoConfig?.hostUri) {
    debuggerHost = Constants.expoConfig.hostUri;
  } else if (Constants.manifest2?.extra?.expoGo?.debuggerHost) {
    debuggerHost = Constants.manifest2.extra.expoGo.debuggerHost;
  } else if (Constants.manifest?.debuggerHost) {
    debuggerHost = Constants.manifest.debuggerHost;
  }

  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    API_BASE_URL = `http://${ip}:3000/api`;
  } else {
    API_BASE_URL = 'http://localhost:3000/api'; // fallback
  }
} catch (error) {
  API_BASE_URL = 'http://localhost:3000/api'; // fallback
}

console.log('📡 API_BASE_URL (your backend (server) URL):', API_BASE_URL);

export { API_BASE_URL };
