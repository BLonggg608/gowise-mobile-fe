import { useFonts } from "expo-font";
import { Stack } from "expo-router";

export default function RootLayout() {
  useFonts({
    "inter-bold": require("../assets/fonts/Inter_18pt-Bold.ttf"),
    "inter-medium": require("../assets/fonts/Inter_18pt-Medium.ttf"),
    "inter-regular": require("../assets/fonts/Inter_18pt-Regular.ttf"),
  });

  return <Stack screenOptions={{ headerShown: false }} />;
}
