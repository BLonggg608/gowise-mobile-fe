import AchievementCard, {
  IconDefinition,
} from "@/components/Achievement/AchievementCard";
import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type AchievementCategory =
  | "all"
  | "travel"
  | "social"
  | "planning"
  | "milestone";

type AchievementDefinition = {
  id: number;
  title: string;
  description: string;
  category: Exclude<AchievementCategory, "all">;
  points: number;
  maxProgress: number;
  icon: IconDefinition;
};

type AchievementItem = AchievementDefinition & {
  isUnlocked: boolean;
  progress: number;
  unlockedDate?: string;
};

const ACHIEVEMENT_TEMPLATES: AchievementDefinition[] = [
  {
    id: 1,
    title: "Plan Đầu Tiên",
    description: "Tạo kế hoạch du lịch đầu tiên của bạn",
    category: "planning",
    points: 100,
    maxProgress: 1,
    icon: { type: "ion", name: "calendar-outline", color: Colors.GREEN },
  },
  {
    id: 2,
    title: "Khoảnh Khắc Đầu Tiên",
    description: "Chia sẻ hình ảnh đầu tiên của bạn",
    category: "social",
    points: 50,
    maxProgress: 1,
    icon: { type: "ion", name: "camera-outline", color: "#2563EB" },
  },
  {
    id: 3,
    title: "Người Bạn Đầu Tiên",
    description: "Kết bạn với người dùng đầu tiên",
    category: "social",
    points: 75,
    maxProgress: 1,
    icon: { type: "emoji", value: "👥" },
  },
];

const statusBarHeight = Constants.statusBarHeight;

const buildApiUrl = (path: string) => {
  const domain = Constants.expoConfig?.extra?.env?.BE_DOMAIN ?? "";
  const port = Constants.expoConfig?.extra?.env?.BE_PORT ?? "";

  if (!domain) {
    console.error("[AchievementScreen] Missing BE_DOMAIN configuration");
    return null;
  }

  const trimmedDomain = domain.endsWith("/") ? domain.slice(0, -1) : domain;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return port
    ? `${trimmedDomain}:${port}${normalizedPath}`
    : `${trimmedDomain}${normalizedPath}`;
};

