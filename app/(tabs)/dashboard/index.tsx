import UpdateInfo from "@/components/Dashboard/UpdateInfo";
import { Colors } from "@/constant/Colors";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import Constants from "expo-constants";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { deleteSecureData, getSecureData } from "@/utils/storage";
import RecentPlanCard from "@/components/Dashboard/RecentPlanCard";
import { saveData } from "@/utils/localStorage";
import { Toast } from "toastify-react-native";

export type userInfoType = {
  firstName: string;
  lastName: string;
  isPremium: boolean;
} | null;

// Plan API types and helpers (reuse from plan screen)
type ApiPlan = {
  _id?: { $oid?: string };
  id?: string;
  plan_id?: string;
  planId?: string;
  planID?: string;
  created_at?: string;
  createdAt?: string;
  status?: string;
  plan_content?: Record<string, unknown>;
  planContent?: Record<string, unknown>;
  [key: string]: unknown;
};

type DashboardPlan = {
  id: string;
  title: string;
  subtitle: string;
  location: string;
  durationInDays: number;
  status: string;
  progress: number;
  image?: any;
  createdValue: number;
  raw: ApiPlan;
};

type WeatherInfo = {
  city: string;
  temp: string;
  desc: string;
  rawDesc: string;
  humidity: string;
  wind: string;
  uv: string;
  icon: string;
};

type FriendRelation = {
  userId: string;
  friendId: string;
  status: boolean;
  isSender: boolean;
};

const getPlanIdentifier = (plan: ApiPlan) => {
  const content =
    (plan.plan_content as Record<string, unknown> | undefined) ??
    (plan.planContent as Record<string, unknown> | undefined) ??
    {};
  return (
    plan._id?.$oid ||
    (typeof plan.plan_id === "string" ? plan.plan_id : undefined) ||
    (typeof plan.planId === "string" ? plan.planId : undefined) ||
    (typeof plan.planID === "string" ? plan.planID : undefined) ||
    (typeof plan.id === "string" ? plan.id : undefined) ||
    (typeof content?.plan_id === "string" ? content.plan_id : undefined) ||
    (typeof content?.planId === "string" ? content.planId : undefined)
  );
};

const parseDateValue = (value?: unknown) => {
  if (!value || typeof value !== "string") return null;
  if (value.includes("/")) {
    const parts = value.split("/").map((part) => Number(part));
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) return parsed;
    }
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";
  if (!domain) {
    throw new Error("Thiếu cấu hình máy chủ");
  }
  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const formattedPath = path.startsWith("/") ? path : `/${path}`;
  return port
    ? `${trimmedDomain}:${port}${formattedPath}`
    : `${trimmedDomain}${formattedPath}`;
};

