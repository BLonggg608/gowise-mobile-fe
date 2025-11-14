import ToastNotification from "@/components/utils/ToastNotification";
import { useFonts } from "expo-font";
import * as NavigationBar from "expo-navigation-bar";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Platform } from "react-native";
import ToastManager from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";
import { useEffect } from "react";

// Custom toast configuration
const toastConfig = {
  success: (props: ToastShowParams) => (
    <ToastNotification props={props} type="success" />
  ),
  error: (props: ToastShowParams) => (
    <ToastNotification props={props} type="error" />
  ),
  info: (props: ToastShowParams) => (
    <ToastNotification props={props} type="info" />
  ),
};

export default function RootLayout() {
  useFonts({
    "inter-bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
    "inter-medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "inter-regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
  });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      <ToastManager config={toastConfig} />
    </>
  );
}
