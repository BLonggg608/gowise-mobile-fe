import LoadingModal from "@/components/LoadingModal";
import { Colors } from "@/constant/Colors";
import { saveSecureData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { Checkbox } from "expo-checkbox";
import Constants from "expo-constants";
import { RelativePathString, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

const SignIn = () => {
  const router = useRouter();

  const [unhidePassword, setUnhidePassword] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isChecked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingToast, setPendingToast] = useState<ToastShowParams | null>(
    null
  );

  useEffect(() => {
    if (!loading && pendingToast) {
      Toast.show(pendingToast);
      setPendingToast(null);
    }
  }, [loading, pendingToast]);

  const onSignIn = async () => {
    if (!email || !password) {
      setPendingToast({
        type: "error",
        text1: "Login Failed",
        text2: "Email and password are required",
      });
      return;
    }

    // call api to sign in
    // console.log(Constants.expoConfig?.extra?.env.SIGN_IN_API_URL);
    try {
      setLoading(true);

      const response = await fetch(
        Constants.expoConfig?.extra?.env.SIGN_IN_URL as string,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ login: email, password: password }),
        }
      );

      setLoading(false);

      const data = await response.json();

      // console.log(data);
      if (response.ok) {
        Toast.show({
          type: "success",
          text1: "Login Successful",
          text2: "Welcome back!",
        });

        // save token to local storage
        await saveSecureData({ key: "accessToken", value: data.accessToken });
        await saveSecureData({ key: "refreshToken", value: data.refreshToken });
      } else {
        setPendingToast({
          type: "error",
          text1: "Login Failed",
          text2: (data.message as string) || "Please try again later.",
        });
        console.log("Login failed:", data.message);

        return;
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      return;
    }

    Keyboard.dismiss();
    setTimeout(() => {
      router.replace("/dashboard" as RelativePathString);
    }, 100);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.container}>
            <Image
              style={styles.logo}
              source={require("../../../assets/images/gowise_logo.png")}
            />

            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.description}>
              Sign in to continue your travel planning
            </Text>

            <View style={styles.loginFormContainer}>
              {/* Email */}
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.input}>
                <Ionicons
                  style={{ marginVertical: "auto" }}
                  name="mail-outline"
                  size={24}
                  color={"#9CA3AF"}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Enter your email"
                  placeholderTextColor={"#9CA3AF"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(value) => setEmail(value)}
                />
              </View>

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

              {/* Remember me and Forgot password? */}
              <View style={{ flexDirection: "row", marginTop: 16 }}>
                <Checkbox
                  value={isChecked}
                  onValueChange={setChecked}
                  color={isChecked ? Colors.LIGHT_GREEN : Colors.BLACK}
                  style={{
                    marginVertical: "auto",
                    borderRadius: 4,
                    borderWidth: 1,
                  }}
                />
                <TouchableOpacity
                  style={{ marginLeft: 8, flex: 1 }}
                  onPress={() => setChecked(!isChecked)}
                >
                  <Text style={styles.label}>Remember me</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setTimeout(() => {
                      router.push("../auth/forgot-password");
                    }, 100);
                  }}
                >
                  <Text style={[styles.label, { color: "#0284C7" }]}>
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Sign In Button */}
              <TouchableOpacity style={styles.button} onPress={onSignIn}>
                <Text
                  style={{
                    fontFamily: "inter-medium",
                    fontSize: 18,
                    color: Colors.WHITE,
                  }}
                >
                  Sign In
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sign Up */}
            <View style={{ flexDirection: "row", marginTop: 24 }}>
              <Text
                style={{
                  fontFamily: "inter-regular",
                  fontSize: 16,
                  color: Colors.BLACK,
                }}
              >
                Don&apos;t have an account?
              </Text>
              <TouchableOpacity
                style={{ marginLeft: 5 }}
                onPress={() => {
                  Keyboard.dismiss();
                  setTimeout(() => {
                    router.replace("../auth/sign-up");
                  }, 100);
                }}
              >
                <Text
                  style={{
                    fontFamily: "inter-medium",
                    fontSize: 16,
                    color: Colors.LIGHT_GREEN,
                  }}
                >
                  Sign Up
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

export default SignIn;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 24,
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