const transformPlan = (plan: ApiPlan): DashboardPlan | null => {
  const content =
    (plan.plan_content as Record<string, unknown> | undefined) ??
    (plan.planContent as Record<string, unknown> | undefined) ??
    {};
  const id = getPlanIdentifier(plan);
  if (!id) return null;
  const destination =
    (content.destination as string | undefined) ||
    (content.location as string | undefined) ||
    (plan.destination as string | undefined) ||
    "Không xác định";
  const startDateRaw =
    (content.startDate as string | undefined) ||
    (content.start_date as string | undefined);
  const endDateRaw =
    (content.endDate as string | undefined) ||
    (content.end_date as string | undefined);
  const startDate = parseDateValue(startDateRaw);
  const endDate = parseDateValue(endDateRaw);
  const durationInDays =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil(
            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;
  const subtitle = `${destination} • ${
    durationInDays > 0 ? durationInDays + " ngày" : "Không rõ"
  }`;
  const statusRaw = (plan.status || content.status || "active") as string;
  let status = "Đang hoạt động";
  if (statusRaw.toLowerCase().includes("draft")) status = "Bản nháp";
  else if (statusRaw.toLowerCase().includes("complete")) status = "Hoàn thành";
  // Progress: completed = 1, draft = 0.6, active = 0.85 (demo)
  let progress = 0.85;
  if (status === "Hoàn thành") progress = 1;
  else if (status === "Bản nháp") progress = 0.6;
  // Image: lấy từ content nếu có, hoặc null
  let image = undefined;
  if (content.image) image = content.image;
  // createdValue for sorting
  const createdDate =
    parseDateValue(plan.created_at) ||
    parseDateValue(plan.createdAt) ||
    parseDateValue(content.createdAt);
  const createdValue = createdDate ? createdDate.getTime() : 0;
  // Title
  const title =
    (content.title as string | undefined) ||
    (plan.title as string | undefined) ||
    (destination !== "Không xác định"
      ? `Chuyến đi đến ${destination}`
      : "Kế hoạch không xác định");
  const ensuredId = id as string;
  return {
    id: ensuredId,
    title,
    subtitle,
    location: destination,
    durationInDays,
    status,
    progress,
    image,
    createdValue,
    raw: plan,
  };
};

const planStatusColors: { [key: string]: string } = {
  "Đang hoạt động": Colors.LIGHT_GREEN,
  "Bản nháp": Colors.YELLOW,
  "Hoàn thành": Colors.GREEN,
};

const WEATHER_DESCRIPTION_MAP: Record<string, string> = {
  sunny: "Nắng",
  clear: "Trời quang",
  "partly cloudy": "Ít mây",
  cloudy: "Nhiều mây",
  overcast: "Âm u",
  mist: "Sương nhẹ",
  "patchy rain possible": "Có thể mưa rải rác",
  "patchy snow possible": "Có thể có tuyết",
  "patchy sleet possible": "Có thể có mưa tuyết",
  "patchy freezing drizzle possible": "Có thể có mưa lạnh nhẹ",
  "thundery outbreaks possible": "Có thể có dông",
  "blowing snow": "Tuyết bay mạnh",
  blizzard: "Bão tuyết",
  fog: "Sương mù",
  "freezing fog": "Sương lạnh",
  "patchy light drizzle": "Mưa phùn nhẹ",
  "light drizzle": "Mưa phùn",
  "freezing drizzle": "Mưa lạnh",
  "heavy freezing drizzle": "Mưa lạnh dày",
  "patchy light rain": "Mưa nhẹ",
  "light rain": "Mưa nhỏ",
  "moderate rain at times": "Mưa vừa",
  "moderate rain": "Mưa vừa",
  "heavy rain at times": "Mưa to",
  "heavy rain": "Mưa lớn",
  "light freezing rain": "Mưa lạnh nhẹ",
  "moderate or heavy freezing rain": "Mưa lạnh lớn",
  "light sleet": "Mưa tuyết nhẹ",
  "moderate or heavy sleet": "Mưa tuyết",
  "patchy light snow": "Tuyết nhẹ",
  "light snow": "Tuyết nhẹ",
  "patchy moderate snow": "Tuyết vừa",
  "moderate snow": "Tuyết vừa",
  "patchy heavy snow": "Tuyết lớn",
  "heavy snow": "Tuyết lớn",
  "ice pellets": "Mưa đá nhỏ",
  "light rain shower": "Mưa rào nhẹ",
  "moderate or heavy rain shower": "Mưa rào",
  "torrential rain shower": "Mưa xối xả",
  "light sleet showers": "Mưa tuyết nhẹ",
  "moderate or heavy sleet showers": "Mưa tuyết rào",
  "light snow showers": "Mưa tuyết nhẹ",
  "moderate or heavy snow showers": "Mưa tuyết rào",
  "light showers of ice pellets": "Mưa đá nhỏ nhẹ",
  "moderate or heavy showers of ice pellets": "Mưa đá nhỏ",
  "patchy light rain with thunder": "Mưa nhẹ có sấm",
  "moderate or heavy rain with thunder": "Mưa lớn có sấm",
  "patchy light snow with thunder": "Tuyết nhẹ có sấm",
  "moderate or heavy snow with thunder": "Tuyết lớn có sấm",
};

const translateWeatherDescription = (description: string) => {
  const key = description.toLowerCase();
  return WEATHER_DESCRIPTION_MAP[key] ?? description;
};

const Dashboard = () => {
  const router = useRouter();
  const [plans, setPlans] = useState<DashboardPlan[]>([]);
  const [weather, setWeather] = useState<WeatherInfo[]>([]);
  const [userInfo, setUserInfo] = useState<userInfoType>(null);
  const [updateVisible, setUpdateVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userInfoLoading, setUserInfoLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(true);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [hasPendingFriendRequests, setHasPendingFriendRequests] =
    useState(false);

  // Fetch user info (giữ nguyên)
  const checkUserInfo = useCallback(async () => {
    setUserInfoLoading(true);
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        setUserInfo(null);
        setUpdateVisible(true);
        return;
      }

      const response = await fetch(
        `${Constants.expoConfig?.extra?.env.USER_URL}/${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok && data?.data) {
        setUserInfo({
          firstName: data.data.firstName,
          lastName: data.data.lastName,
          isPremium: data.data.isPremium,
        });
      } else {
        setUpdateVisible(true);
      }
    } catch (error) {
      console.error("Failed to fetch user info", error);
      await deleteSecureData("accessToken");
      router.replace("/auth/sign-in");
    } finally {
      setUserInfoLoading(false);
    }
  }, [router]);

  useEffect(() => {
    checkUserInfo();
  }, [checkUserInfo]);

  const fetchPendingFriendRequests = useCallback(async () => {
    try {
      const token = await getSecureData("accessToken");
      const userId = await getUserIdFromToken();

      if (!token || !userId) {
        setHasPendingFriendRequests(false);
        return;
      }

      const response = await fetch(buildApiUrl("/users/friends/pending"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const reason = await response.text();
        throw new Error(
          reason || `Request failed with status ${response.status}`
        );
      }

      const payload = await response.json();
      const relations: FriendRelation[] = Array.isArray(payload?.data)
        ? payload.data
        : [];

      const hasIncoming = relations.some((relation) => !relation.isSender);
      setHasPendingFriendRequests(hasIncoming);
    } catch (error) {
      console.error("[dashboard] fetchPendingFriendRequests", error);
      setHasPendingFriendRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingFriendRequests().catch((error) => {
      console.error("[dashboard] pending indicator effect", error);
    });
  }, [fetchPendingFriendRequests]);

  // Fetch plans from API (giống plan screen)
  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const userId = await getUserIdFromToken();
      if (!userId) {
        setPlans([]);
        return;
      }
      const response = await fetch(buildApiUrl(`/plans/${userId}`), {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        setPlans([]);
        throw new Error("Request failed");
      }
      const data = await response.json();
      const rawPlans: ApiPlan[] = Array.isArray(data?.plans)
        ? data.plans
        : Array.isArray(data)
        ? data
        : [];
      const transformed = rawPlans
        .map(transformPlan)
        .filter((plan): plan is DashboardPlan => Boolean(plan));
      transformed.sort((a, b) => b.createdValue - a.createdValue);
      setPlans(transformed);
    } catch (err) {
      setPlans([]);
      throw err;
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans().catch(() => {
      Toast.show({
        type: "error",
        text1: "Không thể tải kế hoạch",
        text2: "Vui lòng kéo để làm mới và thử lại.",
      });
    });
  }, [fetchPlans]);

  const fetchWeather = useCallback(async () => {
    if (plans.length === 0) {
      setWeather([]);
      setWeatherLoading(false);
      return;
    }

    setWeatherLoading(true);
    const weatherData: WeatherInfo[] = [];

    try {
      const latestCities = plans
        .map((plan) => plan.location)
        .filter((value) => value && value !== "Không xác định")
        .filter((value, index, self) => self.indexOf(value) === index)
        .slice(0, 3);

      if (latestCities.length === 0) {
        setWeather([]);
        return;
      }

      const apiKey = Constants.expoConfig?.extra?.env?.WEATHER_API_KEY ?? "";

      for (const city of latestCities) {
        const response = await fetch(
          `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(
            city
          )}&aqi=no`
        );
        const data = await response.json();
        if (response.ok && data?.current) {
          const condition = data.current;
          const description: string = condition?.condition?.text ?? "";
          weatherData.push({
            city,
            temp: `${Math.round(condition.temp_c)}°C`,
            desc: translateWeatherDescription(description),
            rawDesc: description,
            humidity: `${condition.humidity}%`,
            wind: `${Math.round(condition.wind_kph)} km/h`,
            uv: `UV ${Math.round(condition.uv)}`,
            icon: `https:${condition?.condition.icon}`,
          });
        } else {
          console.error(`Failed to fetch weather for ${city}:`, data);
        }
      }

      setWeather(weatherData);
    } catch (error) {
      console.error("Failed to fetch weather data", error);
    } finally {
      setWeatherLoading(false);
    }
  }, [plans]);

  useEffect(() => {
    fetchWeather().catch(() => {
      // Toast.show({
      //   type: "error",
      //   text1: "Không thể tải thời tiết",
      //   text2: "Vui lòng kéo để làm mới và thử lại.",
      // });
      console.error("Failed to fetch weather data");
    });
  }, [fetchWeather]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchPlans(),
        checkUserInfo(),
        fetchPendingFriendRequests(),
      ]);
    } catch {
      Toast.show({
        type: "error",
        text1: "Không thể làm mới",
        text2: "Vui lòng thử lại sau.",
      });
    } finally {
      setRefreshing(false);
    }
  }, [fetchPlans, checkUserInfo]);

  const handleOpenPlan = useCallback(
    async (plan: DashboardPlan) => {
      try {
        const planRaw = (plan.raw ?? {}) as Record<string, unknown>;
        const planContentCandidate =
          (planRaw["plan_content"] as Record<string, unknown> | undefined) ??
          (planRaw["planContent"] as Record<string, unknown> | undefined);

        const planData: Record<string, unknown> = planContentCandidate
          ? { ...planContentCandidate }
          : { ...planRaw };

        if (Object.keys(planData).length === 0) {
          Toast.show({
            type: "error",
            text1: "Không có dữ liệu kế hoạch",
            text2: "Không thể mở kế hoạch này.",
          });
          return;
        }

        if (plan.id) {
          if (!planData["plan_id"]) {
            planData["plan_id"] = plan.id;
          }

          if (!planData["planId"]) {
            planData["planId"] = plan.id;
          }
        }

        if (!planData["title"]) {
          planData["title"] = plan.title;
        }

        if (!planData["destination"]) {
          planData["destination"] = plan.location;
        }

        if (!planData["status"]) {
          planData["status"] = plan.status;
        }

        if (!planData["hasExistingPlan"]) {
          planData["hasExistingPlan"] = true;
        }

        await saveData({ key: "travelPlanData", value: planData });

        router.push({
          pathname: "/plan/plan-result",
          params: { from: "open-plan" },
        });
      } catch (err) {
        console.error("[dashboard] openPlan error", err);
        Toast.show({
          type: "error",
          text1: "Không thể mở kế hoạch",
          text2:
            err instanceof Error
              ? err.message
              : "Đã xảy ra lỗi, vui lòng thử lại sau.",
        });
      }
    },
    [router]
  );

  const isInitialLoading = userInfoLoading || plansLoading || weatherLoading;

  if (isInitialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator color={Colors.GREEN} size="large" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* <StatusBar style="dark" /> */}

      {/* Header */}
      <DashboardHeader
        {...(userInfo || { firstName: "", lastName: "", isPremium: false })}
        hasPendingFriendRequests={hasPendingFriendRequests}
      />

      <ScrollView
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.GREEN}
            colors={[Colors.GREEN]}
          />
        }
      >
        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons
              name="pulse-outline"
              size={28}
              color={Colors.GREEN}
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>{plans.length}</Text>
            <Text style={styles.summaryLabel}>Tổng số kế hoạch</Text>
            <Text
              style={[
                [
                  styles.summaryLabel,
                  { color: Colors.GRAY, fontSize: 11, marginTop: 0 },
                ],
              ]}
            >
              Tất cả thời gian
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons
              name="trending-up-outline"
              size={28}
              color={Colors.GREEN}
              style={styles.summaryIcon}
            />
            <Text style={styles.summaryValue}>
              {plans.filter((p) => p.status === "Đang hoạt động").length}
            </Text>
            <Text style={styles.summaryLabel}>Kế hoạch đang hoạt động</Text>
            <Text
              style={[
                [
                  styles.summaryLabel,
                  { color: Colors.GRAY, fontSize: 11, marginTop: 0 },
                ],
              ]}
            >
              Đang thực hiện
            </Text>
          </View>
        </View>

        {/* Recent Plans */}
        <Text style={styles.sectionTitle}>Kế hoạch gần đây</Text>
        {plans.length === 0 ? (
          <View
            style={[
              styles.weatherCard,
              styles.weatherStateCard,
              { marginHorizontal: 18 },
            ]}
          >
            <Text style={styles.weatherStateText}>Chưa có kế hoạch nào.</Text>
            <Text style={styles.weatherStateSubText}>
              Tạo kế hoạch mới để bắt đầu.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ marginBottom: 8, padding: 4 }}
          >
            {plans.slice(0, 3).map((plan) => (
              <RecentPlanCard
                key={plan.id}
                title={plan.title}
                location={plan.location}
                durationInDays={plan.durationInDays}
                status={plan.status}
                statusColor={planStatusColors[plan.status] ?? Colors.GRAY}
                onPress={() => handleOpenPlan(plan)}
              />
            ))}
          </ScrollView>
        )}

        <Text style={styles.sectionTitle}>Thời tiết</Text>
        <View style={styles.weatherRow}>
          {weatherLoading ? (
            <View style={[styles.weatherCard, styles.weatherStateCard]}>
              <ActivityIndicator color={Colors.GREEN} size="small" />
              <Text style={styles.weatherStateText}>Đang tải thời tiết...</Text>
            </View>
          ) : weather.length === 0 ? (
            <View style={[styles.weatherCard, styles.weatherStateCard]}>
              <Text style={styles.weatherStateText}>
                Chưa có dữ liệu thời tiết.
              </Text>
              <Text style={styles.weatherStateSubText}>
                Tạo hoặc mở kế hoạch để nhận đề xuất thời tiết cập nhật.
              </Text>
            </View>
          ) : (
            weather.map((w, idx) => (
              <View key={`${w.city}-${idx}`} style={styles.weatherCard}>
                <Text style={styles.weatherCity}>{w.city}</Text>
                <View style={styles.weatherHeaderRow}>
                  <Image
                    source={{ uri: w.icon }}
                    style={{ width: 32, height: 32 }}
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
                  <MaterialCommunityIcons
                    name="eye-outline"
                    color={Colors.RED}
                  />{" "}
                  {w.uv}
                </Text>
              </View>
            ))
          )}
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
    backgroundColor: "#F8FAFC",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: {
    marginTop: 12,
    color: Colors.GRAY,
    fontFamily: "inter-regular",
    fontSize: 14,
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
  weatherHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherCity: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginBottom: 2,
    textTransform: "capitalize",
  },
  weatherTemp: {
    fontSize: 16,
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
  weatherStateCard: {
    alignItems: "center",
    justifyContent: "center",
  },
  weatherStateText: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 12,
  },
  weatherStateSubText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
});
