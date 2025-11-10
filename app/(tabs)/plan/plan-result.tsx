import { Colors } from "@/constant/Colors";
import FlightTicketCard from "@/components/Plan/PlanResult/FlightTicketCard";
import HotelTicketCard from "@/components/Plan/PlanResult/HotelTicketCard";
import ItineraryCard, {
  ItineraryActivity,
  ItineraryEntry,
} from "@/components/Plan/PlanResult/ItineraryCard";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
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
import CreateNewPlanModel from "@/components/Plan/CreateNewPlan/CreateNewPlanModal";

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

const pickNumber = (
  source: Record<string, unknown>,
  paths: (string | number)[][]
): number | undefined => {
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

    if (matched) {
      const value = current;
      if (typeof value === "number" && !Number.isNaN(value)) {
        return value;
      }
      if (typeof value === "string") {
        const parsed = Number(value.replace(/[^0-9.-]/g, ""));
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
  }
  return undefined;
};

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) =>
        typeof item === "string"
          ? item.trim()
          : typeof item === "number"
          ? String(item)
          : item && typeof item === "object"
          ? pickString(item as Record<string, unknown>, [
              ["name"],
              ["title"],
              ["label"],
              ["text"],
            ])?.trim()
          : undefined
      )
      .filter((item): item is string => Boolean(item && item.length > 0));
  }
  if (typeof value === "string" && value.trim()) {
    return value
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
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

const timeSlotPriority: Record<string, number> = {
  morning: 0,
  breakfast: 1,
  brunch: 2,
  lunch: 3,
  afternoon: 4,
  evening: 5,
  dinner: 6,
  night: 7,
};

const timeSlotAlias: Record<string, string> = {
  am: "morning",
  pm: "evening",
  noon: "lunch",
  midday: "lunch",
  supper: "dinner",
  midnight: "night",
  overnight: "night",
  "early morning": "morning",
  "late afternoon": "afternoon",
  "late evening": "evening",
  "late night": "night",
  "early evening": "evening",
};

const normalizeTimeSlot = (value?: string | null) => {
  if (!value) return undefined;
  const normalized = value.toLowerCase().trim();
  return timeSlotAlias[normalized] ?? normalized;
};

const formatDurationFromMinutes = (minutes?: number | null) => {
  if (typeof minutes !== "number" || Number.isNaN(minutes) || minutes <= 0) {
    return undefined;
  }
  const rounded = Math.round(minutes);
  const hours = Math.floor(rounded / 60);
  const mins = rounded % 60;
  const parts: string[] = [];
  if (hours > 0) {
    parts.push(`${hours} hr${hours === 1 ? "" : "s"}`);
  }
  if (mins > 0) {
    parts.push(`${mins} min${mins === 1 ? "" : "s"}`);
  }
  return parts.join(" ") || undefined;
};

const extractItineraryActivities = (
  dayKey: string,
  data: Record<string, unknown> | null
) => {
  if (!data) return [] as ItineraryActivity[];

  const collected: {
    payload: Omit<ItineraryActivity, "id">;
    priority: number;
    index: number;
  }[] = [];

  const pushActivity = (
    payload: Omit<ItineraryActivity, "id">,
    priority: number
  ) => {
    collected.push({ payload, priority, index: collected.length });
  };

  const buildAdditionalDetails = (record: Record<string, unknown>) => {
    const extras: string[] = [];
    const ignoredKeys = new Set([
      "activity",
      "activities",
      "title",
      "summary",
      "description",
      "details",
      "detail",
      "time",
      "timeorder",
      "time_order",
      "time_of_day",
      "slot",
      "period",
      "start_time",
      "end_time",
      "end",
      "time_range",
      "hour",
      "hours",
      "duration",
      "duration_text",
      "duration_minutes",
      "duration_mins",
      "duration_in_minutes",
      "location",
      "place",
      "venue",
      "address",
      "address_text",
      "full_address",
      "category",
      "type",
      "classification",
      "tag",
      "interest",
      "cost",
      "price",
      "price_text",
      "price_value",
      "budget",
      "estimated_cost",
      "estimated_cost_value",
      "rating",
      "rating_value",
      "rating_text",
      "rating_count",
      "review_count",
      "reviews",
      "notes",
      "tips",
      "contact",
      "contact_info",
      "phone",
      "phone_number",
      "website",
      "link",
      "booking_link",
      "url",
      "reservation_url",
      "transportation",
      "getting_there",
      "transit",
      "how_to_get_there",
      "coordinates",
      "latitude",
      "longitude",
      "lat",
      "lon",
      "geo",
      "images",
      "image",
      "image_url",
      "photo",
      "media",
    ]);

    Object.entries(record).forEach(([key, value]) => {
      const normalizedKey = key.toLowerCase();
      if (ignoredKeys.has(normalizedKey)) {
        return;
      }
      if (value === null || value === undefined) {
        return;
      }
      const flattened = flattenValue(value);
      if (!flattened) {
        return;
      }
      extras.push(`${capitalizeKey(key)}: ${flattened}`);
    });

    return Array.from(new Set(extras));
  };

  const parseRecord = (
    record: Record<string, unknown>,
    fallbackSlot?: string
  ) => {
    const slotRaw =
      pickString(record, [
        ["timeOrder"],
        ["time_order"],
        ["time_of_day"],
        ["slot"],
        ["period"],
      ]) ?? fallbackSlot;
    const normalizedSlot = normalizeTimeSlot(slotRaw);
    const fallbackNormalized = normalizeTimeSlot(fallbackSlot);
    const resolvedSlot =
      normalizedSlot ?? fallbackNormalized ?? fallbackSlot?.toLowerCase();
    const slotPriority =
      resolvedSlot && resolvedSlot in timeSlotPriority
        ? timeSlotPriority[resolvedSlot]
        : Number.MAX_SAFE_INTEGER;
    const displaySlot = slotRaw
      ? capitalizeKey(slotRaw)
      : fallbackSlot
      ? capitalizeKey(fallbackSlot)
      : undefined;

    const timeText = pickString(record, [
      ["time"],
      ["start_time"],
      ["start"],
      ["hour"],
      ["start_at"],
    ])?.trim();
    const endTime = pickString(record, [
      ["end_time"],
      ["end"],
      ["finish"],
    ])?.trim();
    let timeRange = pickString(record, [
      ["time_range"],
      ["schedule"],
      ["hours"],
      ["timeframe"],
    ])?.trim();
    if (!timeRange && timeText && endTime) {
      timeRange = `${timeText} - ${endTime}`;
    }

    const durationMinutes = pickNumber(record, [
      ["duration_minutes"],
      ["duration_mins"],
      ["duration_in_minutes"],
    ]);
    const durationText =
      formatDurationFromMinutes(durationMinutes) ??
      pickString(record, [["duration_text"], ["duration"], ["length"]])?.trim();

    const titleCandidate =
      pickString(record, [
        ["activity"],
        ["title"],
        ["name"],
        ["highlight"],
        ["experience"],
      ])?.trim() ||
      pickString(record, [["place"], ["location"], ["venue"]])?.trim();

    let description = pickString(record, [
      ["description"],
      ["details"],
      ["detail"],
      ["summary"],
      ["overview"],
    ])?.trim();

    const location = pickString(record, [
      ["location"],
      ["place"],
      ["venue"],
      ["where"],
      ["address_short"],
    ])?.trim();
    const address = pickString(record, [
      ["address"],
      ["full_address"],
      ["address_text"],
      ["address_line"],
    ])?.trim();
    const category = pickString(record, [
      ["category"],
      ["type"],
      ["classification"],
      ["tag"],
      ["interest"],
    ])?.trim();

    const ratingValue = pickNumber(record, [
      ["rating"],
      ["rating_value"],
      ["score"],
      ["stars"],
    ]);
    const ratingText = pickString(record, [
      ["rating_text"],
      ["rating_label"],
    ])?.trim();
    const ratingCount = pickNumber(record, [
      ["rating_count"],
      ["review_count"],
      ["reviews"],
      ["number_of_reviews"],
    ]);

    const costTextCandidate = pickString(record, [
      ["cost"],
      ["price"],
      ["price_text"],
      ["budget"],
      ["estimated_cost"],
    ])?.trim();
    const costNumber =
      pickNumber(record, [
        ["price_value"],
        ["cost_value"],
        ["estimated_cost_value"],
      ]) ?? (costTextCandidate ? parseCurrency(costTextCandidate) : undefined);
    const cost =
      costNumber && costNumber > 0
        ? formatCurrency(costNumber)
        : costTextCandidate || undefined;

    const notes = pickString(record, [
      ["notes"],
      ["tips"],
      ["additional_info"],
    ])?.trim();
    const contact = pickString(record, [
      ["contact"],
      ["contact_info"],
      ["phone"],
      ["phone_number"],
      ["hotline"],
    ])?.trim();
    const bookingLink = pickString(record, [
      ["booking_link"],
      ["website"],
      ["link"],
      ["url"],
      ["reservation_url"],
    ])?.trim();
    const transportation = pickString(record, [
      ["transportation"],
      ["getting_there"],
      ["transit"],
      ["how_to_get_there"],
    ])?.trim();

    if (titleCandidate && description) {
      const normalizedTitle = titleCandidate.toLowerCase();
      if (description.toLowerCase() === normalizedTitle) {
        description = undefined;
      }
    }

    const payload: Omit<ItineraryActivity, "id"> = {
      title:
        titleCandidate ||
        description ||
        (location ? capitalizeKey(location) : undefined) ||
        (fallbackSlot
          ? `${capitalizeKey(fallbackSlot)} Activity`
          : undefined) ||
        "Activity",
      description,
      timeOfDay: displaySlot,
      time: timeText,
      endTime,
      timeRange,
      durationText,
      location,
      address,
      category,
      cost,
      ratingText,
      ratingValue: ratingValue ?? undefined,
      ratingCount: ratingCount ?? undefined,
      notes,
      contact,
      bookingLink,
      transportation,
    };

    const extras = buildAdditionalDetails(record);
    if (extras.length > 0) {
      const deduped = extras.filter(Boolean);
      if (deduped.length > 0) {
        const blockers = [
          payload.description,
          payload.notes,
          payload.contact,
          payload.cost,
          payload.transportation,
          payload.location,
          payload.address,
          payload.category,
        ]
          .filter(Boolean)
          .map((item) => String(item).toLowerCase());
        const seen = new Set<string>();
        const filtered = deduped.filter((detail) => {
          const normalized = detail.toLowerCase();
          if (seen.has(normalized)) {
            return false;
          }
          seen.add(normalized);
          return !blockers.some((block) => normalized.includes(block));
        });
        if (filtered.length > 0) {
          payload.additionalDetails = filtered;
        }
      }
    }

    if (
      payload.description &&
      payload.title &&
      payload.description.toLowerCase() === payload.title.toLowerCase()
    ) {
      payload.description = undefined;
    }

    return { payload, priority: slotPriority };
  };

  const handleValue = (value: unknown, fallbackSlot?: string) => {
    if (Array.isArray(value)) {
      value.forEach((item) => handleValue(item, fallbackSlot));
      return;
    }

    if (value && typeof value === "object") {
      const parsed = parseRecord(
        value as Record<string, unknown>,
        fallbackSlot
      );
      if (parsed) {
        pushActivity(parsed.payload, parsed.priority);
      }
      return;
    }

    if (typeof value === "string" || typeof value === "number") {
      const title = String(value).trim();
      if (!title) {
        return;
      }
      const normalizedSlot = normalizeTimeSlot(fallbackSlot);
      const slotPriority =
        normalizedSlot && normalizedSlot in timeSlotPriority
          ? timeSlotPriority[normalizedSlot]
          : Number.MAX_SAFE_INTEGER;
      pushActivity(
        {
          title,
          timeOfDay: fallbackSlot ? capitalizeKey(fallbackSlot) : undefined,
        },
        slotPriority
      );
    }
  };

  const direct = data.activities;
  if (Array.isArray(direct)) {
    direct.forEach((item) => handleValue(item));
  }

  const blocks = [
    "morning",
    "breakfast",
    "brunch",
    "lunch",
    "afternoon",
    "evening",
    "dinner",
    "night",
  ];
  blocks.forEach((key) => {
    if (key in data) {
      handleValue(data[key], key);
    }
  });

  Object.entries(data).forEach(([key, value]) => {
    if (
      ["title", "summary", "day", "date", "activities", ...blocks].includes(key)
    ) {
      return;
    }
    const text = flattenValue(value);
    if (!text) {
      return;
    }
    pushActivity(
      {
        title: capitalizeKey(key),
        description: text,
      },
      Number.MAX_SAFE_INTEGER
    );
  });

  return collected
    .sort((a, b) => {
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      return a.index - b.index;
    })
    .map((item, index) => ({
      id: `${dayKey}-activity-${index}`,
      ...item.payload,
    }));
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
  const [isCreatePlanModalVisible, setIsCreatePlanModalVisible] =
    useState(false);

  const { from } = useLocalSearchParams();
  const isShowSaveButton = from === "create-new-plan";

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

  const itineraryEntries = useMemo<ItineraryEntry[]>(() => {
    if (!itineraryDays.length) return [];
    return itineraryDays.map(({ key, number, data }, index) => {
      const record = data ?? undefined;
      const dateText =
        record && typeof record.date === "string" ? record.date : undefined;
      const titleText =
        record && typeof record.title === "string" ? record.title : undefined;
      const summaryText =
        record && typeof record.summary === "string"
          ? record.summary
          : undefined;
      return {
        id: key || `day-${index}`,
        dayNumber: number || index + 1,
        date: dateText,
        title: titleText,
        summary: summaryText,
        activities: extractItineraryActivities(key || `day-${index}`, data),
      };
    });
  }, [itineraryDays]);

  const isItineraryLoading =
    itineraryEntries.length === 0 && !itineraryErrorMessage;

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
      ["airline_info", "departure_airport", "name"],
      ["airline_info", "departure_airport", "id"],
    ]);
    const arrivalCity = pickString(details, [
      ["arrival_city"],
      ["arrival_airport"],
      ["to"],
      ["destination"],
      ["airline_info", "arrival_airport", "name"],
      ["airline_info", "arrival_airport", "id"],
    ]);
    const departureCode = pickString(details, [
      ["departure_airport_code"],
      ["departure_code"],
      ["from_code"],
      ["airline_info", "departure_airport", "id"],
    ]);
    const arrivalCode = pickString(details, [
      ["arrival_airport_code"],
      ["arrival_code"],
      ["to_code"],
      ["airline_info", "arrival_airport", "id"],
    ]);
    const departureName = pickString(details, [
      ["departure_airport_name"],
      ["departure_airport"],
      ["from_airport"],
      ["airline_info", "departure_airport", "name"],
    ]);
    const arrivalName = pickString(details, [
      ["arrival_airport_name"],
      ["arrival_airport"],
      ["to_airport"],
      ["airline_info", "arrival_airport", "name"],
    ]);
    const priceText = pickString(details, [
      ["price"],
      ["display_price"],
      ["formatted_price"],
    ]);
    const tripType = pickString(details, [
      ["type"],
      ["trip_type"],
      ["fare_type"],
    ]);
    const airplane = pickString(details, [
      ["airplane"],
      ["aircraft"],
      ["plane"],
      ["airline_info", "airplane"],
    ]);
    const airlineLogo = pickString(details, [
      ["airline_logo"],
      ["logo"],
      ["carrier_logo"],
      ["airline_info", "logo"],
    ]);
    const durationMinutes = pickNumber(details, [
      ["duration_minutes"],
      ["duration_mins"],
      ["duration_in_minutes"],
      ["total_duration_minutes"],
    ]);
    const carbonPercent = pickNumber(details, [
      ["carbon_emissions", "difference_percent"],
      ["emissions_difference_percent"],
    ]);
    const carbonKg = pickNumber(details, [
      ["carbon_emissions", "this_flight"],
      ["emissions_kg"],
    ]);
    const legroom = pickString(details, [
      ["legroom"],
      ["seat_pitch"],
      ["leg_room"],
    ]);
    const entertainment = pickString(details, [
      ["entertainment"],
      ["inflight_entertainment"],
      ["amenities", "entertainment"],
    ]);
    return {
      airline: pickString(details, [
        ["airline"],
        ["carrier"],
        ["carrier_name"],
        ["marketing_carrier"],
        ["airline_info", "airline"],
      ]),
      flightNumber: pickString(details, [
        ["flight_number"],
        ["number"],
        ["marketing_carrier_flight_number"],
        ["airline_info", "flight_number"],
      ]),
      route:
        departureCity && arrivalCity
          ? `${departureCity} → ${arrivalCity}`
          : pickString(details, [["route"], ["travel_route"]]),
      priceText,
      departureTime: pickString(details, [
        ["departure_time"],
        ["outbound", "departure_time"],
        ["departure", "time"],
        ["departure"],
        ["airline_info", "departure_airport", "time"],
      ]),
      arrivalTime: pickString(details, [
        ["arrival_time"],
        ["outbound", "arrival_time"],
        ["arrival", "time"],
        ["arrival"],
        ["airline_info", "arrival_airport", "time"],
      ]),
      duration: pickString(details, [
        ["duration"],
        ["flight_duration"],
        ["travel_time"],
      ]),
      cabin: pickString(details, [
        ["cabin"],
        ["travel_class"],
        ["class"],
        ["fare_class"],
        ["type"],
        ["airline_info", "cabin"],
      ]),
      tripType,
      airplane,
      airlineLogo,
      departureAirportCode: departureCode,
      departureAirportName: departureName,
      arrivalAirportCode: arrivalCode,
      arrivalAirportName: arrivalName,
      durationMinutes: durationMinutes ?? undefined,
      carbonDifferencePercent: carbonPercent ?? undefined,
      carbonKg:
        typeof carbonKg === "number"
          ? Math.round(carbonKg > 999 ? carbonKg / 1000 : carbonKg)
          : undefined,
      legroom,
      entertainment,
    };
  }, [bestFlight]);

  const hotelDetails = useMemo(() => {
    if (!bestHotel) return null;
    const details = bestHotel as Record<string, unknown>;
    const priceValue =
      pickNumber(details, [
        ["price_value"],
        ["price_per_night_value"],
        ["price_numeric"],
      ]) ?? parseCurrency(details.price);
    const priceText =
      pickString(details, [
        ["price"],
        ["display_price"],
        ["price_text"],
        ["formatted_price"],
        ["rate"],
      ]) || (priceValue ? formatCurrency(priceValue) : undefined);
    const currency = pickString(details, [["currency"], ["price_currency"]]);
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
    const ratingValue =
      pickNumber(details, [["rating"], ["review_score"], ["score"]]) ??
      (rating ? Number(rating) : undefined);
    const ratingCount = pickNumber(details, [
      ["rating_count"],
      ["reviews_count"],
      ["review_count"],
      ["number_of_reviews"],
    ]);
    const type = pickString(details, [
      ["type"],
      ["property_type"],
      ["hotel_type"],
    ]);
    const neighborhood = pickString(details, [
      ["neighborhood"],
      ["area"],
      ["district"],
    ]);
    const distance = pickString(details, [
      ["distance"],
      ["distance_from_center"],
      ["distance_text"],
    ]);
    const hotelClass = pickString(details, [
      ["hotel_class"],
      ["class"],
      ["star_rating"],
      ["category"],
    ]);
    const roomType = pickString(details, [["room_type"], ["room"], ["type"]]);
    const amenitiesCandidate = (() => {
      const candidates = [
        details.amenities,
        pickString(details, [["amenities_text"], ["amenity_summary"]]),
        (details as Record<string, unknown>).amenity_list,
        (details as Record<string, unknown>).facilities,
      ];
      for (const candidate of candidates) {
        const normalized = toStringArray(candidate);
        if (normalized.length > 0) return normalized;
      }
      return [];
    })();
    const mainImageRecord = (() => {
      const candidates = [
        details.main_image,
        details.mainImage,
        details.image,
        pickString(details, [
          ["main_image_url"],
          ["image_url"],
          ["hero_image"],
        ]),
      ];
      for (const candidate of candidates) {
        if (typeof candidate === "string" && candidate) {
          return { original: candidate, thumbnail: candidate };
        }
        if (candidate && typeof candidate === "object") {
          const record = candidate as Record<string, unknown>;
          const original = pickString(record, [
            ["original_image"],
            ["url"],
            ["image"],
            ["src"],
          ]);
          const thumbnail = pickString(record, [
            ["thumbnail"],
            ["thumb"],
            ["preview"],
            ["small"],
          ]);
          if (original || thumbnail) {
            return {
              original: original ?? thumbnail ?? undefined,
              thumbnail: thumbnail ?? original ?? undefined,
            };
          }
        }
      }
      return undefined;
    })();
    const imageList = (() => {
      const buckets = [
        details.images,
        details.photos,
        (details as Record<string, unknown>).gallery,
        (details as Record<string, unknown>).media,
      ];
      const collected: { original?: string; thumbnail?: string }[] = [];
      buckets.forEach((bucket) => {
        if (Array.isArray(bucket)) {
          bucket.forEach((item) => {
            if (typeof item === "string" && item) {
              collected.push({ original: item, thumbnail: item });
              return;
            }
            if (item && typeof item === "object") {
              const record = item as Record<string, unknown>;
              const original = pickString(record, [
                ["original_image"],
                ["url"],
                ["image"],
                ["src"],
              ]);
              const thumbnail = pickString(record, [
                ["thumbnail"],
                ["thumb"],
                ["preview"],
                ["small"],
              ]);
              if (original || thumbnail) {
                collected.push({
                  original: original ?? thumbnail ?? undefined,
                  thumbnail: thumbnail ?? original ?? undefined,
                });
              }
            }
          });
        }
      });
      return collected;
    })();
    const bookingLink = pickString(details, [
      ["link"],
      ["booking_link"],
      ["deep_link"],
      ["url"],
    ]);
    return {
      name: pickString(details, [["name"], ["hotel_name"], ["title"]]),
      address: pickString(details, [
        ["address"],
        ["full_address"],
        ["location"],
      ]),
      rating,
      ratingValue,
      ratingCount,
      type,
      neighborhood,
      distance,
      hotelClass,
      checkIn: pickString(details, [
        ["check_in"],
        ["check_in_date"],
        ["check_in_time"],
      ]),
      checkOut: pickString(details, [
        ["check_out"],
        ["check_out_date"],
        ["check_out_time"],
      ]),
      roomType,
      priceText,
      priceValue,
      currency,
      amenities: amenitiesCandidate,
      mainImage: mainImageRecord,
      images: imageList,
      link: bookingLink,
      description: pickString(details, [
        ["description"],
        ["summary"],
        ["about"],
        ["highlights"],
      ]),
    };
  }, [bestHotel]);

  const isFlightsLoading = !bestFlight && !hasNoFlights;
  const isHotelsLoading = !bestHotel && !hasNoHotels;

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
    setIsCreatePlanModalVisible(true);
  }, []);

  const handleSubmitCreateNewPlan = useCallback(
    (_data: {
      type: string;
      startDate: string;
      endDate: string;
      NumberOfDays: string;
      NumberOfParticipants: string;
      Budget: string;
      Destination: string;
    }) => {
      setIsCreatePlanModalVisible(false);
      loadTravelPlan();
    },
    [loadTravelPlan]
  );

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
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleGoBack}
            style={styles.headerButton}
          >
            <Ionicons color={Colors.BLACK} name="arrow-back" size={22} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Plan Result</Text>
        </View>
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
          {isShowSaveButton && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleModifySearch}
              style={styles.modifyButton}
            >
              <Ionicons color={Colors.GREEN} name="create-outline" size={16} />
              <Text style={styles.modifyButtonText}>Modify Search</Text>
            </TouchableOpacity>
          )}

          {/* Summary Card */}
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
                </Text>
                <Text style={styles.summarySubtitle}>
                  {participantsLabel}
                  {" • Budget: "}
                  {budgetLabel}
                </Text>
              </View>
            </View>

            <View style={styles.summaryStatsRow}>
              <View>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>
                  {tripDuration} day{tripDuration !== 1 ? "s" : ""}
                </Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Travel Type</Text>
                <Text style={styles.statValue}>
                  {planData?.travelType === "international"
                    ? "International"
                    : "Domestic"}
                </Text>
              </View>
              <View>
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

          {/* Flight Ticket Card */}
          <FlightTicketCard
            destinationLabel={destinationLabel}
            errorMessage={flightErrorMessage}
            flightDetails={flightDetails}
            flightPrice={flightPrice}
            hasNoFlights={hasNoFlights}
            isLoading={isFlightsLoading}
          />

          {/* Hotel Ticket Card */}
          <HotelTicketCard
            destinationLabel={destinationLabel}
            errorMessage={hotelErrorMessage}
            hasNoHotels={hasNoHotels}
            hotelDetails={hotelDetails}
            hotelPrice={hotelPrice}
            isLoading={isHotelsLoading}
          />

          <ItineraryCard
            containerStyle={styles.sectionCard}
            daysCount={itineraryDays.length}
            errorMessage={itineraryErrorMessage}
            isLoading={isItineraryLoading}
            items={itineraryEntries}
          />

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

            {/* {Array.isArray(planData.selectedInterests) &&
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
            ) : null} */}

            <View
              style={{ width: "100%", height: 2, backgroundColor: "#E2E8F0" }}
            ></View>

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

          {isShowSaveButton && (
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
                  <Ionicons
                    color={Colors.WHITE}
                    name="save-outline"
                    size={20}
                  />
                  <Text style={styles.saveButtonText}>Save Travel Plan</Text>
                </>
              )}
            </TouchableOpacity>
          )}

          <View style={{ height: 36 }} />
        </ScrollView>
      )}
      <CreateNewPlanModel
        onClose={() => setIsCreatePlanModalVisible(false)}
        onSubmit={handleSubmitCreateNewPlan}
        visible={isCreatePlanModalVisible}
      />
    </View>
  );
};

export default PlanResult;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 12 + statusBarHeight,
    paddingBottom: 16,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#9c9c9c1e",
  },
  headerTitle: {
    marginLeft: 12,
    fontSize: 18,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E0F2F1",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 12,
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
    flexWrap: "wrap",
    gap: 12,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: "inter-medium",
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
    textAlign: "center",
  },
  costSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    textAlign: "center",
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
