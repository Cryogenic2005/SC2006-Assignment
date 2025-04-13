export default {
  name: "HawkerGo",
  slug: "hawkergo",
  version: "1.0.0",
  scheme: "myapp",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  splash: {
    image: "./assets/images/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.yourdomain.hawkergo"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF"
    },
    package: "com.yourdomain.hawkergo"
  },
  web: {
    favicon: "./assets/images/favicon.png"
  },
  extra: {
    // You need both web and iOS client IDs
    googleWebClientId: "714013846272-kk0userh1l0eu63ae4jgmjkulmluk4gk.apps.googleusercontent.com",
    googleIosClientId: "714013846272-i9vbb2rrdnjpj0r7e2lafv15bna035cc.apps.googleusercontent.com",
    googleAndroidClientId: "714013846272-jnbrlcplb8ks8200puc506ukgg4i574g.apps.googleusercontent.com",
    facebookAppId: "YOUR_FACEBOOK_APP_ID",
  }
};
