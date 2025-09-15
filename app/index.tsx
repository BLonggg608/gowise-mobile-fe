import OnBoardingScreen from "@/components/OnBoardingScreen";
import { Colors } from "@/constant/Colors";
import { Redirect } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [user, setUser] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {user ? <Redirect href={"/dashboard"} /> : <OnBoardingScreen />}
    </View>
  );
}
