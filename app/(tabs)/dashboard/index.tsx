import UpdateInfo from "@/components/Dashboard/UpdateInfo";
import { Colors } from "@/constant/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { RelativePathString, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import Constants from "expo-constants";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";

export type userInfoType = {
  firstName: string;
  lastName: string;
  isPremium: boolean;
} | null;

const initialPlans = [
  {
    id: "1",
    title: "Tokyo Adventure",
    subtitle: "Japan • 7 days",
    status: "Active",
    progress: 0.85,
    image: require("@/assets/images/PlanImage/1.jpg"),
  },
  {
    id: "2",
    title: "European Explorer",
    subtitle: "Europe • 14 days",
    status: "Draft",
    progress: 0.6,
    image: require("@/assets/images/PlanImage/2.jpg"),
  },
  {
    id: "3",
    title: "Bali Retreat",
    subtitle: "Indonesia • 10 days",
    status: "Completed",
    progress: 1,
    image: require("@/assets/images/PlanImage/3.jpg"),
  },
];

const initialWeather = [
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
  const router = useRouter();
  const [plans, setPlans] = useState(initialPlans);
  const [weather, setWeather] = useState(initialWeather);
  const [userInfo, setUserInfo] = useState<userInfoType>(null);

  const [updateVisible, setUpdateVisible] = useState(false);

  useEffect(() => {
    // fetch user info to check if need to update info
    // if need to update, setUpdateVisible(true)
    checkUserInfo();
  }, []);

  const checkUserInfo = async () => {
    const userId = await getUserIdFromToken();

    try {
      const response = await fetch(
        Constants.expoConfig?.extra?.env.USER_URL + `/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setUserInfo({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          isPremium: data.data.isPremium,
        });
        console.log(userInfo);
      } else {
        setUpdateVisible(true);
      }
    } catch (error) {
      console.error("Failed to fetch user info", error);
    }
  };

  return (
    <View style={styles.container}>
      {/* <StatusBar style="dark" /> */}

      {/* Header */}
      <DashboardHeader
        {...(userInfo || { firstName: "", lastName: "", isPremium: false })}
      />

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
            <TouchableOpacity
              key={idx}
              style={styles.planCard}
              activeOpacity={0.7}
              onPress={() => {
                router.push(`/plan/${plan.id}` as RelativePathString);
              }}
            >
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
      {/* Update Personal Information */}
      <UpdateInfo
        visible={updateVisible}
        setVisible={setUpdateVisible}
        setUserInfo={setUserInfo}
      />
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
