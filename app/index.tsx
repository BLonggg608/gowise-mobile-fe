import OnBoardingScreen from "@/components/OnBoardingScreen";
import { Colors } from "@/constant/Colors";
import { isAccessTokenValid } from "@/utils/tokenUtils";
import { Redirect, RelativePathString } from "expo-router";
import { useState } from "react";
import { View } from "react-native";

export default function Index() {
  const [user, setUser] = useState<boolean>(false);

  // check if user is logged in
  (async () => {
    setUser(await isAccessTokenValid());
  })();

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