const AchievementScreen = () => {
  const [achievements, setAchievements] = useState<AchievementItem[]>(
    ACHIEVEMENT_TEMPLATES.map((item) => ({
      ...item,
      isUnlocked: false,
      progress: 0,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<AchievementCategory>("all");

  const loadAchievements = useCallback(
    async (trigger: "initial" | "refresh" = "initial") => {
      if (trigger === "initial") {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      try {
        const token = await getSecureData("accessToken");
        const userId = await getUserIdFromToken();

        if (!token || !userId) {
          console.warn("[AchievementScreen] Missing auth context");
          setAchievements((prev) =>
            prev.map((item) => ({
              ...item,
              isUnlocked: false,
              progress: 0,
              unlockedDate: undefined,
            }))
          );
          return;
        }

        const [hasFirstPlan, hasFirstPhoto, hasFirstFriend] = await Promise.all(
          [
            checkFirstPlan({ token, userId }),
            checkFirstPhoto({ token, userId }),
            checkFirstFriend({ token, userId }),
          ]
        );

        const nowIso = new Date().toISOString();

        setAchievements(
          ACHIEVEMENT_TEMPLATES.map((template) => {
            const base: AchievementItem = {
              ...template,
              isUnlocked: false,
              progress: 0,
              unlockedDate: undefined,
            };

            if (template.id === 1 && hasFirstPlan) {
              return {
                ...base,
                isUnlocked: true,
                progress: 1,
                unlockedDate: nowIso,
              };
            }

            if (template.id === 2 && hasFirstPhoto) {
              return {
                ...base,
                isUnlocked: true,
                progress: 1,
                unlockedDate: nowIso,
              };
            }

            if (template.id === 3 && hasFirstFriend) {
              return {
                ...base,
                isUnlocked: true,
                progress: 1,
                unlockedDate: nowIso,
              };
            }

            return base;
          })
        );
      } catch (error) {
        console.error("[AchievementScreen] Failed to load achievements", error);
      } finally {
        if (trigger === "initial") {
          setIsLoading(false);
        } else {
          setIsRefreshing(false);
        }
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadAchievements("initial");
    }, [loadAchievements])
  );

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter((item) => item.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const totalPoints = useMemo(
    () =>
      achievements
        .filter((item) => item.isUnlocked)
        .reduce((sum, item) => sum + item.points, 0),
    [achievements]
  );

  const rankLabel = useMemo(() => {
    if (totalPoints >= 1000) return "Vàng";
    if (totalPoints >= 500) return "Bạc";
    if (totalPoints >= 100) return "Đồng";
    return "Tân binh";
  }, [totalPoints]);

  const renderAchievement = useCallback(
    ({ item }: { item: AchievementItem }) => {
      return (
        <AchievementCard
          description={item.description}
          icon={item.icon}
          isUnlocked={item.isUnlocked}
          maxProgress={item.maxProgress}
          points={item.points}
          progress={item.progress}
          title={item.title}
          unlockedDate={item.unlockedDate}
        />
      );
    },
    []
  );

  const listHeader = useMemo(() => {
    const categories: {
      id: AchievementCategory;
      label: string;
      icon?: IconDefinition;
    }[] = [
      { id: "all", label: "Tất cả" },
      {
        id: "travel",
        label: "Du lịch",
        icon: { type: "ion", name: "airplane-outline", color: Colors.GREEN },
      },
      {
        id: "social",
        label: "Xã hội",
        icon: { type: "ion", name: "chatbubbles-outline", color: "#2563EB" },
      },
      {
        id: "planning",
        label: "Lập kế hoạch",
        icon: { type: "ion", name: "clipboard-outline", color: Colors.GREEN },
      },
      {
        id: "milestone",
        label: "Cột mốc",
        icon: { type: "ion", name: "flag-outline", color: "#F59E0B" },
      },
    ];

    return (
      <View style={styles.listHeader}>
        <Text style={styles.headerSubtitle}>
          Khám phá và mở khóa các thành tựu trong hành trình của bạn 🏆
        </Text>

        <View style={styles.statRow}>
          <View style={[styles.statCard, styles.statCardLeft]}>
            <View>
              <Text style={styles.statLabel}>Tổng điểm</Text>
              <Text style={styles.statValue}>{totalPoints}</Text>
            </View>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(250, 204, 21, 0.18)" },
              ]}
            >
              <Ionicons color="#CA8A04" name="trophy-outline" size={20} />
            </View>
          </View>
          <View style={styles.statCard}>
            <View>
              <Text style={styles.statLabel}>Hạng</Text>
              <Text style={[styles.statValue, styles.rankText]}>
                {rankLabel}
              </Text>
            </View>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: "rgba(37, 99, 235, 0.18)" },
              ]}
            >
              <Ionicons color="#2563EB" name="ribbon-outline" size={20} />
            </View>
          </View>
        </View>

        <View style={styles.filterContainer}>
          {categories.map((category) => {
            const isActive = selectedCategory === category.id;
            return (
              <TouchableOpacity
                key={category.id}
                activeOpacity={0.85}
                onPress={() => setSelectedCategory(category.id)}
                style={[
                  styles.filterButton,
                  isActive && styles.filterButtonActive,
                ]}
              >
                {category.icon ? (
                  category.icon.type === "emoji" ? (
                    <Text
                      style={[
                        styles.filterIconText,
                        isActive && styles.filterIconTextActive,
                      ]}
                    >
                      {category.icon.value}
                    </Text>
                  ) : (
                    <Ionicons
                      color={isActive ? Colors.WHITE : category.icon.color}
                      name={category.icon.name}
                      size={16}
                      style={styles.filterIcon}
                    />
                  )
                ) : null}
                <Text
                  style={[
                    styles.filterLabel,
                    isActive && styles.filterLabelActive,
                  ]}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  }, [rankLabel, selectedCategory, setSelectedCategory, totalPoints]);

  const listEmptyComponent = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.emptyState}>
          <ActivityIndicator color={Colors.GREEN} size="large" />
          <Text style={styles.emptyLoadingText}>Đang tải thành tựu...</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyState}>
        <View style={styles.emptyIconWrapper}>
          <Ionicons color={Colors.GRAY} name="sparkles-outline" size={44} />
        </View>
        <Text style={styles.emptyTitle}>Chưa có thành tựu</Text>
        <Text style={styles.emptyDescription}>Hãy thử chọn danh mục khác.</Text>
      </View>
    );
  }, [isLoading]);

  return (
    <View style={styles.screen}>
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.headerTitle}>Thành tựu</Text>
        </View>
      </View>

      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredAchievements}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={listHeader}
        refreshControl={
          <RefreshControl
            colors={[Colors.GREEN]}
            refreshing={isRefreshing}
            tintColor={Colors.GREEN}
            onRefresh={() => loadAchievements("refresh")}
          />
        }
        renderItem={renderAchievement}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default AchievementScreen;

type CheckParams = {
  token: string;
  userId: string;
};

const checkFirstPlan = async ({ token, userId }: CheckParams) => {
  try {
    const endpoint = buildApiUrl(`/plans/${userId}`);
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const plans = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.plans)
      ? payload.plans
      : [];

    return Array.isArray(plans) && plans.length > 0;
  } catch (error) {
    console.error("[AchievementScreen] checkFirstPlan error", error);
    return false;
  }
};

const checkFirstPhoto = async ({ token, userId }: CheckParams) => {
  try {
    const endpoint = buildApiUrl(`/api/gallery/user/${userId}/galleries`);
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const galleries = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.galleries)
      ? payload.galleries
      : [];

    return Array.isArray(galleries) && galleries.length > 0;
  } catch (error) {
    console.error("[AchievementScreen] checkFirstPhoto error", error);
    return false;
  }
};

const checkFirstFriend = async (_params: CheckParams) => {
  return false;
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    // backgroundColor: "#F8FAFC",
  },
  listContent: {
    paddingBottom: 28,
  },
  listHeader: {
    paddingBottom: 20,
    paddingHorizontal: 18,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: statusBarHeight + 10,
    paddingBottom: 16,
    paddingHorizontal: 18,
    backgroundColor: Colors.WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "inter-medium",
    color: Colors.BLACK,
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginVertical: 18,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    marginLeft: 12,
  },
  statCardLeft: {
    marginLeft: 0,
    marginRight: 12,
  },
  statLabel: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
  },
  rankText: {
    color: "#2563EB",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: Colors.WHITE,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 10,
  },
  filterButtonActive: {
    backgroundColor: Colors.GREEN,
  },
  filterLabel: {
    fontSize: 13,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  filterLabelActive: {
    color: Colors.WHITE,
  },
  filterIcon: {
    marginRight: 8,
  },
  filterIconText: {
    fontSize: 16,
    marginRight: 8,
    color: Colors.GREEN,
  },
  filterIconTextActive: {
    color: Colors.WHITE,
  },
  emptyState: {
    marginTop: 60,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 36,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "inter-bold",
    color: Colors.BLACK,
    marginBottom: 6,
  },
  emptyDescription: {
    fontSize: 13,
    fontFamily: "inter-regular",
    color: Colors.GRAY,
  },
  emptyLoadingText: {
    marginTop: 14,
    fontSize: 14,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
});
