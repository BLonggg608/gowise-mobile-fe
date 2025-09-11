import OnBoardingScreen from "@/components/OnBoardingScreen";
import { Colors } from "@/constant/Colors";
import { View } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.WHITE }}>
      <OnBoardingScreen />
      
    </View>
  );
}
