import LoadingModal from "@/components/utils/LoadingModal";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
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
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

const VerifyOTP = () => {
  const router = useRouter();

  const { email } = useLocalSearchParams();
  const [otp, setOtp] = useState("");
  const otpMaxLength = 6;

  const [loading, setLoading] = useState(false);
  const [pendingToast, setPendingToast] = useState<ToastShowParams | null>(
    null
  );

  React.useEffect(() => {
    if (!loading && pendingToast) {
      Toast.show(pendingToast);
      setPendingToast(null);
    }
  }, [loading, pendingToast]);

  const handleVerifyOtp = async () => {
    // turn off keyboard before navigating
    Keyboard.dismiss();

    // call api to verify otp
    // console.log(Constants.expoConfig?.extra?.env.VALIDATE_OTP_URL);
    try {
      setLoading(true);

      const response = await fetch(
        Constants.expoConfig?.extra?.env.VALIDATE_OTP_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
          }),
        }
      );

      setLoading(false);

      const data = await response.json();

      // console.log(data);
      if (response.ok) {
        setPendingToast({
          type: "success",
          text1: "Your OTP is verified",
          text2: data.message || "You can now reset your password!",
        });
      } else {
        setPendingToast({
          type: "error",
          text1: "Verification Failed",
          text2: data.message || "Please try again later.",
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      return;
    }

    // After verification, navigate to the reset password screen
    setTimeout(() => {
      router.push({
        pathname: "/auth/reset-password" as RelativePathString,
        params: { email, otp },
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

              {/* OTP resend button */}
              <TouchableOpacity
                activeOpacity={0.7}
                style={{ marginTop: 10 }}
                onPress={async () => {
                  // Handle resend OTP
                  try {
                    const response = await fetch(
                      Constants.expoConfig?.extra?.env
                        .FORGOT_PASSWORD_URL as string,
                      {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                          email: email,
                        }),
                      }
                    );
                    const data = await response.json();
                    // console.log(data);
                    if (response.ok) {
                      Toast.show({
                        type: "success",
                        text1: "Request Successful",
                        text2:
                          data.message ||
                          "Please check your email for instructions!",
                      });
                    } else {
                      Toast.show({
                        type: "error",
                        text1: "Request Failed",
                        text2: data.message || "Please try again later.",
                      });
                      return;
                    }
                  } catch (error) {
                    console.error(error);
                    return;
                  }
                }}
              >
                <Text style={styles.label}>Resend OTP</Text>
              </TouchableOpacity>

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
      <LoadingModal visible={loading} />
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
    color: "#0284C7",
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
