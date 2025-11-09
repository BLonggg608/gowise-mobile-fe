import LoadingModal from "@/components/utils/LoadingModal";
import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { decodeToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { RelativePathString, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";
import { ToastShowParams } from "toastify-react-native/utils/interfaces";

const statusBarHeight = Constants.statusBarHeight;

// Dummy data, replace with API data later
const securityOptions = [
  {
    id: "password",
    icon: "lock-closed-outline",
    title: "Mật khẩu",
    desc: "Đổi lần cuối 3 tháng trước",
    action: "Đổi",
    onPress: () => {},
  },
  {
    id: "2fa",
    icon: "phone-portrait-outline",
    title: "Xác thực 2 lớp",
    desc: "Thêm lớp bảo mật cho tài khoản",
    action: "Bật",
    onPress: () => {},
  },
  {
    id: "api",
    icon: "key-outline",
    title: "API Key",
    desc: "Quản lý quyền truy cập API",
    action: "Quản lý",
    onPress: () => {},
  },
];

// Main Account Security screen
const AccountSecurity = () => {
  const router = useRouter();

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

  const getEmail = async () => {
    const accessToken = await getSecureData("accessToken");
    const decoded = decodeToken(accessToken || "");
    const email = decoded?.email || null;

    console.log("Decoded email:", email);
    return email;
  };

  const onPressChangePassword = async () => {
    setLoading(true);

    const email = await getEmail();

    if (!email) {
      setLoading(false);
      setPendingToast({
        type: "error",
        text1: "Lỗi máy chủ",
        text2: "Vui lòng thử lại sau.",
      });
      return;
    }

    try {
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

    router.push({
      pathname: "/auth/verify-otp" as RelativePathString,
      params: { email, from: "change-password"},
    });
  };
  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản & Bảo mật</Text>
      </View>

      {/* Security options list */}
      <ScrollView
        contentContainerStyle={styles.card}
        showsVerticalScrollIndicator={false}
      >
        {securityOptions.map((item, idx) => (
          <View
            key={item.id}
            style={{
              backgroundColor: Colors.WHITE,
              borderRadius: 12,
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 18,
              paddingHorizontal: 18,
              marginBottom: idx < securityOptions.length - 1 ? 16 : 0,
            }}
          >
            {/* Icon */}
            <Ionicons
              name={item.icon as any}
              size={26}
              color={Colors.GRAY}
              style={{ marginRight: 16 }}
            />
            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text style={styles.optionTitle}>{item.title}</Text>
              <Text style={styles.optionDesc}>{item.desc}</Text>
            </View>
            {/* Action button */}
            <TouchableOpacity
              onPress={
                ["Bật", "Quản lý"].includes(item.action)
                  ? item.onPress
                  : onPressChangePassword
              }
              style={
                ["Bật", "Quản lý"].includes(item.action)
                  ? {
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: Colors.GRAY + "20",
                    }
                  : {
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: Colors.GREEN,
                    }
              }
              activeOpacity={["Bật", "Quản lý"].includes(item.action) ? 1 : 0.5}
            >
              <Text
                style={
                  ["Bật", "Quản lý"].includes(item.action)
                    ? {
                        color: Colors.GRAY + "80",
                        fontSize: 15,
                        fontFamily: "inter-medium",
                      }
                    : {
                        color: Colors.WHITE,
                        fontSize: 15,
                        fontFamily: "inter-medium",
                      }
                }
              >
                {item.action}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <LoadingModal visible={loading} />
    </View>
  );
};

export default AccountSecurity;

// Styles for Account Security screen
const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    // alignItems: "center",
    // justifyContent: "space-between",
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerBackBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#9c9c9c1e",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  card: {
    borderRadius: 16,
    margin: 18,
    shadowColor: Colors.BLACK,
    flexGrow: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 2,
  },
  optionDesc: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
});
