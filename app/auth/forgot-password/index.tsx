import LoadingModal from "@/components/utils/LoadingModal";
import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
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

const ForgotPassword = () => {
  const router = useRouter();

  const [email, setEmail] = useState("");

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

  const handleResetPassword = async () => {
    // turn off keyboard before navigating
    Keyboard.dismiss();

    // call api forgot password
    // console.log(Constants.expoConfig?.extra?.env.FORGOT_PASSWORD_URL);
    try {
      setLoading(true);

      const response = await fetch(
        Constants.expoConfig?.extra?.env.FORGOT_PASSWORD_URL as string,
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

      setLoading(false);

      const data = await response.json();

      // console.log(data);
      if (response.ok) {
        setPendingToast({
          type: "success",
          text1: "Yêu cầu thành công",
          text2: data.message || "Vui lòng kiểm tra email để xem hướng dẫn!",
        });
      } else {
        setPendingToast({
          type: "error",
          text1: "Yêu cầu thất bại",
          text2: data.message || "Vui lòng thử lại sau.",
        });
        return;
      }
    } catch (error) {
      setLoading(false);
      setPendingToast({
        type: "error",
        text1: "Lỗi máy chủ",
        text2: "Vui lòng thử lại sau.",
      });
      console.error(error);
      return;
    }

    // After handling, navigate to the OTP verification screen
    // delay 100ms to allow keyboard to dismiss
    setTimeout(() => {
      router.push({
        pathname: "/auth/verify-otp" as RelativePathString,
        params: { email, from: "forgot-password" },
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

            <Text style={styles.title}>Quên mật khẩu</Text>
            <Text style={styles.description}>
              Vui lòng nhập email để đặt lại mật khẩu
            </Text>

            <View style={styles.loginFormContainer}>
              {/* Email Input */}
              <Text style={styles.label}>Địa chỉ email</Text>
              <View style={styles.input}>
                <Ionicons
                  style={{ marginVertical: "auto" }}
                  name="mail-outline"
                  size={24}
                  color={"#9CA3AF"}
                />
                <TextInput
                  style={styles.inputText}
                  placeholder="Nhập email của bạn"
                  placeholderTextColor={"#9CA3AF"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onChangeText={(value) => setEmail(value)}
                />
              </View>

              {/* Reset Password Button */}
              <TouchableOpacity
                disabled={!email}
                style={[styles.button, { opacity: email ? 1 : 0.5 }]}
                onPress={handleResetPassword}
              >
                <Text
                  style={{
                    fontFamily: "inter-medium",
                    fontSize: 18,
                    color: Colors.WHITE,
                  }}
                >
                  Đặt lại mật khẩu
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

export default ForgotPassword;

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
