import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";
import { SafeAreaView } from "react-native-safe-area-context";

const slides = [
  {
    image: require("./../assets/images/StartPage/step1.png"),
    title: "Find your perfect place to stay!",
    description:
      "Discover amazing destinations and accommodations tailored to your preferences with AI-powered recommendations.",
  },
  {
    image: require("./../assets/images/StartPage/step2.png"),
    title: "Automated Itinerary Creation!",
    description:
      "Effortlessly create personalized travel itineraries with our smart planning tools.",
  },
  {
    image: require("./../assets/images/StartPage/step3.png"),
    title: "Start your journey!",
    description:
      "Sign in to unlock personalized features and create your own travel itinerary.",
  },
];

const OnBoardingScreen = () => {
  const router = useRouter();

  const nextDoneButton = (label: string) => {
    return (
      <View style={styles.button}>
        <Text
          style={{
            fontFamily: "inter-medium",
            fontSize: 16,
            color: Colors.WHITE,
            textAlign: "center",
          }}
        >
          {label}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.WHITE}
          style={{ position: "absolute", right: 24, top: 15 }}
        />
      </View>
    );
  };

  const skipPrevButton = (label: string) => {
    return <Text style={styles.skipPrevButton}>{label}</Text>;
  };

  return (
    <AppIntroSlider
      data={slides}
      renderItem={({ item }) => {
        return (
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.slideContainer}>
              <View style={styles.contentContainer}>
                <Image style={styles.image} source={item.image} />
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </View>
          </SafeAreaView>
        );
      }}
      activeDotStyle={{ backgroundColor: Colors.GREEN, width: 30 }}
      bottomButton={true}
      showSkipButton={true}
      showPrevButton={true}
      renderNextButton={() => nextDoneButton("Continue")}
      renderSkipButton={() => skipPrevButton("Skip for now")}
      renderPrevButton={() => skipPrevButton("Back")}
      renderDoneButton={() => nextDoneButton("Sign In")}
      onDone={() => router.push("/auth/sign-in")}
      contentContainerStyle={styles.sliderContentContainer}
    />
  );
};

export default OnBoardingScreen;

const styles = StyleSheet.create({
  slideContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 0,
    paddingBottom: 0,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  image: {
    width: "100%",
    height: 260,
    resizeMode: "contain",
    marginBottom: 32,
  },
  title: {
    fontFamily: "inter-bold",
    fontSize: 24,
    textAlign: "center",
    color: Colors.BLACK,
    marginBottom: 16,
  },
  description: {
    fontFamily: "inter-regular",
    fontSize: 14,
    marginHorizontal: 16,
    textAlign: "center",
    color: Colors.GRAY,
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 10,
    marginTop: 5,
    marginHorizontal: 100,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    position: "relative",
  },
  skipPrevButton: {
    fontFamily: "inter-medium",
    fontSize: 16,
    color: Colors.BLACK,
    textAlign: "center",
    marginTop: 20,
    marginBottom: "15%",
  },
  sliderContentContainer: {
    flexGrow: 1,
    justifyContent: "center",
  },
});
