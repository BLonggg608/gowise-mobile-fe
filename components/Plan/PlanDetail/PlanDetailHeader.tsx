import { Colors } from "@/constant/Colors";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const statusBarHeight = Constants.statusBarHeight;

const planStatusColors: { [key: string]: string } = {
  Active: Colors.LIGHT_GREEN,
  Draft: Colors.YELLOW,
  Completed: Colors.GREEN,
};

const PlanDetailHeader = ({
  title,
  status,
}: {
  title: string;
  status: string;
}) => {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={{ flexDirection: "row", width: "70%" }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerBackBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.BLACK} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} lineBreakMode="tail" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View
        style={[
          styles.statusBadge,
          { backgroundColor: planStatusColors[status] },
        ]}
      >
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
};

export default PlanDetailHeader;

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
    flex: 1,
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  statusText: {
    color: Colors.WHITE,
    fontSize: 12,
    fontFamily: "inter-regular",
  },
});
