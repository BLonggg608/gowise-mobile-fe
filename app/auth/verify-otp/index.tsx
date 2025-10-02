import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import {
  RelativePathString,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import { SafeAreaView } from "react-native-safe-area-context";

const VerifyOTP = () => {
  const router = useRouter();

  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const otpMaxLength = 6;

  const handleVerifyOtp = () => {
    // turn off keyboard before navigating
    Keyboard.dismiss();

    // Handle OTP verification logic here
    console.log("Verifying OTP:", otp, "for email:", email);
    // After verification, navigate to the reset password screen
    setTimeout(() => {
      router.push({
        pathname: "/auth/reset-password" as RelativePathString,
        params: { email },
      });
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={{ flex: 1 }}>
        {/* Back Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.headerBackBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back-outline"
            size={28}
            color={Colors.BLACK}
          />
        </TouchableOpacity>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              style={styles.logo}
              source={require("../../../assets/images/gowise_logo.png")}
            />

            <Text style={styles.title}>Verify OTP</Text>
            <Text style={styles.description}>
              Please enter the OTP sent to your email
            </Text>

            <View style={styles.loginFormContainer}>
              {/* OTP Input */}
              <OtpInput
                numberOfDigits={otpMaxLength}
                onTextChange={(text) => setOtp(text)}
                focusColor={Colors.GREEN}
                type="numeric"
                theme={{
                  pinCodeTextStyle: {
                    fontFamily: "inter-regular",
                    color: Colors.BLACK,
                  },
                }}
              />

              {/* Verify Code Button */}
              <TouchableOpacity
                disabled={otp.length !== otpMaxLength}
                style={[
                  styles.button,
                  { opacity: otp.length === otpMaxLength ? 1 : 0.5 },
                ]}
                onPress={handleVerifyOtp}
              >
                <Text
                  style={{
                    fontFamily: "inter-medium",
                    fontSize: 18,
                    color: Colors.WHITE,
                  }}
                >
                  Verify Code
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default VerifyOTP;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginLeft: 8,
    // borderRadius: 8,
    // backgroundColor: "#9c9c9c1e",
  },
  logo: {
    width: "100%",
    height: 120,
    resizeMode: "contain",
    marginTop: "10%",
  },
  title: {
    fontFamily: "inter-bold",
    fontSize: 28,
    textAlign: "center",
    color: Colors.BLACK,
    marginVertical: 8,
  },
  description: {
    fontFamily: "inter-regular",
    fontSize: 15,
    paddingHorizontal: 16,
    textAlign: "center",
    color: Colors.GRAY,
  },
  loginFormContainer: {
    width: "100%",
    marginTop: 30,
    paddingHorizontal: 18,
  },
  label: {
    fontFamily: "inter-medium",
    fontSize: 15,
    color: Colors.BLACK,
  },
  button: {
    backgroundColor: Colors.GREEN,
    padding: 10,
    borderRadius: 10,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
  },
});
