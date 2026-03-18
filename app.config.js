import 'dotenv/config';

export default {
  expo: {
    name: "mobile",
    slug: "mobile",
    scheme: "ridemate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.ridemate.app",
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
      infoPlist: {
        NSLocationWhenInUseUsageDescription:
          "RideMate needs your location to find nearby rides and set your trip coordinates.",
      },
    },
    android: {
      package: "com.ridemate.app",
      permissions: [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "FOREGROUND_SERVICE",
      ],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
      predictiveBackGestureEnabled: false,
    },
    androidStatusBar: {
      translucent: true,
      backgroundColor: "transparent",
    },
    web: {
      favicon: "./assets/favicon.png",
    },
    plugins: [
      "expo-image-picker",
      "@react-native-community/datetimepicker",
      "expo-router",
      [
        "expo-location",
        {
          locationWhenInUsePermission: "Allow RideMate to use your location.",
        },
      ],
    ],
  },
};
