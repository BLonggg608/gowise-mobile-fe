import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import constants from "expo-constants";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const STATUSBAR_HEIGHT = constants.statusBarHeight;

export type HeaderProps = {
  subtitle?: string;
  onMenuPress: () => void;
};

const Header = ({ subtitle, onMenuPress }: HeaderProps) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onMenuPress} style={styles.headerIconBtn}>
      <Ionicons name="menu" size={26} color={Colors.GREEN} />
    </TouchableOpacity>
    <View style={{ flex: 1 }}>
      <Text style={styles.headerTitle}>AI Travel Assistant</Text>
      {subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
    </View>
  </View>
);

export default Header;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: STATUSBAR_HEIGHT + 12,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerIconBtn: {
    marginRight: 12,
    padding: 4,
    borderRadius: 8,
    backgroundColor: "#F0FDFA",
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerSubtitle: {
    fontSize: 13,
    color: Colors.LIGHT_GREEN,
    fontFamily: "inter-regular",
    marginTop: 2,
  },
});
