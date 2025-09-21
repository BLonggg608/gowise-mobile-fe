import { Colors } from "@/constant/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { RelativePathString, Stack, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const statusBarHeight = Constants.statusBarHeight;

const StackLayout = () => {
  const router = useRouter();
  return (
    <Stack
      screenOptions={{
        header: () => (
          <>
            {/* Header */}
            <View style={styles.headerContainer}>
              <View style={styles.header}>
                <View style={styles.headerLeft}>
                  <Ionicons
                    name="location-outline"
                    size={24}
                    color={Colors.WHITE}
                    style={styles.headerIcon}
                  />
                  <Text style={styles.headerTitle}>Gowise</Text>
                </View>
                <View style={styles.headerRight}>
                  <TouchableOpacity style={styles.headerActionIcon}>
                    <Ionicons
                      name="search-outline"
                      size={22}
                      color={Colors.BLACK}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerActionIcon}>
                    <Ionicons
                      name="notifications-outline"
                      size={22}
                      color={Colors.BLACK}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.headerActionIcon}
                    onPress={() =>
                      router.push("/setting" as RelativePathString)
                    }
                  >
                    <Ionicons
                      name="settings-outline"
                      size={22}
                      color={Colors.BLACK}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* User Card */}
              <View style={styles.userCard}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={23} color={Colors.GREEN} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>John Doe</Text>
                  <Text style={styles.userStatus}>
                    <MaterialCommunityIcons
                      name="crown-outline"
                      size={13}
                      color={Colors.YELLOW}
                    />{" "}
                    Premium Member
                  </Text>
                </View>
                {/* <Ionicons name="shield-checkmark" size={22} color={Colors.GREEN} /> */}
              </View>
            </View>
          </>
        ),
      }}
    ></Stack>
  );
};

export default StackLayout;

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  header: {
    width: "100%",
    flexDirection: "row",
    paddingHorizontal: 18,
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: statusBarHeight + 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerIcon: {
    borderRadius: 12,
    padding: 5,
    backgroundColor: Colors.GREEN,
  },
  headerTitle: {
    color: Colors.BLACK,
    fontFamily: "inter-medium",
    fontSize: 22,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerActionIcon: {
    borderRadius: 12,
    padding: 5,
    backgroundColor: "#9c9c9c1e",
    marginLeft: 4,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 18,
    marginVertical: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: "#eaf7f0",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  userStatus: {
    fontFamily: "inter-regular",
    fontSize: 11,
    color: Colors.YELLOW,
    marginTop: 2,
  },
});
