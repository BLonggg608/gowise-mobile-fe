import AchievementCard, {
  IconDefinition,
} from "@/components/Achievement/AchievementCard";
import { Colors } from "@/constant/Colors";
import { getSecureData } from "@/utils/storage";
import { getUserIdFromToken } from "@/utils/tokenUtils";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
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
  {
    id: 4,
    title: "Blog Đầu Tiên",
    description: "Viết và đăng bài blog đầu tiên của bạn",
    category: "social",
    points: 80,
    maxProgress: 1,
    icon: { type: "ion", name: "create-outline", color: "#F97316" },
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
  const flatListRef = useRef<FlatList>(null);
  const params = useLocalSearchParams<{ scrollToTop?: string }>();
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

        const [hasFirstPlan, hasFirstPhoto, hasFirstFriend, hasFirstBlog] =
          await Promise.all([
            checkFirstPlan({ token, userId }),
            checkFirstPhoto({ token, userId }),
            checkFirstFriend({ token, userId }),
            checkFirstBlog({ token, userId }),
          ]);

        const nowIso = new Date().toISOString();

        setAchievements(
          ACHIEVEMENT_TEMPLATES.map((template) => {
            const base: AchievementItem = {
              ...template,
              isUnlocked: false,
              progress: 0,
              unlockedDate: undefined,
            };

            const unlockStates: Record<number, boolean> = {
              1: hasFirstPlan,
              2: hasFirstPhoto,
              3: hasFirstFriend,
              4: hasFirstBlog,
            };

            if (unlockStates[template.id]) {
              return {
                ...base,
                isUnlocked: true,
                progress: template.maxProgress,
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

  useEffect(() => {
    if (params.scrollToTop) {
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
  }, [params.scrollToTop]);

  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    return achievements.filter((item) => item.category === selectedCategory);
  }, [achievements, selectedCategory]);

  const unlockedCount = useMemo(
    () => achievements.filter((item) => item.isUnlocked).length,
    [achievements]
  );

  const totalPoints = useMemo(
    () =>
      achievements
        .filter((item) => item.isUnlocked)
        .reduce((sum, item) => sum + item.points, 0),
    [achievements]
  );

  const rankInfo = useMemo(() => {
    if (unlockedCount <= 1) {
      return {
        label: "Sắt",
        textColor: "#4B5563",
        badgeBackground: "rgba(148, 163, 184, 0.18)",
        iconColor: "#4B5563",
      };
    }

    if (unlockedCount === 2) {
      return {
        label: "Đồng",
        textColor: "#D08D4C",
        badgeBackground: "rgba(208, 141, 76, 0.18)",
        iconColor: "#D08D4C",
      };
    }

    if (unlockedCount === 3) {
      return {
        label: "Bạc",
        textColor: "#9CA3AF",
        badgeBackground: "rgba(156, 163, 175, 0.18)",
        iconColor: "#9CA3AF",
      };
    }

    return {
      label: "Vàng",
      textColor: "#CA8A04",
      badgeBackground: "rgba(202, 138, 4, 0.18)",
      iconColor: "#CA8A04",
    };
  }, [unlockedCount]);

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
          <View style={styles.statCard}>
            <View style={[styles.statIcon, styles.statIconHighlight]}>
              <Ionicons color="#CA8A04" name="trophy-outline" size={20} />
            </View>
            <View>
              <Text style={styles.statLabel}>Tổng điểm</Text>
              <Text style={styles.statValue}>{totalPoints}</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View
              style={[
                styles.statIcon,
                { backgroundColor: rankInfo.badgeBackground },
              ]}
            >
              <Ionicons
                color={rankInfo.iconColor}
                name="ribbon-outline"
                size={20}
              />
            </View>
            <View>
              <Text style={styles.statLabel}>Hạng</Text>
              <Text style={[styles.rankValue, { color: rankInfo.textColor }]}>
                {rankInfo.label}
              </Text>
              <Text style={styles.rankSubtitle}>
                {unlockedCount}/{ACHIEVEMENT_TEMPLATES.length} thành tựu
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.filterCard}>
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
      </View>
    );
  }, [rankInfo, selectedCategory, totalPoints, unlockedCount]);

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
        ref={flatListRef}
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

const checkFirstFriend = async ({ token, userId }: CheckParams) => {
  try {
    const endpoint = buildApiUrl(`/users/friends/accepted`);
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const friends = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.friends)
      ? payload.friends
      : [];

    return friends.length > 0;
  } catch (error) {
    console.error("[AchievementScreen] checkFirstFriend error", error);
    return false;
  }
};

const checkFirstBlog = async ({ token, userId }: CheckParams) => {
  try {
    const endpoint = buildApiUrl(`/api/posts/me?page=0&size=1`);
    if (!endpoint) return false;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-User-Id": userId,
      },
    });

    if (!response.ok) {
      return false;
    }

    const payload = await response.json();
    const items = Array.isArray(payload?.data?.items)
      ? payload.data.items
      : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.data)
      ? payload.data
      : [];
    const approvedPosts = items.filter(
      (item: { status?: string }) => item?.status === "APPROVED"
    );

    return approvedPosts.length > 0;
  } catch (error) {
    console.error("[AchievementScreen] checkFirstBlog error", error);
    return false;
  }
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    // flexDirection: "row",
    // justifyContent: "space-between",
    // alignItems: "center",
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 20,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
  rankValue: {
    fontSize: 22,
    fontFamily: "inter-bold",
  },
  rankSubtitle: {
    marginTop: 4,
    fontSize: 12,
    fontFamily: "inter-medium",
    color: Colors.GRAY,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    // marginLeft: 16,
    marginBottom: 12,
  },
  statIconHighlight: {
    backgroundColor: "rgba(250, 204, 21, 0.18)",
  },
  filterCard: {
    backgroundColor: Colors.WHITE,
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginTop: 4,
    shadowColor: Colors.BLACK,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    borderColor: Colors.GREEN,
    shadowColor: Colors.GREEN,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
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
