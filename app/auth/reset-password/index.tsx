import LoadingModal from "@/components/LoadingModal";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Toast } from "toastify-react-native";

const ResetPassword = () => {
  const router = useRouter();

  const [unhidePassword, setUnhidePassword] = useState(true);

  const { email } = useLocalSearchParams();
  const { otp } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    // Handle password update logic here
    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Update Failed",
        text2: "Passwords do not match",
      });
      return;
    }

    // call api to update password
    // console.log(Constants.expoConfig?.extra?.env.RESET_PASSWORD_URL);
    setLoading(true);

    try {
      const response = await fetch(
        Constants.expoConfig?.extra?.env.RESET_PASSWORD_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            otp: otp,
            new_password: password,
          }),
        }
      );
      const data = await response.json();

      setLoading(false);

      // console.log(data);
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Reset Successful",
          text2: data.message || "Your password has been updated!",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Reset Failed",
          text2: data.message || "Please try again later.",
        });
        return;
      }
    } catch (error) {
      console.error(error);
      return;
    }

    // After updating, navigate to the sign-in screen
    Keyboard.dismiss();
    setTimeout(() => {
      router.replace("/auth/sign-in");
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

            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.description}>
              Create a new password. Ensure it differs from previous ones
            </Text>

            <View style={styles.loginFormContainer}>
              {/* Password */}
              <Text style={[styles.label, { marginTop: 16 }]}>Password</Text>
              <View style={styles.input}>
                <Ionicons
                  style={{ marginVertical: "auto" }}
                  name="lock-closed-outline"
                  size={24}
                  color={"#9CA3AF"}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter your password"
                  placeholderTextColor={"#9CA3AF"}
                  secureTextEntry={unhidePassword}
                  autoCapitalize="none"
                  onChangeText={(value) => setPassword(value)}
                />
                <TouchableOpacity
                  onPress={() => setUnhidePassword(!unhidePassword)}
                >
                  <Ionicons
                    style={{ marginVertical: "auto" }}
                    name={unhidePassword ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color={"#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <Text style={[styles.label, { marginTop: 16 }]}>
                Confirm Password
              </Text>
              <View style={styles.input}>
                <Ionicons
                  style={{ marginVertical: "auto" }}
                  name="lock-closed-outline"
                  size={24}
                  color={"#9CA3AF"}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter your password"
                  placeholderTextColor={"#9CA3AF"}
                  secureTextEntry={unhidePassword}
                  autoCapitalize="none"
                  onChangeText={(value) => setConfirmPassword(value)}
                />
                <TouchableOpacity
                  onPress={() => setUnhidePassword(!unhidePassword)}
                >
                  <Ionicons
                    style={{ marginVertical: "auto" }}
                    name={unhidePassword ? "eye-outline" : "eye-off-outline"}
                    size={24}
                    color={"#9CA3AF"}
                  />
                </TouchableOpacity>
              </View>

              {/* Update Password Button */}
              <TouchableOpacity
                disabled={!password || !confirmPassword}
                style={[
                  styles.button,
                  { opacity: password && confirmPassword ? 1 : 0.5 },
                ]}
                onPress={handleUpdatePassword}
              >
                <Text
                  style={{
                    fontFamily: "inter-medium",
                    fontSize: 18,
                    color: Colors.WHITE,
                  }}
                >
                  Update Password
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

export default ResetPassword;

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
  input: {
    // if android padding vertical: 0, ios padding vertical: 10
    paddingVertical: Platform.OS === "android" ? 0 : 10,
    paddingHorizontal: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#D7DAE0",
    borderRadius: 8,
    flexDirection: "row",
  },
  inputText: {
    fontFamily: "inter-regular",
    fontSize: 16,
    color: Colors.BLACK,
    marginLeft: 6,
    flex: 1,
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
