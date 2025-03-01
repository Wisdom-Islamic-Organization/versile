export default {
  expo: {
    name: "versile",
    slug: "versile",
    version: "1.2.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "versile",
    userInterfaceStyle: "automatic",
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
      eas: {
        projectId: "8e4dbd27-e6ee-423c-9904-85ce27b80a8e"
      }
    },
    ios: {
      supportsTablet: true
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.jpeg",
        backgroundColor: "#ffffff"
      },
      package: "com.versile.app",
      versionCode: 3,
      splash: {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png"
    },
    plugins: ["expo-router"],
    owner: "pilgrimfathers",
    splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    updates: {
      url: "https://u.expo.dev/8e4dbd27-e6ee-423c-9904-85ce27b80a8e"
    },
    runtimeVersion: {
      policy: "appVersion"
    }
  }
};
