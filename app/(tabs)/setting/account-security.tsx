import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
              onPress={item.onPress}
              style={
                item.action === "Enable"
                  ? {
                      backgroundColor: Colors.GREEN,
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 18,
                    }
                  : {
                      backgroundColor: "transparent",
                      borderRadius: 8,
                      paddingVertical: 6,
                      paddingHorizontal: 10,
                    }
              }
            >
              <Text
                style={
                  item.action === "Enable"
                    ? {
                        color: Colors.WHITE,
                        fontSize: 15,
                        fontFamily: "inter-medium",
                      }
                    : {
                        color: Colors.GREEN,
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
