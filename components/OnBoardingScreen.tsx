import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import AppIntroSlider from "react-native-app-intro-slider";

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
  const [showHomePage, setShowHomePage] = useState(false);

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
          style={{ position: "absolute", right: 40, top: 17 }}
        />
      </View>
    );
  };

  const skipPrevButton = (label: string) => {
    return (
      <Text
        style={{
          fontFamily: "inter-medium",
          fontSize: 16,
          color: Colors.BLACK,
          textAlign: "center",
          marginTop: "5%",
          marginBottom: "30%",
        }}
      >
        {label}
      </Text>
    );
  };

  if (!showHomePage) {
    return (
      <AppIntroSlider
        data={slides}
        renderItem={({ item }) => {
          return (
            <View>
              <Image
                style={{
                  width: "100%",
                  height: 300,
                  resizeMode: "contain",
                  marginTop: "50%",
                }}
                source={item.image}
              />

              <Text
                style={{
                  fontFamily: "inter-bold",
                  fontSize: 24,
                  marginTop: 40,
                  textAlign: "center",
                  color: Colors.BLACK,
                }}
              >
                {item.title}
              </Text>

              <Text
                style={{
                  fontFamily: "inter-regular",
                  fontSize: 14,
                  marginTop: 20,
                  marginHorizontal: 30,
                  textAlign: "center",
                  color: Colors.GRAY,
                }}
              >
                {item.description}
              </Text>
            </View>
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
        onDone={() => router.push({ pathname: "/auth/sign-in" })}
      />
    );
  }

  return (
    <View
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    ></View>
  );
};

export default OnBoardingScreen;

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.GREEN,
    padding: 15,
    borderRadius: 10,
    marginTop: 5,
    marginHorizontal: 100,
  },
});
