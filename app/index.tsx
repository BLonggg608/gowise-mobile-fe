import OnBoardingScreen from "@/components/OnBoardingScreen";
import { Colors } from "@/constant/Colors";
import { Redirect, RelativePathString } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [user, setUser] = useState(null);
  console.log(user);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {user ? (
        <Redirect href={"/dashboard" as RelativePathString} />
      ) : (
        <OnBoardingScreen />
      )}
    </View>
  );
}
