import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const SignUp = () => {
  const router = useRouter();

  const [unhidePassword, setUnhidePassword] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const onSignUp = () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Sign Up Failed",
        text2: "All fields are required",
      });
      return;
    }
    router.replace("../auth/sign-in");
  };
  return (
    <View style={styles.container}>
      <Image
        style={styles.logo}
        source={require("../../../assets/images/gowise_logo.png")}
      />

      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.description}>
        Start planning your perfect trips with AI
      </Text>

      <View style={styles.loginFormContainer}>
        {/* Full Name */}
        <Text style={styles.label}>Full Name</Text>
        <View style={styles.input}>
          <Ionicons
            style={{ marginVertical: "auto" }}
            name="person-outline"
            size={24}
            color={"#9CA3AF"}
          />
          <TextInput
            style={styles.inputText}
            placeholder="Enter your full name"
            placeholderTextColor={"#9CA3AF"}
            autoCapitalize="words"
            onChangeText={(value) => setFullName(value)}
          />
        </View>

        {/* Email */}
        <Text style={[styles.label, { marginTop: 16 }]}>Email Address</Text>
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
          <TouchableOpacity onPress={() => setUnhidePassword(!unhidePassword)}>
            <Ionicons
              style={{ marginVertical: "auto" }}
              name={unhidePassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color={"#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Confirm Password */}
        <Text style={[styles.label, { marginTop: 16 }]}>Confirm Password</Text>
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
          <TouchableOpacity onPress={() => setUnhidePassword(!unhidePassword)}>
            <Ionicons
              style={{ marginVertical: "auto" }}
              name={unhidePassword ? "eye-outline" : "eye-off-outline"}
              size={24}
              color={"#9CA3AF"}
            />
          </TouchableOpacity>
        </View>

        {/* Create Account Button */}
        <TouchableOpacity style={styles.button} onPress={onSignUp}>
          <Text
            style={{
              fontFamily: "inter-medium",
              fontSize: 18,
              color: Colors.WHITE,
            }}
          >
            Create Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sign In */}
      <View style={{ flexDirection: "row", marginTop: 24 }}>
        <Text
          style={{
            fontFamily: "inter-regular",
            fontSize: 16,
            color: Colors.BLACK,
          }}
        >
          Already have an account?
        </Text>
        <TouchableOpacity
          style={{ marginLeft: 5 }}
          onPress={() => router.replace("../auth/sign-in")}
        >
          <Text
            style={{
              fontFamily: "inter-medium",
              fontSize: 16,
              color: Colors.LIGHT_GREEN,
            }}
          >
            Sign In
          </Text>
        </TouchableOpacity>
      </View>

      {/* Term of Service and Privacy Policy */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          marginTop: 24,
          width: "80%",
        }}
      >
        <Text
          style={{
            fontFamily: "inter-regular",
            fontSize: 12,
            color: Colors.GRAY,
          }}
        >
          By creating an account, you agree to our
        </Text>

        <TouchableOpacity style={{ marginLeft: 4 }} onPress={() => {}}>
          <Text
            style={{
              fontFamily: "inter-medium",
              fontSize: 12,
              color: Colors.LIGHT_GREEN,
            }}
          >
            Term of Service
          </Text>
        </TouchableOpacity>

        <Text
          style={{
            fontFamily: "inter-regular",
            fontSize: 12,
            color: Colors.GRAY,
            marginLeft: 4,
          }}
        >
          and
        </Text>

        <TouchableOpacity style={{ marginLeft: 4 }} onPress={() => {}}>
          <Text
            style={{
              fontFamily: "inter-medium",
              fontSize: 12,
              color: Colors.LIGHT_GREEN,
            }}
          >
            Privacy Policy
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SignUp;

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
    marginTop: "20%",
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
