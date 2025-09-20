import { Colors } from "@/constant/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const statusBarHeight = Constants.statusBarHeight;

const plans = [
  {
    title: "Tokyo Adventure",
    subtitle: "Japan • 7 days",
    status: "Active",
    progress: 0.85,
    image: require("@/assets/images/PlanImage/1.jpg"),
  },
  {
    title: "European Explorer",
    subtitle: "Europe • 14 days",
    status: "Draft",
    progress: 0.6,
    image: require("@/assets/images/PlanImage/2.jpg"),
  },
  {
    title: "Bali Retreat",
    subtitle: "Indonesia • 10 days",
    status: "Completed",
    progress: 1,
    image: require("@/assets/images/PlanImage/3.jpg"),
  },
];

const weather = [
  {
    city: "Tokyo, Japan",
    temp: "22°C",
    desc: "Sunny",
    humidity: "65%",
    wind: "12 km/h",
    uv: "UV 6",
    icon: "sunny-outline",
  },
  {
    city: "Paris, France",
    temp: "18°C",
    desc: "Cloudy",
    humidity: "76%",
    wind: "8 km/h",
    uv: "UV 3",
    icon: "cloud-outline",
  },
  {
    city: "Bali, Indonesia",
    temp: "28°C",
    desc: "Rain",
    humidity: "85%",
    wind: "15 km/h",
    uv: "UV 4",
    icon: "rainy-outline",
  },
];

const planStatusColors: { [key: string]: string } = {
  Active: Colors.LIGHT_GREEN,
  Draft: Colors.YELLOW,
  Completed: Colors.GREEN,
};

const weatherStatusColors: { [key: string]: string } = {
  Sunny: Colors.YELLOW,
  Cloudy: Colors.GRAY,
  Rain: Colors.GREEN,
};

const Dashboard = () => {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
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
              <Ionicons name="search-outline" size={22} color={Colors.BLACK} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionIcon}>
              <Ionicons
                name="notifications-outline"
                size={22}
                color={Colors.BLACK}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionIcon}>
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

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons
              name="pulse-outline"
              size={28}
              color={Colors.GREEN}
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>3</Text>
            <Text style={styles.summaryLabel}>Total Plans</Text>
            <Text
              style={[
                [
                  styles.summaryLabel,
                  { color: Colors.GRAY, fontSize: 11, marginTop: 0 },
                ],
              ]}
            >
              All time
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons
              name="trending-up-outline"
              size={28}
              color={Colors.GREEN}
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>1</Text>
            <Text style={styles.summaryLabel}>Active Plans</Text>
            <Text
              style={[
                [
                  styles.summaryLabel,
                  { color: Colors.GRAY, fontSize: 11, marginTop: 0 },
                ],
              ]}
            >
              In progress
            </Text>
          </View>
        </View>

        {/* Recent Plans */}
        <Text style={styles.sectionTitle}>Recent Plans</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ marginBottom: 8, padding: 4 }}
        >
          {plans.map((plan, idx) => (
            <TouchableOpacity key={idx} style={styles.planCard}>
              <View style={styles.planImageWrap}>
                {!plan.image ? (
                  <Ionicons
                    name="image-outline"
                    size={80}
                    color="#ccc"
                    style={styles.planImageIcon}
                  />
                ) : (
                  <Image
                    source={plan.image}
                    style={{
                      resizeMode: "cover",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                )}
                {/* Replace with <Image> for real images */}
              </View>
              <View style={{ padding: 12 }}>
                <View style={styles.planHeader}>
                  <Text
                    style={styles.planTitle}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {plan.title}
                  </Text>
                  <View
                    style={[
                      styles.planStatus,
                      {
                        backgroundColor: planStatusColors[plan.status],
                      },
                    ]}
                  >
                    <Text style={styles.planStatusText}>{plan.status}</Text>
                  </View>
                </View>
                <Text style={styles.planSubtitle}>{plan.subtitle}</Text>
                <View style={styles.progressBarWrap}>
                  <View
                    style={[
                      styles.progressBar,
                      {
                        width: `${plan.progress * 100}%`,
                        backgroundColor: Colors.GREEN,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressPercent}>
                  {Math.round(plan.progress * 100)}%
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Weather Board */}
        <Text style={styles.sectionTitle}>Weather Board</Text>
        <View style={styles.weatherRow}>
          {weather.map((w, idx) => (
            <View key={idx} style={styles.weatherCard}>
              <Text style={styles.weatherCity}>{w.city}</Text>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Ionicons
                  name={w.icon as any}
                  size={22}
                  color={weatherStatusColors[w.desc]}
                />
                <Text style={styles.weatherTemp}>{w.temp}</Text>
              </View>
              <Text style={styles.weatherDesc}>{w.desc}</Text>
              <Text style={styles.weatherStat}>
                <MaterialCommunityIcons
                  name="water-outline"
                  color={Colors.GREEN}
                />{" "}
                {w.humidity}
              </Text>
              <Text style={styles.weatherStat}>
                <MaterialCommunityIcons
                  name="weather-windy"
                  color={Colors.GRAY}
                />{" "}
                {w.wind}
              </Text>
              <Text style={styles.weatherStat}>
                <MaterialCommunityIcons name="eye-outline" color={Colors.RED} />{" "}
                {w.uv}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planImageIcon: {
    position: "absolute",
    left: 0,
    top: 0,
  },
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
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 12,
    marginTop: 18,
    marginBottom: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  summaryIcon: {
    padding: 6,
    backgroundColor: "#f2fef7ff",
    borderRadius: 12,
  },
  summaryValue: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginVertical: 2,
  },
  summaryLabel: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    textAlign: "center",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginHorizontal: 18,
    marginTop: 12,
    marginBottom: 8,
  },
  planCard: {
    width: 220,
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    marginLeft: 18,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  planImageWrap: {
    height: 110,
    backgroundColor: "#eaeaea",
    alignItems: "center",
    justifyContent: "center",
  },
  planTitle: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    flex: 1,
    maxWidth: "70%",
  },
  planSubtitle: {
    fontSize: 13,
    color: Colors.GRAY,
    marginTop: 2,
    marginBottom: 6,
  },
  planStatus: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
    alignSelf: "flex-start",
  },
  planStatusText: {
    color: Colors.WHITE,
    fontSize: 11,
    fontFamily: "inter-medium",
  },
  progressBarWrap: {
    height: 6,
    backgroundColor: "#eee",
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 2,
    overflow: "hidden",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 11,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    marginTop: 2,
    textAlign: "right",
  },
  weatherRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 18,
    marginTop: 4,
  },
  weatherCard: {
    flex: 1,
    backgroundColor: Colors.WHITE,
    borderRadius: 14,
    padding: 14,
    marginHorizontal: 4,
    alignItems: "flex-start",
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  weatherCity: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
    marginBottom: 2,
  },
  weatherTemp: {
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginLeft: 6,
  },
  weatherDesc: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  weatherStatsRow: {
    flexDirection: "row",
    marginTop: 2,
  },
  weatherStat: {
    fontSize: 11,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginRight: 10,
  },
});
