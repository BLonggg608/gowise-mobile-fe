import { Colors } from "@/constant/Colors";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Toast } from "toastify-react-native";

const statusBarHeight = Constants.statusBarHeight;

type ItineraryDay = {
  key: string;
  number: number;
  data: Record<string, unknown> | null;
};

type StoredTravelPlanData = {
  hasExistingPlan?: boolean;
  travelType?: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  participants?: string;
  budget?: string;
  flightData?: Record<string, unknown> | null;
  hotelData?: Record<string, unknown> | null;
  itineraryData?: Record<string, unknown> | null;
  itineraryDays?: ItineraryDay[];
  selectedInterests?: string[];
  userLocation?: { lat: number; lon: number } | null;
  plan_id?: string;
  planId?: string;
  title?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  summary?: {
    destination?: string;
    durationDays?: number;
    participants?: number;
    budget?: string | number;
    flightPrice?: number;
    hotelPrice?: number;
    estimatedTotal?: number;
  };
  flightOptions?: Record<string, unknown>[];
  hotelOptions?: Record<string, unknown>[];
};

const parseDateString = (value?: string | null) => {
  if (!value) return null;
  if (value.includes("/")) {
    const parts = value.split("/").map((part) => Number(part));
    if (parts.length === 3) {
      const [day, month, year] = parts;
      const parsed = new Date(year, month - 1, day);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateDisplay = (date: Date | null) => {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const parseCurrency = (value: unknown) => {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
};

const formatCurrency = (value: number) => {
  if (!value) return "$0";
  return `$${Math.max(value, 0).toLocaleString("en-US")}`;
};

const pickString = (
  source: Record<string, unknown>,
  paths: (string | number)[][]
): string | undefined => {
  for (const path of paths) {
    let current: unknown = source;
    let matched = true;

    for (const key of path) {
      if (
        current &&
        typeof current === "object" &&
        key in (current as Record<string, unknown>)
      ) {
        current = (current as Record<string, unknown>)[key as string];
      } else {
        matched = false;
        break;
      }
    }

    if (matched && typeof current === "string" && current.trim()) {
      return current.trim();
    }
  }

  return undefined;
};

const flattenValue = (value: unknown): string => {
  if (!value && value !== 0) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return value.toString();
  if (Array.isArray(value)) {
    return value
      .map((item) => flattenValue(item))
      .filter(Boolean)
      .join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const preferred = [
      "description",
      "detail",
      "details",
      "summary",
      "activity",
      "title",
      "time",
    ];
    for (const key of preferred) {
      if (typeof record[key] === "string" && record[key]) {
        return record[key] as string;
      }
    }
    return Object.values(record)
      .map((item) => flattenValue(item))
      .filter(Boolean)
      .join(", ");
  }
  return "";
};

const capitalizeKey = (value: string) =>
  value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();

const extractItineraryActivities = (data: Record<string, unknown> | null) => {
  if (!data) return [] as string[];

  const activities: string[] = [];
  const direct = data.activities;
  if (Array.isArray(direct)) {
    direct
      .map((item) => flattenValue(item))
      .filter(Boolean)
      .forEach((item) => activities.push(item));
  }

  const blocks = ["morning", "afternoon", "evening", "night"];
  blocks.forEach((key) => {
    if (key in data) {
      const text = flattenValue(data[key]);
      if (text) {
        activities.push(`${capitalizeKey(key)}: ${text}`);
      }
    }
  });

  Object.entries(data).forEach(([key, value]) => {
    if (
      ["title", "summary", "day", "date", "activities", ...blocks].includes(key)
    ) {
      return;
    }
    const text = flattenValue(value);
    if (text) {
      activities.push(`${capitalizeKey(key)}: ${text}`);
    }
  });

  return activities;
};

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    throw new Error("Thiếu cấu hình máy chủ");
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const PlanResult = () => {
  const router = useRouter();
  const [planData, setPlanData] = useState<StoredTravelPlanData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTravelPlan = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stored = await AsyncStorage.getItem("travelPlanData");
      if (!stored) {
        setPlanData(null);
        setError("Không tìm thấy dữ liệu kế hoạch. Hãy tạo kế hoạch mới.");
      } else {
        const parsed = JSON.parse(stored) as StoredTravelPlanData;
        setPlanData(parsed);
      }
    } catch (err) {
      console.error("[planResult] loadTravelPlan", err);
      setPlanData(null);
      setError("Không thể tải dữ liệu kế hoạch. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTravelPlan();
    }, [loadTravelPlan])
  );

  const startDate = useMemo(
    () => parseDateString(planData?.startDate),
    [planData?.startDate]
  );
  const endDate = useMemo(
    () => parseDateString(planData?.endDate),
    [planData?.endDate]
  );

  const tripDuration = useMemo(() => {
    if (!startDate || !endDate) return 1;
    const diff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(diff, 1);
  }, [startDate, endDate]);

  const participantsCount = useMemo(() => {
    const parsed = Number(planData?.participants);
    if (Number.isNaN(parsed) || parsed <= 0) return 1;
    return parsed;
  }, [planData?.participants]);

  const bestFlight = useMemo(() => {
    if (!planData?.flightData || typeof planData.flightData !== "object")
      return null;
    const record = planData.flightData as Record<string, unknown>;
    if (record.no_flights_found) return null;

    if (record.top_1 && typeof record.top_1 === "object") {
      const candidate = (record.top_1 as Record<string, unknown>).flight;
      if (candidate && typeof candidate === "object") {
        return candidate as Record<string, unknown>;
      }
      return record.top_1 as Record<string, unknown>;
    }

    if (Array.isArray(record.flights) && record.flights.length > 0) {
      return record.flights[0] as Record<string, unknown>;
    }

    if (Array.isArray(record.data) && record.data.length > 0) {
      return record.data[0] as Record<string, unknown>;
    }

    return null;
  }, [planData?.flightData]);

  const bestHotel = useMemo(() => {
    if (!planData?.hotelData || typeof planData.hotelData !== "object")
      return null;
    const record = planData.hotelData as Record<string, unknown>;
    if (record.no_hotels_found) return null;

    if (record.top_1 && typeof record.top_1 === "object") {
      const candidate = (record.top_1 as Record<string, unknown>).hotel;
      if (candidate && typeof candidate === "object") {
        return candidate as Record<string, unknown>;
      }
      return record.top_1 as Record<string, unknown>;
    }

    if (Array.isArray(record.hotels) && record.hotels.length > 0) {
      return record.hotels[0] as Record<string, unknown>;
    }

    if (Array.isArray(record.data) && record.data.length > 0) {
      return record.data[0] as Record<string, unknown>;
    }

    return null;
  }, [planData?.hotelData]);

  const hasNoFlights = useMemo(() => {
    if (!planData?.flightData || typeof planData.flightData !== "object")
      return false;
    return Boolean(
      (planData.flightData as Record<string, unknown>).no_flights_found
    );
  }, [planData?.flightData]);

  const hasNoHotels = useMemo(() => {
    if (!planData?.hotelData || typeof planData.hotelData !== "object")
      return false;
    return Boolean(
      (planData.hotelData as Record<string, unknown>).no_hotels_found
    );
  }, [planData?.hotelData]);

  const flightErrorMessage = useMemo(() => {
    if (!planData?.flightData || typeof planData.flightData !== "object")
      return null;
    const record = planData.flightData as Record<string, unknown>;
    return typeof record.message === "string" ? record.message : null;
  }, [planData?.flightData]);

  const hotelErrorMessage = useMemo(() => {
    if (!planData?.hotelData || typeof planData.hotelData !== "object")
      return null;
    const record = planData.hotelData as Record<string, unknown>;
    return typeof record.message === "string" ? record.message : null;
  }, [planData?.hotelData]);

  const itineraryDays = useMemo<ItineraryDay[]>(() => {
    if (!planData?.itineraryData || typeof planData.itineraryData !== "object")
      return [];
    const record = planData.itineraryData as Record<string, unknown>;
    const container = record.data as Record<string, unknown> | undefined;
    const itinerary = container?.itinerary as
      | Record<string, unknown>
      | undefined;
    if (!itinerary) return [];

    return Object.entries(itinerary)
      .filter(([key]) => /^day_\d+$/i.test(key))
      .map(([key, value]) => ({
        key,
        number: Number(key.split("_")[1]) || 0,
        data:
          value && typeof value === "object"
            ? (value as Record<string, unknown>)
            : null,
      }))
      .sort((a, b) => a.number - b.number);
  }, [planData?.itineraryData]);

  const itineraryErrorMessage = useMemo(() => {
    if (
      !planData?.itineraryData ||
      typeof planData.itineraryData !== "object"
    ) {
      return null;
    }
    const record = planData.itineraryData as Record<string, unknown>;
    if (record.success === false && typeof record.message === "string") {
      return record.message;
    }
    return null;
  }, [planData?.itineraryData]);

  const flightPrice = useMemo(() => {
    if (!bestFlight) return 0;
    return (
      parseCurrency(bestFlight.price_value) || parseCurrency(bestFlight.price)
    );
  }, [bestFlight]);

  const hotelPrice = useMemo(() => {
    if (!bestHotel) return 0;
    return (
      parseCurrency(bestHotel.price_value) ||
      parseCurrency(bestHotel.price_per_night) ||
      parseCurrency(bestHotel.price)
    );
  }, [bestHotel]);

  const estimatedTotal = useMemo(() => {
    if (!flightPrice && !hotelPrice) return 0;
    return flightPrice + hotelPrice * tripDuration;
  }, [flightPrice, hotelPrice, tripDuration]);

  const flightDetails = useMemo(() => {
    if (!bestFlight) return null;
    const details = bestFlight as Record<string, unknown>;
    const departureCity = pickString(details, [
      ["departure_city"],
      ["departure_airport"],
      ["from"],
      ["origin"],
    ]);
    const arrivalCity = pickString(details, [
      ["arrival_city"],
      ["arrival_airport"],
      ["to"],
      ["destination"],
    ]);
    return {
      airline: pickString(details, [
        ["airline"],
        ["carrier"],
        ["carrier_name"],
        ["marketing_carrier"],
      ]),
      flightNumber: pickString(details, [
        ["flight_number"],
        ["number"],
        ["marketing_carrier_flight_number"],
      ]),
      route:
        departureCity && arrivalCity
          ? `${departureCity} → ${arrivalCity}`
          : pickString(details, [["route"], ["travel_route"]]),
      departureTime: pickString(details, [
        ["departure_time"],
        ["outbound", "departure_time"],
        ["departure", "time"],
        ["departure"],
      ]),
      arrivalTime: pickString(details, [
        ["arrival_time"],
        ["outbound", "arrival_time"],
        ["arrival", "time"],
        ["arrival"],
      ]),
      duration: pickString(details, [
        ["duration"],
        ["flight_duration"],
        ["travel_time"],
      ]),
      cabin: pickString(details, [["cabin"], ["travel_class"]]),
    };
  }, [bestFlight]);

  const hotelDetails = useMemo(() => {
    if (!bestHotel) return null;
    const details = bestHotel as Record<string, unknown>;
    const rating = (() => {
      const raw = details.rating;
      if (typeof raw === "number") return raw.toFixed(1).replace(/\.0$/, "");
      if (typeof raw === "string" && raw.trim()) return raw.trim();
      return pickString(details, [
        ["star_rating"],
        ["review_score"],
        ["score"],
      ]);
    })();
    return {
      name: pickString(details, [["name"], ["hotel_name"], ["title"]]),
      address: pickString(details, [
        ["address"],
        ["full_address"],
        ["location"],
      ]),
      rating,
      checkIn: pickString(details, [["check_in"], ["check_in_date"]]),
      checkOut: pickString(details, [["check_out"], ["check_out_date"]]),
      roomType: pickString(details, [["room_type"], ["room"], ["type"]]),
    };
  }, [bestHotel]);

  const handleSavePlan = useCallback(async () => {
    if (!planData) {
      Toast.show({
        type: "error",
        text1: "Không có dữ liệu kế hoạch",
        text2: "Hãy tạo kế hoạch trước khi lưu.",
      });
      return;
    }

    try {
      setIsSaving(true);
      const userId = await getUserIdFromToken();
      if (!userId) {
        throw new Error(
          "Không thể xác định người dùng. Vui lòng đăng nhập lại."
        );
      }

      const planId =
        planData.plan_id ||
        planData.planId ||
        `plan_${Date.now().toString(36)}`;
      const nowIso = new Date().toISOString();
      const status =
        planData.status || (planData.hasExistingPlan ? "active" : "draft");
      const title =
        planData.title ||
        (planData.destination
          ? `Travel plan to ${planData.destination}`
          : "Travel plan");
      const destinationLabelLocal = planData.destination || "Your destination";

      const summary = {
        destination:
          destinationLabelLocal !== "Your destination"
            ? destinationLabelLocal
            : undefined,
        durationDays: tripDuration,
        participants: participantsCount,
        budget: planData.budget,
        flightPrice,
        hotelPrice,
        estimatedTotal,
      };

      const persistedPlan: StoredTravelPlanData = {
        ...planData,
        plan_id: planId,
        planId,
        title,
        status,
        createdAt: planData.createdAt || nowIso,
        updatedAt: nowIso,
        hasExistingPlan: true,
        summary,
        flightOptions: bestFlight ? [bestFlight] : [],
        hotelOptions: bestHotel ? [bestHotel] : [],
        itineraryDays,
      };

      const response = await fetch(buildApiUrl("/plans/save"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          plan_id: planId,
          plan_content: persistedPlan,
        }),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "Lưu kế hoạch thất bại. Vui lòng thử lại sau."
        );
      }

      await AsyncStorage.setItem(
        "travelPlanData",
        JSON.stringify(persistedPlan)
      );
      setPlanData(persistedPlan);

      Toast.show({
        type: "success",
        text1: "Đã lưu kế hoạch",
        text2: "Kế hoạch du lịch đã được lưu thành công.",
      });

      router.replace("/(tabs)/plan");
    } catch (err) {
      console.error("[planResult] handleSavePlan", err);
      Toast.show({
        type: "error",
        text1: "Không thể lưu kế hoạch",
        text2:
          err instanceof Error
            ? err.message
            : "Đã xảy ra lỗi, vui lòng thử lại sau.",
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    bestFlight,
    bestHotel,
    estimatedTotal,
    flightPrice,
    hotelPrice,
    itineraryDays,
    participantsCount,
    planData,
    router,
    tripDuration,
  ]);

  const handleModifySearch = useCallback(() => {
    router.replace("/(tabs)/plan");
  }, [router]);

  const handleGoBack = useCallback(() => {
    router.back();
  }, [router]);

  const destinationLabel = planData?.destination || "Your destination";
  const formattedStart = formatDateDisplay(startDate);
  const formattedEnd = formatDateDisplay(endDate);
  const participantsLabel =
    participantsCount === 1 ? "1 person" : `${participantsCount} people`;
  const budgetLabel = formatCurrency(parseCurrency(planData?.budget));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleGoBack}
          style={styles.headerButton}
        >
          <Ionicons color={Colors.BLACK} name="arrow-back" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Plan Results</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      {isLoading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.loadingText}>Đang tải dữ liệu kế hoạch...</Text>
        </View>
      ) : !planData ? (
        <View style={styles.emptyState}>
          <Ionicons color={Colors.GRAY} name="file-tray-outline" size={42} />
          <Text style={styles.emptyTitle}>Chưa có dữ liệu kế hoạch</Text>
          <Text style={styles.emptySubtitle}>
            {error || "Hãy tạo một kế hoạch mới để xem kết quả chi tiết."}
          </Text>
          <TouchableOpacity
            onPress={handleModifySearch}
            style={styles.emptyButton}
          >
            <Text style={styles.emptyButtonText}>Tạo kế hoạch mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryTitle}>
                  {destinationLabel !== "Your destination"
                    ? `Travel Plans for ${destinationLabel}`
                    : "Your Travel Plan Results"}
                </Text>
                <Text style={styles.summarySubtitle}>
                  {formattedStart && formattedEnd
                    ? `${formattedStart} - ${formattedEnd}`
                    : "Date not set"}
                  {" • "}
                  {participantsLabel}
                  {" • Budget: "}
                  {budgetLabel}
                </Text>
              </View>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleModifySearch}
                style={styles.modifyButton}
              >
                <Ionicons
                  color={Colors.GREEN}
                  name="create-outline"
                  size={16}
                />
                <Text style={styles.modifyButtonText}>Modify Search</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.summaryStatsRow}>
              <View style={[styles.summaryStatBox, styles.summaryStatSpacer]}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {tripDuration} day{tripDuration !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={[styles.summaryStatBox, styles.summaryStatSpacer]}>
                <Text style={styles.statLabel}>Travel Type</Text>
                <Text style={styles.statValue}>
                  {planData?.travelType === "international"
                    ? "International"
                    : "Domestic"}
                </Text>
              </View>
              <View style={styles.summaryStatBox}>
                <Text style={styles.statLabel}>Plan Status</Text>
                <Text style={styles.statValue}>
                  {planData?.hasExistingPlan ? "Existing" : "New"}
                </Text>
              </View>
            </View>

            {Array.isArray(planData.selectedInterests) &&
            planData.selectedInterests.length > 0 ? (
              <View style={styles.interestBlock}>
                <Text style={styles.sectionLabel}>Your Interests</Text>
                <View style={styles.chipRow}>
                  {planData.selectedInterests.map((interest) => {
                    const label = interest?.trim?.() ?? "Unknown";
                    return (
                      <View key={interest} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    color={Colors.GREEN}
                    name="airplane-outline"
                    size={18}
                  />
                </View>
                <Text style={styles.sectionTitle}>Available Flights</Text>
              </View>
              {flightPrice ? (
                <Text style={styles.sectionMeta}>
                  {formatCurrency(flightPrice)}
                </Text>
              ) : null}
            </View>
            {bestFlight ? (
              <View>
                {flightDetails?.airline ? (
                  <Text style={styles.sectionPrimaryText}>
                    {flightDetails.airline}
                  </Text>
                ) : null}
                {flightDetails?.route ? (
                  <Text style={styles.sectionSecondaryText}>
                    {flightDetails.route}
                  </Text>
                ) : null}
                <View style={styles.sectionInfoGrid}>
                  {flightDetails?.departureTime ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Departure</Text>
                      <Text style={styles.infoValue}>
                        {flightDetails.departureTime}
                      </Text>
                    </View>
                  ) : null}
                  {flightDetails?.arrivalTime ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Arrival</Text>
                      <Text style={styles.infoValue}>
                        {flightDetails.arrivalTime}
                      </Text>
                    </View>
                  ) : null}
                  {flightDetails?.duration ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Duration</Text>
                      <Text style={styles.infoValue}>
                        {flightDetails.duration}
                      </Text>
                    </View>
                  ) : null}
                  {flightDetails?.flightNumber ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Flight</Text>
                      <Text style={styles.infoValue}>
                        {flightDetails.flightNumber}
                      </Text>
                    </View>
                  ) : null}
                  {flightDetails?.cabin ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Cabin</Text>
                      <Text style={styles.infoValue}>
                        {flightDetails.cabin}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : hasNoFlights ? (
              <View style={styles.emptyInnerState}>
                <Ionicons
                  color={Colors.GRAY}
                  name="alert-circle-outline"
                  size={28}
                />
                <Text style={styles.emptyInnerTitle}>No flights available</Text>
                <Text style={styles.emptyInnerSubtitle}>
                  {flightErrorMessage ||
                    `No flights found to ${destinationLabel} for the selected dates.`}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyInnerState}>
                <ActivityIndicator color={Colors.GREEN} size="small" />
                <Text style={styles.emptyInnerSubtitle}>
                  Loading flight options...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons color={Colors.GREEN} name="bed-outline" size={18} />
                </View>
                <Text style={styles.sectionTitle}>Available Hotels</Text>
              </View>
              {hotelPrice ? (
                <Text style={styles.sectionMeta}>
                  {formatCurrency(hotelPrice)}
                </Text>
              ) : null}
            </View>
            {bestHotel ? (
              <View>
                {hotelDetails?.name ? (
                  <Text style={styles.sectionPrimaryText}>
                    {hotelDetails.name}
                  </Text>
                ) : null}
                {hotelDetails?.address ? (
                  <Text style={styles.sectionSecondaryText}>
                    {hotelDetails.address}
                  </Text>
                ) : null}
                <View style={styles.sectionInfoGrid}>
                  {hotelDetails?.checkIn ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Check-in</Text>
                      <Text style={styles.infoValue}>
                        {hotelDetails.checkIn}
                      </Text>
                    </View>
                  ) : null}
                  {hotelDetails?.checkOut ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Check-out</Text>
                      <Text style={styles.infoValue}>
                        {hotelDetails.checkOut}
                      </Text>
                    </View>
                  ) : null}
                  {hotelDetails?.roomType ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Room</Text>
                      <Text style={styles.infoValue}>
                        {hotelDetails.roomType}
                      </Text>
                    </View>
                  ) : null}
                  {hotelDetails?.rating ? (
                    <View style={styles.infoCell}>
                      <Text style={styles.infoLabel}>Rating</Text>
                      <Text style={styles.infoValue}>
                        {hotelDetails.rating}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            ) : hasNoHotels ? (
              <View style={styles.emptyInnerState}>
                <Ionicons
                  color={Colors.GRAY}
                  name="alert-circle-outline"
                  size={28}
                />
                <Text style={styles.emptyInnerTitle}>No hotels available</Text>
                <Text style={styles.emptyInnerSubtitle}>
                  {hotelErrorMessage ||
                    `No hotels found in ${destinationLabel} for the selected dates.`}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyInnerState}>
                <ActivityIndicator color={Colors.GREEN} size="small" />
                <Text style={styles.emptyInnerSubtitle}>
                  Loading hotel options...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.sectionIcon}>
                  <Ionicons
                    color={Colors.GREEN}
                    name="calendar-outline"
                    size={18}
                  />
                </View>
                <Text style={styles.sectionTitle}>Your Travel Itinerary</Text>
              </View>
              <Text style={styles.sectionMeta}>
                {itineraryDays.length} day
                {itineraryDays.length !== 1 ? "s" : ""}
              </Text>
            </View>
            {itineraryDays.length > 0 ? (
              itineraryDays.map(({ key, number, data }, index) => {
                const activities = extractItineraryActivities(data);
                const dateText =
                  data && typeof data.date === "string" ? data.date : undefined;
                const titleText =
                  data && typeof data.title === "string"
                    ? data.title
                    : undefined;
                const summaryText =
                  data && typeof data.summary === "string"
                    ? data.summary
                    : undefined;

                return (
                  <View
                    key={key || `day-${index}`}
                    style={styles.itineraryBlock}
                  >
                    <View style={styles.itineraryHeaderRow}>
                      <Text style={styles.itineraryDayLabel}>
                        Day {number || index + 1}
                      </Text>
                      {dateText ? (
                        <Text style={styles.itineraryDateText}>{dateText}</Text>
                      ) : null}
                    </View>
                    {titleText ? (
                      <Text style={styles.itineraryTitle}>{titleText}</Text>
                    ) : null}
                    {summaryText ? (
                      <Text style={styles.itinerarySummary}>{summaryText}</Text>
                    ) : null}
                    {activities.length > 0 ? (
                      activities.map((item, activityIndex) => (
                        <Text
                          key={`${key}-activity-${activityIndex}`}
                          style={styles.itineraryActivity}
                        >
                          • {item}
                        </Text>
                      ))
                    ) : (
                      <Text style={styles.itinerarySummary}>
                        No detailed activities available.
                      </Text>
                    )}
                  </View>
                );
              })
            ) : itineraryErrorMessage ? (
              <View style={styles.emptyInnerState}>
                <Ionicons
                  color={Colors.GRAY}
                  name="alert-circle-outline"
                  size={28}
                />
                <Text style={styles.emptyInnerTitle}>
                  Unable to create itinerary
                </Text>
                <Text style={styles.emptyInnerSubtitle}>
                  {itineraryErrorMessage}
                </Text>
              </View>
            ) : (
              <View style={styles.emptyInnerState}>
                <ActivityIndicator color={Colors.GREEN} size="small" />
                <Text style={styles.emptyInnerSubtitle}>
                  Loading itinerary...
                </Text>
              </View>
            )}
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Trip Summary</Text>
            <View style={styles.summaryGrid}>
              {destinationLabel !== "Your destination" ? (
                <View style={styles.summaryGridItem}>
                  <Text style={styles.summaryGridLabel}>Destination</Text>
                  <Text style={styles.summaryGridValue}>
                    {destinationLabel}
                  </Text>
                </View>
              ) : null}
              <View style={styles.summaryGridItem}>
                <Text style={styles.summaryGridLabel}>Duration</Text>
                <Text style={styles.summaryGridValue}>
                  {tripDuration} day{tripDuration !== 1 ? "s" : ""}
                </Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={styles.summaryGridLabel}>Travelers</Text>
                <Text style={styles.summaryGridValue}>{participantsLabel}</Text>
              </View>
              <View style={styles.summaryGridItem}>
                <Text style={styles.summaryGridLabel}>Budget</Text>
                <Text style={styles.summaryGridValue}>{budgetLabel}</Text>
              </View>
            </View>

            {Array.isArray(planData.selectedInterests) &&
            planData.selectedInterests.length > 0 ? (
              <View style={styles.interestSection}>
                <Text style={styles.summaryGridLabel}>Interests</Text>
                <View style={styles.chipRow}>
                  {planData.selectedInterests.map((interest) => {
                    const label = interest?.trim?.() ?? "Unknown";
                    return (
                      <View key={`summary-${interest}`} style={styles.chip}>
                        <Text style={styles.chipText}>
                          {label.charAt(0).toUpperCase() + label.slice(1)}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <View style={styles.costGrid}>
              <View style={styles.costCell}>
                <Text style={styles.costTitle}>
                  {formatCurrency(flightPrice)}
                </Text>
                <Text style={styles.costSubtitle}>Flight Cost</Text>
              </View>
              <View style={styles.costCell}>
                <Text style={styles.costTitle}>
                  {formatCurrency(hotelPrice)}
                </Text>
                <Text style={styles.costSubtitle}>Hotel per night</Text>
              </View>
              <View style={styles.costCell}>
                <Text style={styles.costTitle}>
                  {formatCurrency(estimatedTotal)}
                </Text>
                <Text style={styles.costSubtitle}>Total Estimated</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.85}
            disabled={isSaving}
            onPress={handleSavePlan}
            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          >
            {isSaving ? (
              <ActivityIndicator color={Colors.WHITE} size="small" />
            ) : (
              <>
                <Ionicons color={Colors.WHITE} name="save-outline" size={20} />
                <Text style={styles.saveButtonText}>Save Travel Plan</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 36 }} />
        </ScrollView>
      )}
    </View>
  );
};

export default PlanResult;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F5F9",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
	paddingTop: 12 + statusBarHeight,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerPlaceholder: {
    width: 36,
  },
  loadingState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  emptySubtitle: {
    marginTop: 6,
    textAlign: "center",
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  emptyButton: {
    marginTop: 18,
    backgroundColor: Colors.GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
  contentContainer: {
    paddingHorizontal: 18,
    paddingVertical: 18,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  modifyButton: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  modifyButtonText: {
    marginLeft: 6,
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  summaryStatsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryStatBox: {
    flex: 1,
  },
  summaryStatSpacer: {
    marginRight: 12,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  interestBlock: {
    marginTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
    marginBottom: 8,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  chip: {
    backgroundColor: "#E0F2F1",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  sectionCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: Colors.BLACK,
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E0F2F1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sectionMeta: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GREEN,
  },
  sectionPrimaryText: {
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  sectionSecondaryText: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  sectionInfoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  infoCell: {
    width: "48%",
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
    marginTop: 2,
  },
  emptyInnerState: {
    alignItems: "center",
    justifyContent: "center",
  },
  emptyInnerTitle: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  emptyInnerSubtitle: {
    marginTop: 6,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
  },
  itineraryBlock: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 14,
    marginBottom: 12,
    backgroundColor: "#F8FAFC",
  },
  itineraryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itineraryDayLabel: {
    fontSize: 14,
    fontFamily: "inter-bold",
    color: Colors.GREEN,
  },
  itineraryDateText: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  itineraryTitle: {
    marginTop: 6,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  itinerarySummary: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  itineraryActivity: {
    marginTop: 6,
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.BLACK,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },
  summaryGridItem: {
    width: "48%",
    marginRight: 12,
    marginBottom: 12,
  },
  summaryGridLabel: {
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 4,
  },
  summaryGridValue: {
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  interestSection: {
    marginTop: 8,
  },
  costGrid: {
    flexDirection: "row",
    marginTop: 16,
  },
  costCell: {
    flex: 1,
    alignItems: "center",
  },
  costTitle: {
    fontSize: 18,
    fontFamily: "inter-bold",
    color: Colors.GREEN,
  },
  costSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  costGridSeparator: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginHorizontal: 12,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.GREEN,
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontFamily: "inter-medium",
    color: Colors.WHITE,
  },
});
