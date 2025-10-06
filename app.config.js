import "dotenv/config";

export default {
  expo: {
    name: "GOWISE",
    slug: "gowise",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/gowise_logo.png",
    scheme: "gowise",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/images/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
        },
      ],
      "expo-build-properties",
      "expo-font",
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      env: {
        SIGN_IN_URL: process.env.SIGN_IN_URL,
        SIGN_UP_URL: process.env.SIGN_UP_URL,
        FORGOT_PASSWORD_URL: process.env.FORGOT_PASSWORD_URL,
        VALIDATE_OTP_URL: process.env.VALIDATE_OTP_URL,
        RESET_PASSWORD_URL: process.env.RESET_PASSWORD_URL,
        REFRESH_TOKEN_URL: process.env.REFRESH_TOKEN_URL,
      },
    },
  },
};
