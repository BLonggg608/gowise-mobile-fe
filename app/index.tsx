import OnBoardingScreen from "@/components/OnBoardingScreen";
import { Colors } from "@/constant/Colors";
import { isAccessTokenValid } from "@/utils/tokenUtils";
import { Redirect, RelativePathString } from "expo-router";
import { useEffect, useState } from "react";
import { Image, View } from "react-native";

export default function Index() {
  const [user, setUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  // check if user is logged in
  useEffect(() => {
    const checkToken = async () => {
      setUser(await isAccessTokenValid());
      setLoading(false);
    };
    checkToken();
  }, []);

  console.log(user);
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <Image
            source={require("@/assets/images/gowise_logo.png")}
            style={{ width: 200, height: 200 }}
          />
        </View>
      ) : user ? (
        <Redirect href={"/dashboard" as RelativePathString} />
      ) : (
        <OnBoardingScreen />
      )}
    </View>
  );
}
