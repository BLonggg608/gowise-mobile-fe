import { Colors } from "@/constant/Colors";
import { deleteSecureData } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { RelativePathString, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

const settingsList = [
  {
    id: "profile",
    icon: "person-outline",
    label: "Profile",
    route: "/setting/profile",
  },
  {
    id: "account-security",
    icon: "shield-outline",
    label: "Account & Security",
    route: "/setting/account-security",
  },
  {
    id: "preferences",
    icon: "settings-outline",
    label: "Preferences",
    route: "/setting/preferences",
  },
  // {
  //   id: "payment-methods",
  //   icon: "card-outline",
  //   label: "Payment Methods",
  //   route: "/setting/payment-methods",
  // },
  {
    id: "help-support",
    icon: "help-outline",
    label: "Help & Support",
    route: "/setting/help-support",
  },
];

const Setting = () => {
  const router = useRouter();

  const onSignOut = () => {
    // clear all secure storage data
    deleteSecureData("accessToken");
    router.replace("/auth/sign-in");
  };
  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Settings List */}
        {settingsList.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.settingItem}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as RelativePathString)}
          >
            <View style={styles.settingIconWrap}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={Colors.GREEN}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{item.label}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.8}
          onPress={onSignOut}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={Colors.WHITE}
            style={{ marginRight: 8 }}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default Setting;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: 18,
    marginTop: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  settingIconWrap: {
    backgroundColor: "#f2fef7ff",
    borderRadius: 50,
    padding: 10,
    marginRight: 14,
  },
  settingLabel: {
    fontSize: 18,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  settingDesc: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginTop: 2,
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GREEN,
    borderRadius: 24,
    paddingVertical: 14,
    marginHorizontal: 18,
    marginTop: 32,
    elevation: 2,
    shadowColor: Colors.GREEN,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    color: Colors.WHITE,
    fontSize: 16,
    fontFamily: "inter-medium",
  },
});
