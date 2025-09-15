import ToastNotification from "@/components/utils/ToastNotification";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import ToastManager from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

// Custom toast configuration
const toastConfig = {
  success: (props: ToastShowParams) => (
    <ToastNotification props={props} type="success" />
  ),
  error: (props: ToastShowParams) => (
    <ToastNotification props={props} type="error" />
  ),
};

export default function RootLayout() {
  useFonts({
    "inter-bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
    "inter-medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "inter-regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
  });

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
      <ToastManager config={toastConfig} />
    </>
  );
}
